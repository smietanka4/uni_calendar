FROM nginx:1.27-alpine
# Plik z definicjami stref rate limiting (musi być załadowany przed server blockiem)
COPY rate_limit.conf /etc/nginx/conf.d/00_rate_limit.conf
# Główna konfiguracja serwera
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
