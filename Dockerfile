# 1) PHP 8.2 + Apache
FROM php:8.2-apache

# 2) System deps + PHP extensions
RUN apt-get update && apt-get install -y \
    git unzip curl libzip-dev libpng-dev libonig-dev libicu-dev \
    && docker-php-ext-install pdo_mysql zip intl \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# 3) Set Apache docroot to Laravel /public
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# 4) Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 5) Install Node (for Vite build)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 6) Copy app
WORKDIR /var/www/html
COPY . .

# 7) Install PHP deps
RUN composer install --no-dev --optimize-autoloader

# 8) Build frontend
RUN npm ci || npm install
RUN npm run build

# 9) Permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# 10) Laravel key at runtime (only if not set)
# We'll generate in Railway variables or on first boot using a start script.
CMD ["sh", "/var/www/html/start.sh"]

