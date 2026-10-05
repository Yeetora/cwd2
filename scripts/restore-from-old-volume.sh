#!/usr/bin/env bash
# EC2가 교체됐을 때, 남아 있는 이전 루트 볼륨에서 DB·env·앱을 새 인스턴스로 복원한다.
# 이전 볼륨은 읽기 전용으로만 마운트하므로 원본은 변경되지 않는다.
#
# 사용: OLD_VOLUME=vol-xxx ./scripts/restore-from-old-volume.sh
set -euo pipefail

R="${AWS_REGION:-ap-northeast-2}"
STACK_NAME="${STACK_NAME:-Cwd2InfraStack}"
OLD_VOLUME="${OLD_VOLUME:?OLD_VOLUME=vol-... 를 지정하세요}"
NEW=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$R" \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" --output text)
echo "새 인스턴스: $NEW / 이전 볼륨: $OLD_VOLUME"

state=$(aws ec2 describe-volumes --region "$R" --volume-ids "$OLD_VOLUME" --query "Volumes[0].State" --output text)
if [[ "$state" == "available" ]]; then
  echo "▶ 이전 볼륨 연결 (/dev/sdf)"
  aws ec2 attach-volume --region "$R" --volume-id "$OLD_VOLUME" --instance-id "$NEW" --device /dev/sdf >/dev/null
  aws ec2 wait volume-in-use --region "$R" --volume-ids "$OLD_VOLUME"
  sleep 10
fi

echo "▶ 인스턴스에서 복원 실행"
PARAMS=$(mktemp)
python3 - "$PARAMS" <<'PY'
import json, sys
script = r'''
set -euxo pipefail
for i in $(seq 1 60); do [ -f /tmp/bootstrap.done ] && break; sleep 10; done
test -f /tmp/bootstrap.done
ROOT_PART=$(findmnt -no SOURCE /)
# 현재 루트가 아닌 xfs 파티션 = 이전 볼륨의 루트
OLD_PART=$(lsblk -lnpo NAME,FSTYPE | awk '$2=="xfs"{print $1}' | grep -vx "$ROOT_PART" | head -1)
test -n "$OLD_PART"
mkdir -p /mnt/old
mountpoint -q /mnt/old || mount -o ro,nouuid "$OLD_PART" /mnt/old
test -d /mnt/old/var/lib/mysql/cwd2
test -f /mnt/old/opt/cwd2/backend/app.jar

systemctl stop cwd2-backend cwd2-frontend || true
systemctl stop mariadb
mv /var/lib/mysql "/var/lib/mysql.empty.$(date +%s)"
cp -a /mnt/old/var/lib/mysql /var/lib/mysql
for d in env backend frontend; do
  rm -rf "/opt/cwd2/$d"
  cp -a "/mnt/old/opt/cwd2/$d" "/opt/cwd2/$d"
done
chown -R ec2-user:ec2-user /opt/cwd2
systemctl start mariadb
systemctl restart cwd2-backend cwd2-frontend
umount /mnt/old
sleep 25
systemctl is-active mariadb cwd2-backend cwd2-frontend nginx
curl -s -o /dev/null -w "local health %{http_code}\n" http://127.0.0.1/api/health
'''
json.dump({"commands": [script]}, open(sys.argv[1], "w"))
PY
CMD=$(aws ssm send-command --region "$R" --instance-ids "$NEW" --document-name AWS-RunShellScript \
  --comment "cwd2 restore from $OLD_VOLUME" --timeout-seconds 900 \
  --parameters "file://$PARAMS" --query Command.CommandId --output text)
rm -f "$PARAMS"
aws ssm wait command-executed --region "$R" --command-id "$CMD" --instance-id "$NEW" || true
aws ssm get-command-invocation --region "$R" --command-id "$CMD" --instance-id "$NEW" \
  --query "[Status,StandardOutputContent,StandardErrorContent]" --output text | tail -20
