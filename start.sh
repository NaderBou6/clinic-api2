#!/bin/sh
set -e

# إنشاء .env إذا لم يوجد
if [ ! -f .env ]; then
  cp .env.example .env
fi

# تأكد من وجود APP_KEY
if ! grep -q "^APP_KEY=" .env || [ -z "$(grep '^APP_KEY=' .env | cut -d= -f2)" ]; then
  php artisan key:generate --force
fi

php artisan config:clear
php artisan cache:clear

exec apache2-foreground
