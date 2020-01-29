FROM node:10.15-alpine

WORKDIR /usr/src/app

CMD npm start

COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json

RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY . /usr/src/app