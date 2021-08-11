FROM node:14.17-alpine3.13 as base

WORKDIR /usr/src/app

FROM base as development
COPY ./package* /usr/src/app/
RUN npm ci
COPY . /usr/src/app/
EXPOSE 3000
CMD ["npm", "start"]

FROM base as production
ARG SENTRY_ENVIRONMENT
ENV REACT_APP_SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ARG SENTRY_RELEASE
ENV REACT_APP_SENTRY_RELEASE=$SENTRY_RELEASE
ARG BUILT_AT
ENV REACT_APP_BUILT_AT=$BUILT_AT
COPY --chown=node:node ./package* /usr/src/app/
RUN npm ci --production
COPY --chown=node:node . /usr/src/app/
RUN npm run build && npm install -g serve@12.0.0 && chown -R node:node /usr/src/app/build
USER node
EXPOSE 5000
CMD ["serve", "--single", "--listen", "5000", "build"]
