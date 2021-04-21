FROM node:10-alpine

WORKDIR /usr/src/app
EXPOSE 8082
CMD npm start

COPY package* ./

RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY . /usr/src/app

