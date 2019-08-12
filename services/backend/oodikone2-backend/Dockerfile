FROM node:10.15-alpine

WORKDIR /usr/src/app
EXPOSE 8080
CMD npm start

COPY ./oodikone2-backend/package.json /usr/src/app/package.json
COPY ./oodikone2-backend/package-lock.json /usr/src/app/package-lock.json
COPY ./oodikone2-backend/package.json /usr/src/cache/package.json
COPY ./oodikone2-backend/package-lock.json /usr/src/cache/package-lock.json
RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

COPY ./oodikone2-backend /usr/src/app
COPY ./shared/models /usr/src/app/src/models
COPY ./shared/migrations /usr/src/app/src/database/migrations
COPY ./shared/migrations_kone /usr/src/app/src/database/migrations_kone

