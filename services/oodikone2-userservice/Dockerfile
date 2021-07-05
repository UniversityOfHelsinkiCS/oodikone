FROM node:14-alpine as base

WORKDIR /usr/src/app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY ./package* ./

FROM base as development
RUN npm ci 
COPY . .
EXPOSE 4567
CMD ["npm", "run", "dev"]

FROM base as test
RUN apk add --update sqlite
ENV DB_URL=sqlite::memory:
RUN npm ci
COPY . .
CMD ["npm", "run", "test"]

FROM base as production
RUN npm ci --production
COPY . .
EXPOSE 4567
CMD [ "npm", "start" ]