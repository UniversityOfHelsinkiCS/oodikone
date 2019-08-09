FROM node:10.15-alpine

WORKDIR /usr/src/app
EXPOSE 5000
CMD serve -s -l 5000 dist

COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json
COPY package.json /usr/src/cache/package.json
COPY package-lock.json /usr/src/cache/package-lock.json
RUN npm ci

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH
ARG SENTRY_RELEASE_VERSION
ENV SENTRY_RELEASE_VERSION=${SENTRY_RELEASE_VERSION}
ARG SENTRY_URL
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_ORG
ARG SENTRY_PROJECT
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

COPY . /usr/src/app
RUN if [ "${NODE_ENV}" != "development" ]; then npm run dist && npm install -g serve; fi

