FROM node:14-alpine

WORKDIR /usr/src/app
CMD npm start

RUN apk add postgresql-client

COPY ./updater_writer/package* ./

RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY ./updater_writer /usr/src/app
COPY ./shared/models /usr/src/app/models
COPY ./shared/migrations /usr/src/app/database/migrations
COPY ./shared/migrations_kone /usr/src/app/database/migrations_kone
