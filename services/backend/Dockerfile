FROM registry.access.redhat.com/ubi10/nodejs-22-minimal AS build

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

ARG BASE_PATH
ENV PUBLIC_URL=$BASE_PATH

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

ARG SENTRY_ENVIRONMENT
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

WORKDIR /opt/app-root/shared
COPY ./shared .

WORKDIR /opt/app-root/backend
COPY ./backend .

WORKDIR /opt/app-root

RUN npm ci --include=dev --prefix shared && npm ci --include=dev --prefix backend
RUN npm run build --prefix shared && npm run build --prefix backend


FROM registry.access.redhat.com/ubi10/nodejs-22-minimal

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

ARG BASE_PATH
ENV PUBLIC_URL=$BASE_PATH

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

ARG SENTRY_ENVIRONMENT
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

WORKDIR /opt/app-root/shared
COPY --from=build /opt/app-root/shared/dist .

WORKDIR /opt/app-root/backend
COPY --from=build /opt/app-root/backend/package*.json .
COPY --from=build /opt/app-root/backend/dist ./dist

RUN npm ci --omit=dev

EXPOSE 8080
CMD ["node", "dist/index.js"]
