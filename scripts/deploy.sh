#!/usr/bin/env bash
# ==============================================================================
# Script Otomasi Deploy OIA UNRAM Website (Self-Hosted Node.js Server)
# Sistem Operasi Target: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e # Berhenti jika ada error

APP_DIR="/var/www/oia-web"
BRANCH="main"
PM2_APP_NAME="oia-unram"

echo "=== [1/5] Memulai Proses Deploy OIA UNRAM Website ==="
cd "$APP_DIR"

echo "=== [2/5] Mengambil Perubahan Kode Terbaru dari Git ==="
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "=== [3/5] Memasang Dependensi Produksi ==="
npm ci --prefer-offline --no-audit

echo "=== [4/5] Membangun Aplikasi (Standalone Mode) ==="
export BUILD_STANDALONE=1
export NODE_ENV=production
npm run build

# Salin aset publik dan statis ke folder standalone Next.js
echo "Menyalin aset statis ke .next/standalone..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "=== [5/5] Me-restart Layanan PM2 ==="
if pm2 list | grep -q "$PM2_APP_NAME"; then
    echo "Reloading PM2 process $PM2_APP_NAME dengan zero-downtime..."
    pm2 reload "$PM2_APP_NAME"
else
    echo "Memulai proses baru di PM2..."
    pm2 start .next/standalone/server.js --name "$PM2_APP_NAME" -i max
fi

pm2 save

echo "=========================================================="
echo " Deploy Sukses! Website aktif di https://oia.unram.ac.id"
echo "=========================================================="
