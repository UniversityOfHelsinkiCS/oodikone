FROM node:10.15-alpine

COPY ./updater_writer /usr/src/app
COPY ./shared/models /usr/src/app/models
COPY ./shared/migrations /usr/src/app/database/migrations
WORKDIR /usr/src/app
RUN npm ci

COPY ./updater_writer/package.json /usr/src/cache/package.json
COPY ./updater_writer/package-lock.json /usr/src/cache/package-lock.json

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.5.0/wait /wait
RUN chmod +x /wait

CMD /wait && npm start
