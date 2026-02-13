FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev libpng-dev libonig-dev libicu-dev \
    && docker-php-ext-install pdo_mysql zip intl \
    && a2enmod rewrite \
    && a2dismod mpm_event mpm_worker || true \
    && a2enmod mpm_prefork \
    && sed -i '/mpm_event_module/d' /etc/apache2/apache2.conf \
    && sed -i '/mpm_worker_module/d' /etc/apache2/apache2.conf \
    && rm -f /etc/apache2/mods-enabled/mpm_event.load \
    && rm -f /etc/apache2/mods-enabled/mpm_worker.load \
    && rm -rf /var/lib/apt/lists/*

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --optimize-autoloader
RUN npm ci || npm install
RUN npm run build

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

CMD ["sh", "/var/www/html/start.sh"]
