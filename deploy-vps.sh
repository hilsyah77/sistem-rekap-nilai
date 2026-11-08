#!/usr/bin/env bash
# ============================================================================
# SCRIPT OTOMATIS DEPLOY & SETUP DATABASE MYSQL DI VPS (UBUNTU / DEBIAN)
# Domain : rekapnilai.mtsasyjtb.cloud
# IP VPS : 80.43.0.177
# ============================================================================

set -e

if [ "$(id -u)" -eq 0 ]; then
  SUDO=""
else
  SUDO="sudo"
fi

DB_NAME="sisforekap_db"
DB_USER="sisforekap_user"
DB_PASS="SisfoRekap2026!"
APP_PORT="3000"
DOMAIN_NAME="${1:-rekapnilai.mtsasyjtb.cloud}"

echo "============================================================"
echo " 1. Update Paket Sistem & Install Node.js, MySQL/MariaDB, Nginx"
echo "============================================================"
export DEBIAN_FRONTEND=noninteractive
$SUDO apt-get update -y
$SUDO apt-get install -y curl git nginx ca-certificates gnupg

# Install MariaDB/MySQL jika belum ada command mysql
if ! command -v mysql >/dev/null 2>&1; then
  $SUDO apt-get install -y mariadb-server
fi

# Install Node.js 20 LTS & npm jika belum ada node atau npm
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
fi

# Pastikan service database aktif
$SUDO systemctl enable mariadb >/dev/null 2>&1 || $SUDO systemctl enable mysql >/dev/null 2>&1 || true
$SUDO systemctl start mariadb >/dev/null 2>&1 || $SUDO systemctl start mysql >/dev/null 2>&1 || true

echo "============================================================"
echo " 2. Membuat Database MySQL & User ($DB_NAME)"
echo "============================================================"
$SUDO mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
$SUDO mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
$SUDO mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';"
$SUDO mysql -e "ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';" || true
$SUDO mysql -e "ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';" || true
$SUDO mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
$SUDO mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';"
$SUDO mysql -e "FLUSH PRIVILEGES;"

echo "============================================================"
echo " 3. Import Struktur Tabel Database (database/schema.sql)"
echo "============================================================"
$SUDO mysql "${DB_NAME}" < ./database/schema.sql

echo "============================================================"
echo " 4. Konfigurasi Backend (.env) & Install Dependencies"
echo "============================================================"
cat > ./backend/.env <<EOF
PORT=${APP_PORT}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_NAME=${DB_NAME}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin2026
ADMIN_NAME="Apris Dwi Priyatomo, S.Pd"
EOF

cd ./backend
npm install --omit=dev
cd ..

echo "============================================================"
echo " 5. Menjalankan Server Backend & Frontend dengan PM2"
echo "============================================================"
if ! command -v pm2 >/dev/null 2>&1; then
  $SUDO npm install -g pm2
fi

pm2 delete sisforekap-app >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup systemd -u "$(whoami)" --hp "$HOME" >/dev/null 2>&1 || true

echo "============================================================"
echo " 6. Konfigurasi Nginx Reverse Proxy (${DOMAIN_NAME} -> ${APP_PORT})"
echo "============================================================"
# Matikan apache2 jika sedang memakai port 80
if systemctl is-active --quiet apache2; then
  $SUDO systemctl stop apache2 || true
  $SUDO systemctl disable apache2 || true
fi

$SUDO tee /etc/nginx/sites-available/sisforekap >/dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} 80.43.0.177 _;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

$SUDO ln -sf /etc/nginx/sites-available/sisforekap /etc/nginx/sites-enabled/sisforekap
$SUDO rm -f /etc/nginx/sites-enabled/default
$SUDO nginx -t
$SUDO systemctl enable nginx
$SUDO systemctl restart nginx

echo "============================================================"
echo " SELESAI! Aplikasi & Database MySQL telah aktif di VPS!"
echo " - Domain Aplikasi : http://${DOMAIN_NAME}"
echo " - IP VPS          : http://80.43.0.177"
echo " - Database MySQL  : ${DB_NAME}"
echo " - User Database   : ${DB_USER}"
echo "============================================================"
