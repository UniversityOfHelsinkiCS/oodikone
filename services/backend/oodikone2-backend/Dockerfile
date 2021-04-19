FROM node:14-alpine

WORKDIR /usr/src/app
EXPOSE 8080
CMD npm start

COPY ./oodikone2-backend/package* ./

RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ARG TAG=local
ENV TAG=${TAG}

COPY ./oodikone2-backend /usr/src/app
COPY ./shared/models /usr/src/app/src/models
COPY ./shared/migrations /usr/src/app/src/database/migrations
COPY ./shared/migrations_kone /usr/src/app/src/database/migrations_kone

