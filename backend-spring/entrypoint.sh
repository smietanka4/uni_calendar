#!/bin/sh
set -e

echo "Waiting for database..."
until nc -z ${POSTGRES_HOST:-db} ${POSTGRES_PORT:-5432} 2>/dev/null; do
  sleep 1
done
echo "Database ready."

exec java \
  -Djava.security.egd=file:/dev/./urandom \
  -jar app.jar
