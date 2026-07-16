FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

ENV TZ="Europe/Helsinki"

USER 0

WORKDIR /opt/app-root/shared
COPY --chown=1001:0 ./shared .
RUN npm ci && chown -R 1001:0 /opt/app-root/shared

WORKDIR /opt/app-root/frontend
COPY --chown=1001:0 ./frontend .
RUN npm ci && chown -R 1001:0 /opt/app-root/frontend

EXPOSE 3000

USER 1001
CMD ["node_modules/.bin/vite"]
