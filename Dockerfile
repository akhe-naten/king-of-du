FROM node:20-alpine

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    KWA_DATA_DIR=/app/data \
    COOKIE_SECURE=false

WORKDIR /app

RUN addgroup -S app && adduser -S app -G app

COPY package.json ./
COPY src ./src
COPY public ./public
COPY config ./config
COPY scripts ./scripts

RUN mkdir -p /app/data && chown -R app:app /app

USER app

EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "src/server.js"]
