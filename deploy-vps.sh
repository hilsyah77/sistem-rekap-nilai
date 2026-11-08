#!/usr/bin/env bash
# ============================================================================
# SCRIPT OTOMATIS DEPLOY & SETUP DATABASE MYSQL DI VPS (UBUNTU / DEBIAN)
# Sistem Informasi Rekapitulasi Nilai Siswa Kelas IX
# ============================================================================

set -e

DB_NAME="sisforekap_db"
DB_USER="sisforekap_user"
DB_PASS="SisfoRekap2026!"
APP_PORT="3000"
DOMAIN_NAME="${1:-_}"

echo "============================================================"
echo " 1. Update Paket Sistem & Install Node.js, MySQL, Nginx"
echo "============================================================"
sudo apt-get update -y
sudo apt-get install -y curl git mariadb-server nginx

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

sudo systemctl enable mariadb
sudo systemctl start mariadb

echo "============================================================"
echo " 2. Membuat Database MySQL & User ($DB_NAME)"
echo "============================================================"
sudo mysql -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';"
sudo mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';"
sudo mysql -e "GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "============================================================"
echo " 3. Import Struktur Tabel Database (database/schema.sql)"
echo "============================================================"
sudo mysql "${DB_NAME}" < ./database/schema.sql

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
sudo npm install -g pm2
pm2 delete sisforekap-app >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u "$USER" --hp "$HOME" || true

echo "============================================================"
echo " 6. Konfigurasi Nginx Reverse Proxy (Port 80 -> ${APP_PORT})"
echo "============================================================"
sudo tee /etc/nginx/sites-available/sisforekap >/dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

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

sudo ln -sf /etc/nginx/sites-available/sisforekap /etc/nginx/sites-enabled/sisforekap
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "============================================================"
echo " SELESAI! Aplikasi & Database MySQL telah aktif di VPS!"
echo " - Database MySQL : ${DB_NAME}"
echo " - User Database  : ${DB_USER}"
echo " - URL Aplikasi   : http://$(hostname -I | awk '{print $1}')"
echo "============================================================"
