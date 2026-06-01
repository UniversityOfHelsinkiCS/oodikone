FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

ENV TZ="Europe/Helsinki"

COPY --chown=1001:1001 ./.npmrc .
COPY --chown=1001:1001 ./package* .

USER 1001
RUN npm ci
COPY --chown=1001:1001 . .

CMD ["node", "--watch", "src/index.js"]
