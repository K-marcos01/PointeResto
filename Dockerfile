FROM php:8.3-cli

# Dépendances système et extensions PHP requises (PostgreSQL + Redis + curl pour healthcheck)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq-dev curl \
    && docker-php-ext-install pdo_pgsql \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie du code backend et du script SQL
COPY Backend/ /app/Backend/
COPY database/ /app/database/

# Préparation du répertoire d'upload sécurisé
RUN mkdir -p /app/Backend/Public/uploads \
    && chmod 755 /app/Backend/Public/uploads

ENV APP_ENV=production \
    PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS "http://localhost:${PORT:-8000}/Index.php?route=health" || exit 1

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8000} -t /app/Backend/Public"]