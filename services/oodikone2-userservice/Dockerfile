FROM node:14-alpine

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY ./package* ./
RUN if [[ "${NODE_ENV}" == "development" ]]; then npm ci; else npm ci --only=production; fi
COPY . .

EXPOSE 4567

CMD npm start
