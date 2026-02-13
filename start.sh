#!/bin/sh
set -e

cd /var/www/html

# Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
fi

# Write Railway env vars into .env (important)
php -r '
$vars = ["APP_KEY","APP_ENV","APP_DEBUG","APP_URL","DB_CONNECTION","DB_HOST","DB_PORT","DB_DATABASE","DB_USERNAME","DB_PASSWORD"];
$envFile = ".env";
$content = file_exists($envFile) ? file_get_contents($envFile) : "";
foreach ($vars as $k) {
  $v = getenv($k);
  if ($v !== false && $v !== "") {
    if (preg_match("/^{$k}=.*$/m", $content)) {
      $content = preg_replace("/^{$k}=.*$/m", "{$k}={$v}", $content);
    } else {
      $content .= "\n{$k}={$v}";
    }
  }
}
file_put_contents($envFile, trim($content)."\n");
'

php artisan config:clear || true
php artisan cache:clear || true

exec apache2-foreground

