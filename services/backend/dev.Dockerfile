FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096

USER 0

WORKDIR /opt/app-root/shared
COPY --chown=1001:0 ./shared .
RUN npm ci && chown -R 1001:0 /opt/app-root/shared

WORKDIR /opt/app-root/backend
COPY --chown=1001:0 ./backend .
RUN npm ci && chown -R 1001:0 /opt/app-root/backend

EXPOSE 8080

USER 1001
CMD ["node_modules/.bin/nodemon", "--exec", "node --import tsx index.ts", "--ext", "ts,js,json", "--watch", "src", "--watch", "index.ts", "--legacy-watch"]
