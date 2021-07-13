# Dockerfile is based in Docker guide: https://docs.docker.com/language/nodejs/

FROM node:14.17-alpine3.13 as base

WORKDIR /usr/src/app

FROM base as development
ENV NODE_ENV=development
COPY ./package* ./
RUN npm ci 
COPY . .
EXPOSE 4567
CMD ["npm", "run", "dev"]

FROM base as test
ENV NODE_ENV=test
RUN apk add --no-cache sqlite=3.34.1-r0 && rm -rf /var/cache/apk/*
ENV DB_URL=sqlite::memory:
COPY ./package* ./
RUN npm ci
COPY . .
CMD ["npm", "run", "test"]

FROM base as production
ENV NODE_ENV=production
COPY ./package* ./
RUN npm ci --production
COPY . .
EXPOSE 4567
CMD [ "npm", "start" ]
