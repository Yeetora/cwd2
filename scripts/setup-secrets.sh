#!/usr/bin/env bash
# 운영 시크릿을 SSM Parameter Store에 등록 + EC2 env file에 반영
#
# 한 번만 실행하면 됨. 이후 비밀번호 회전 시 다시 실행.
#
# 사용:
#   ./scripts/setup-secrets.sh
#   (prompt로 비밀번호 입력받음)

set -euo pipefail

cd "$(dirname "$0")/.."

STACK_NAME="${STACK_NAME:-Cwd2InfraStack}"
REGION="${AWS_REGION:-ap-northeast-2}"
SSM_PREFIX="/cwd2/prod"

# CloudFormation에서 자동 조회
INSTANCE_ID=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='InstanceId'].OutputValue" --output text)
UPLOADS_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='UploadsBucketName'].OutputValue" --output text)
PUBLIC_IP=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" --region "$REGION" \
  --query "Stacks[0].Outputs[?OutputKey=='PublicIp'].OutputValue" --output text)

echo "▶ Stack outputs:"
echo "    InstanceId    : $INSTANCE_ID"
echo "    UploadsBucket : $UPLOADS_BUCKET"
echo "    PublicIp      : $PUBLIC_IP"
echo

# ── 비밀번호 입력 ────────────────────────────────────
read -srp "DB_PASSWORD (cwd2 MySQL 유저용, 14자 이상 권장): " DB_PASSWORD; echo
read -srp "ADMIN_PASSWORD (관리자 페이지 로그인용): " ADMIN_PASSWORD; echo
read -rp "ADMIN_EMAIL (운영 알림 수신): " ADMIN_EMAIL

# JWT secret 자동 생성
AUTH_SECRET=$(openssl rand -base64 48 | tr -d '\n')
echo "▶ Generated APP_AUTH_SECRET (64 chars base64)"

# ── SSM Parameter Store에 저장 ───────────────────────
put() {
  aws ssm put-parameter --region "$REGION" \
    --name "$1" --value "$2" --type SecureString --overwrite >/dev/null
  echo "  ✓ $1"
}

echo "▶ Saving to SSM Parameter Store at $SSM_PREFIX/*"
put "$SSM_PREFIX/DB_PASSWORD"     "$DB_PASSWORD"
put "$SSM_PREFIX/ADMIN_PASSWORD"  "$ADMIN_PASSWORD"
put "$SSM_PREFIX/ADMIN_EMAIL"     "$ADMIN_EMAIL"
put "$SSM_PREFIX/APP_AUTH_SECRET" "$AUTH_SECRET"
put "$SSM_PREFIX/S3_BUCKET"       "$UPLOADS_BUCKET"
put "$SSM_PREFIX/CORS_ALLOWED_ORIGINS" "http://$PUBLIC_IP"

# ── EC2에서 env 파일 + DB 비밀번호 동기화 ────────────
echo
echo "▶ Syncing env file + ALTER MySQL user via SSM"
CMD_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --region "$REGION" \
  --comment "cwd2 setup-secrets" \
  --parameters "commands=[
    'set -e',
    'DB_PASSWORD=\$(aws ssm get-parameter --name $SSM_PREFIX/DB_PASSWORD --with-decryption --query Parameter.Value --output text --region $REGION)',
    'ADMIN_PASSWORD=\$(aws ssm get-parameter --name $SSM_PREFIX/ADMIN_PASSWORD --with-decryption --query Parameter.Value --output text --region $REGION)',
    'ADMIN_EMAIL=\$(aws ssm get-parameter --name $SSM_PREFIX/ADMIN_EMAIL --with-decryption --query Parameter.Value --output text --region $REGION)',
    'APP_AUTH_SECRET=\$(aws ssm get-parameter --name $SSM_PREFIX/APP_AUTH_SECRET --with-decryption --query Parameter.Value --output text --region $REGION)',
    'S3_BUCKET=\$(aws ssm get-parameter --name $SSM_PREFIX/S3_BUCKET --with-decryption --query Parameter.Value --output text --region $REGION)',
    'CORS=\$(aws ssm get-parameter --name $SSM_PREFIX/CORS_ALLOWED_ORIGINS --with-decryption --query Parameter.Value --output text --region $REGION)',
    'sudo tee /opt/cwd2/env/backend.env > /dev/null <<EOF',
    'SPRING_PROFILES_ACTIVE=prod',
    'SERVER_PORT=8080',
    'DB_URL=jdbc:mysql://localhost:3306/cwd2?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8&allowPublicKeyRetrieval=true',
    'DB_USERNAME=cwd2',
    \"DB_PASSWORD=\$DB_PASSWORD\",
    'ADMIN_USERNAME=admin',
    \"ADMIN_PASSWORD=\$ADMIN_PASSWORD\",
    \"ADMIN_EMAIL=\$ADMIN_EMAIL\",
    \"APP_AUTH_SECRET=\$APP_AUTH_SECRET\",
    'AUTH_COOKIE_SECURE=false',
    'AUTH_COOKIE_SAME_SITE=Lax',
    \"CORS_ALLOWED_ORIGINS=\$CORS\",
    'STORAGE_TYPE=s3',
    \"S3_BUCKET=\$S3_BUCKET\",
    'S3_REGION=$REGION',
    'EOF',
    'sudo chown ec2-user:ec2-user /opt/cwd2/env/backend.env',
    'sudo chmod 600 /opt/cwd2/env/backend.env',
    'sudo mysql -e \"ALTER USER cwd2@localhost IDENTIFIED BY \\\\\"\$DB_PASSWORD\\\\\";\"',
    'sudo mysql -e \"FLUSH PRIVILEGES;\"',
    'echo done'
  ]" \
  --query "Command.CommandId" --output text)

echo "  CommandId: $CMD_ID"
aws ssm wait command-executed --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION"

STATUS=$(aws ssm get-command-invocation \
  --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" \
  --query "Status" --output text)

echo "▶ Status: $STATUS"

if [[ "$STATUS" != "Success" ]]; then
  aws ssm get-command-invocation \
    --command-id "$CMD_ID" --instance-id "$INSTANCE_ID" --region "$REGION" \
    --query "StandardErrorContent" --output text
  exit 1
fi

echo "✅ Secrets registered + EC2 env file synced + MySQL password updated"
