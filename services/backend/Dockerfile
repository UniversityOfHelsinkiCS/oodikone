FROM node:14.17-alpine3.13 as base

WORKDIR /usr/src/app
EXPOSE 8080

FROM base as development
ENV NODE_ENV=development
COPY ./package* /usr/src/app/
RUN npm ci
COPY . /usr/src/app/
CMD ["npm", "run", "dev"]

FROM base as production
ENV NODE_ENV=production
ARG SENTRY_ENVIRONMENT
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE
COPY --chown=node:node ./package* /usr/src/app/
RUN npm ci --production && apk add --no-cache vim curl nano
COPY --chown=node:node . /usr/src/app/
USER node
CMD ["npm", "start"]
