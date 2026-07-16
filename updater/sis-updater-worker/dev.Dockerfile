FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

USER 0

COPY --chown=1001:0 . .
RUN npm ci --include=dev && chown -R 1001:0 /opt/app-root/src

USER 1001

CMD ["node_modules/.bin/nodemon", "--exec", "node src/index.js", "--watch", "src", "--watch", "--ext", "ts, js, json", "--legacy-watch"]
