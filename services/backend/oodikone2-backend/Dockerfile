FROM node:10.15-alpine

COPY ./oodikone2-backend /usr/src/app
COPY ./shared/models /usr/src/app/src/models
COPY ./shared/migrations /usr/src/app/src/database/migrations
WORKDIR /usr/src/app
RUN npm ci

COPY ./oodikone2-backend/package.json /usr/src/cache/package.json
COPY ./oodikone2-backend/package-lock.json /usr/src/cache/package-lock.json

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.5.0/wait /wait
RUN chmod +x /wait

EXPOSE 8080
CMD /wait && npm start
