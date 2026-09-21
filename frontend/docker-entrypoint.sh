#!/bin/sh
set -eu

export APP_PORT="${APP_PORT:-8080}"

envsubst '${APP_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
