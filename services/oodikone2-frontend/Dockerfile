FROM node:10

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH

RUN mkdir /usr/src/cache
WORKDIR /usr/src/cache

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY . /usr/src/app
WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" = "production" ]; then mv /usr/src/cache/node_modules /usr/src/app/node_modules; fi

RUN npm run dist
RUN npm install -g serve

EXPOSE 5000
CMD ["serve", "-s", "-l", "5000", "dist"]
