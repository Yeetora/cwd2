#!/bin/bash
# cwd2 EC2 부트스트랩 (Amazon Linux 2023 ARM64)
# 실행 시점: 최초 부팅 1회
# 이 스크립트는 OS + 패키지 + systemd unit + 디렉터리 준비.
# 애플리케이션 jar/build는 별도 배포 스크립트로 업로드.

set -euxo pipefail
exec > >(tee /var/log/user-data.log) 2>&1

dnf update -y

# ── 패키지 ────────────────────────────────────────────
dnf install -y java-21-amazon-corretto-headless
dnf install -y mariadb105-server
dnf install -y nginx

# Node 24
curl -fsSL https://rpm.nodesource.com/setup_24.x | bash -
dnf install -y nodejs

# 유용한 유틸
dnf install -y unzip jq tar

systemctl enable --now mariadb
systemctl enable --now nginx

# ── 디렉터리 구조 ─────────────────────────────────────
mkdir -p /opt/cwd2/backend
mkdir -p /opt/cwd2/frontend
mkdir -p /opt/cwd2/env
mkdir -p /opt/cwd2/scripts
chown -R ec2-user:ec2-user /opt/cwd2
touch /var/log/cwd2-backend.log /var/log/cwd2-frontend.log
chown ec2-user:ec2-user /var/log/cwd2-backend.log /var/log/cwd2-frontend.log

# ── env 파일 placeholder (실 시크릿은 배포 시 SSM에서 가져옴) ──
cat > /opt/cwd2/env/backend.env <<'ENV'
SPRING_PROFILES_ACTIVE=prod
SERVER_PORT=8080
# DB
DB_URL=jdbc:mysql://localhost:3306/cwd2?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
DB_USERNAME=cwd2
DB_PASSWORD=PLACEHOLDER_FROM_SSM
# Admin seed
ADMIN_USERNAME=admin
ADMIN_PASSWORD=PLACEHOLDER_FROM_SSM
ADMIN_EMAIL=ops@example.com
# Auth
APP_AUTH_SECRET=PLACEHOLDER_FROM_SSM
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=Lax
CORS_ALLOWED_ORIGINS=http://localhost,http://127.0.0.1
# Storage
STORAGE_TYPE=s3
S3_BUCKET=PLACEHOLDER_FROM_SSM
S3_REGION=ap-northeast-2
ENV
chown ec2-user:ec2-user /opt/cwd2/env/backend.env
chmod 600 /opt/cwd2/env/backend.env

cat > /opt/cwd2/env/frontend.env <<'ENV'
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
NEXT_PUBLIC_API_BASE=
ENV
chown ec2-user:ec2-user /opt/cwd2/env/frontend.env

# ── systemd units ─────────────────────────────────────
cat > /etc/systemd/system/cwd2-backend.service <<'UNIT'
[Unit]
Description=cwd2 Backend (Spring Boot)
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cwd2/backend
EnvironmentFile=/opt/cwd2/env/backend.env
ExecStart=/usr/bin/java -Xms256m -Xmx640m -jar /opt/cwd2/backend/app.jar
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/cwd2-backend.log
StandardError=append:/var/log/cwd2-backend.log
SuccessExitStatus=143

[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/systemd/system/cwd2-frontend.service <<'UNIT'
[Unit]
Description=cwd2 Frontend (Next.js standalone)
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/cwd2/frontend
EnvironmentFile=/opt/cwd2/env/frontend.env
ExecStart=/usr/bin/node /opt/cwd2/frontend/server.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/cwd2-frontend.log
StandardError=append:/var/log/cwd2-frontend.log

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
# enable만 — 아직 jar/build 없으므로 start는 배포 후
systemctl enable cwd2-backend.service
systemctl enable cwd2-frontend.service

# ── MySQL 초기화 (DB + 유저, 비밀번호는 배포 스크립트가 ALTER) ──
mysql -e "CREATE DATABASE IF NOT EXISTS cwd2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'cwd2'@'localhost' IDENTIFIED BY 'placeholder';"
mysql -e "GRANT ALL PRIVILEGES ON cwd2.* TO 'cwd2'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# ── Nginx 설정 ────────────────────────────────────────
cat > /etc/nginx/conf.d/cwd2.conf <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 60M;

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

# default_server 충돌 방지
sed -i 's/listen       80 default_server;/listen       80;/' /etc/nginx/nginx.conf || true
sed -i 's/listen       \[::\]:80 default_server;/listen       [::]:80;/' /etc/nginx/nginx.conf || true

nginx -t && systemctl reload nginx

echo "Bootstrap complete." > /tmp/bootstrap.done
