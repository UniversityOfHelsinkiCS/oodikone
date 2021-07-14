FROM node:10-alpine as base

WORKDIR /usr/src/app

FROM base as development
ENV NODE_ENV=development
COPY package* /usr/src/app
RUN npm ci
COPY . /usr/src/app
CMD ["npm", "run", "dev"]

FROM base as production
ENV NODE_ENV=production
COPY --chown=node:node ./package* /usr/src/app/
RUN npm ci --production
COPY --chown=node:node . /usr/src/app/
USER node
CMD ["npm", "start"]
