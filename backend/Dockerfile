FROM php:8.3-fpm-alpine AS base

RUN apk add --no-cache \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    oniguruma-dev \
    icu-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        zip \
        mbstring \
        intl \
        opcache \
        gd

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ── DEV ────────────────────────────────────────────────────────────────────────
FROM base AS dev

RUN apk add --no-cache $PHPIZE_DEPS linux-headers \
    && pecl install xdebug \
    && docker-php-ext-enable xdebug

COPY php/xdebug.ini /usr/local/etc/php/conf.d/xdebug.ini

# Les sources sont montées en volume, pas copiées
CMD ["php-fpm"]

# ── PROD ───────────────────────────────────────────────────────────────────────
FROM base AS prod

COPY php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && php bin/console cache:warmup --env=prod

CMD ["php-fpm"]
