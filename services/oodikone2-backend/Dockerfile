FROM node:10

RUN mkdir /usr/src/cache
WORKDIR /usr/src/cache

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY . /usr/src/app
WORKDIR /usr/src/app

RUN if [ "${NODE_ENV}" = "production" ]; then mv /usr/src/cache/node_modules /usr/src/app/node_modules; fi

EXPOSE 8080
CMD ["npm", "start"]
