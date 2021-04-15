FROM node:14-alpine

WORKDIR /usr/src/app

EXPOSE 4568

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY ./package* ./

RUN npm ci

COPY . .

CMD npm start
