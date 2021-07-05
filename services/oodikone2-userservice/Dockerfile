# Dockerfile is based in Docker guide: https://docs.docker.com/language/nodejs/

FROM node:14-alpine3.13 as base

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY ./package* ./

FROM base as development
RUN npm ci 
COPY . .
EXPOSE 4567
CMD ["npm", "run", "dev"]

FROM base as test
RUN apk add --no-cache sqlite=3.34.1-r0 && rm -rf /var/cache/apk/*
ENV DB_URL=sqlite::memory:
RUN npm ci
COPY . .
CMD ["npm", "run", "test"]

FROM base as production
RUN npm ci --production
COPY . .
EXPOSE 4567
CMD [ "npm", "start" ]