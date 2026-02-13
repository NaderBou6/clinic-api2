#!/bin/sh
set -e

# إذا APP_KEY غير موجود، توليد واحد (مرة)
if [ -z "$APP_KEY" ]; then
  echo "APP_KEY is empty. Generating..."
  php artisan key:generate --force
fi

# Cache (اختياري لكن مفيد)
php artisan config:cache || true
php artisan route:cache || true
php artisan view:cache || true

# ملاحظة: migrations نخليها manual أول مرة لتفادي مشاكل DB غير جاهزة
exec apache2-foreground
