FROM registry.access.redhat.com/ubi9/nodejs-22-minimal AS build

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

WORKDIR /opt/app-root/shared
COPY ./shared .

WORKDIR /opt/app-root/backend

ARG BASE_PATH
ENV PUBLIC_URL=$BASE_PATH

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

ARG SENTRY_ENVIRONMENT
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

COPY ./backend/package*.json ./
RUN npm ci --include=dev
COPY ./backend .

RUN npm run build



FROM registry.access.redhat.com/ubi9/nodejs-22-minimal

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

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

COPY --from=build /opt/app-root/backend/package*.json ./
COPY --from=build /opt/app-root/backend/dist ./dist

RUN npm ci

EXPOSE 8080
CMD ["node", "dist/index.js"]
