FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

COPY --chown=1001:1001 ./.npmrc .
COPY --chown=1001:1001 ./package*.json ./

USER 1001
RUN npm ci
COPY --chown=1001:1001 . .

CMD ["node_modules/.bin/nodemon", "--exec", "node src/index.js", "--watch", "src", "--watch", "--ext", "ts, js, json", "--legacy-watch"]
