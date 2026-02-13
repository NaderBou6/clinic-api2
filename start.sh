#!/bin/sh

echo "Fix Apache MPM..."
a2dismod mpm_event || true
a2dismod mpm_worker || true
a2enmod mpm_prefork || true

echo "Create .env if not exists..."
if [ ! -f .env ]; then
  cp .env.example .env
fi

echo "Inject APP_KEY from Railway..."
php artisan config:clear
php artisan cache:clear

echo "Run migrations..."
php artisan migrate --force || true

echo "Start Apache..."
apache2-foreground

