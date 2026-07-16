FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/shared
COPY ./shared .
RUN npm ci

WORKDIR /opt/app-root/frontend
COPY ./frontend .
RUN npm ci

EXPOSE 3000

CMD ["node_modules/.bin/vite"]
