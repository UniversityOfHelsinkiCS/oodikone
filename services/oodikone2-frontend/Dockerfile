FROM node:10

ARG BASE_PATH
ENV BASE_PATH=$BASE_PATH

COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm ci

COPY package.json /usr/src/cache/package.json
COPY package-lock.json /usr/src/cache/package-lock.json

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

RUN npm run dist
RUN npm install -g serve

EXPOSE 5000
CMD ["serve", "-s", "-l", "5000", "dist"]
