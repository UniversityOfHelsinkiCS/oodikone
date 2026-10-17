FROM registry.access.redhat.com/ubi10/nodejs-24-minimal AS build

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

COPY ./.npmrc .
COPY ./package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build


FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV NODE_ENV=production

ENV TZ="Europe/Helsinki"

ARG SENTRY_ENVIRONMENT
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

COPY --from=build /opt/app-root/src/.npmrc .
COPY --from=build /opt/app-root/src/package*.json ./
COPY --from=build /opt/app-root/src/dist ./dist
RUN npm ci --omit=dev

CMD ["node", "dist/src/index.js"]
