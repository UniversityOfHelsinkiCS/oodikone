FROM node:10.15-alpine

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

RUN if [ "${NODE_ENV}" != "development" ]; then npm run dist && npm install -g serve; fi

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.5.0/wait /wait
RUN chmod +x /wait

EXPOSE 5000
CMD /wait && serve -s -l 5000 dist
