FROM node:14-alpine

WORKDIR /usr/src/app
EXPOSE 5000
CMD serve -s -l 5000 dist

COPY ./package* ./

RUN npm ci

ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG TAG=local
ENV TAG=${TAG}
ARG SENTRY_RELEASE
ENV REACT_APP_SENTRY_RELEASE=$SENTRY_RELEASE

COPY . /usr/src/app
RUN if [ "${NODE_ENV}" != "development" ]; then \
      export CHECKSUM="$(find . ! -path */node_modules/* -type f -exec md5sum {} \; | sort -k 2 | printf "$(cat - )\\nBASE_PATH ${BASE_PATH}" | md5sum | awk '{ print $1 }')" && \
      export SENTRY_RELEASE_VERSION="${NODE_ENV}-${CHECKSUM}" && \
      echo "${SENTRY_RELEASE_VERSION}" > /SENTRY_RELEASE_VERSION && \
      SENTRY_RELEASE_VERSION="${SENTRY_RELEASE_VERSION}" npm run dist && \
      npm install -g serve; \
    fi
