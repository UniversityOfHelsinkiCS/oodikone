FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

USER 1001

COPY --chown=1001:1001 ./.npmrc .
COPY --chown=1001:1001 ./package*.json ./

RUN npm ci --include dev
COPY --chown=1001:1001 . .

EXPOSE 8082

CMD ["node_modules/.bin/nodemon", "--exec", "node src/index.js", "--watch", "src", "--watch", "--ext", "ts, js, json", "--legacy-watch"]
