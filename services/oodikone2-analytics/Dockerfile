FROM node:10.15-alpine

WORKDIR /usr/src/app
EXPOSE 4568
CMD npm start

COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json
COPY package.json /usr/src/cache/package.json
COPY package-lock.json /usr/src/cache/package-lock.json
RUN npm ci

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

COPY . /usr/src/app

