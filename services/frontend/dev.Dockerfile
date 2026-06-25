FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

ENV TZ="Europe/Helsinki"

USER 1001

WORKDIR /opt/app-root/shared
COPY --chown=1001:1001 ./shared .

RUN npm ci

WORKDIR /opt/app-root/frontend
COPY --chown=1001:1001 ./frontend .

RUN npm ci

EXPOSE 3000
CMD ["node_modules/.bin/vite"]
