FROM node:10

COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm ci

COPY package.json /usr/src/cache/package.json
COPY package-lock.json /usr/src/cache/package-lock.json

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
RUN if [ "${NODE_ENV}" != "production" ]; then cp -r /usr/src/app/node_modules /usr/src/cache/node_modules; fi

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.5.0/wait /wait
RUN chmod +x /wait

EXPOSE 4568
CMD /wait && npm start
