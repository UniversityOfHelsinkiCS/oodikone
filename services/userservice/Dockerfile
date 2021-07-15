FROM node:14.17-alpine3.13 as base

WORKDIR /usr/src/app

FROM base as development
ENV NODE_ENV=development
EXPOSE 4567
COPY ./package* /usr/src/app/
RUN npm ci
COPY . /usr/src/app
CMD ["npm", "run", "dev"]

FROM base as test
ENV NODE_ENV=test
RUN apk add --no-cache sqlite=3.34.1-r0 && rm -rf /var/cache/apk/*
ENV DB_URL=sqlite::memory:
COPY ./package* /usr/src/app/
RUN npm ci
COPY . /usr/src/app/
CMD ["npm", "run", "test"]

FROM base as production
ENV NODE_ENV=production
EXPOSE 4567
COPY --chown=node:node ./package* /usr/src/app/
RUN npm ci --production
COPY --chown=node:node . /usr/src/app/
USER node
CMD [ "npm", "start" ]
