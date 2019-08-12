FROM node:10.15-alpine

WORKDIR /usr/src/app
CMD npm start

RUN apk add postgresql-client
COPY ./updater_writer/package.json /usr/src/app/package.json
COPY ./updater_writer/package-lock.json /usr/src/app/package-lock.json
COPY ./updater_writer/package.json /usr/src/cache/package.json
COPY ./updater_writer/package-lock.json /usr/src/cache/package-lock.json
RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

COPY ./updater_writer /usr/src/app
COPY ./shared/models /usr/src/app/models
COPY ./shared/migrations /usr/src/app/database/migrations
COPY ./shared/migrations_kone /usr/src/app/database/migrations_kone

