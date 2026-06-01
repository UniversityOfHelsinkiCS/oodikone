FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

COPY --chown=1001:1001 ./.npmrc .
COPY --chown=1001:1001 ./package* .

USER 1001
RUN npm ci
COPY --chown=1001:1001 . .

EXPOSE 8082

CMD ["node", "--watch", "src/index.js"]
