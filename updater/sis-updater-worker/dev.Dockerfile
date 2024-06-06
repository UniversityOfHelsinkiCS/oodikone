FROM node:20-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

ARG SERVICE_PROVIDER
ENV SERVICE_PROVIDER=$SERVICE_PROVIDER

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node_modules/.bin/nodemon", "src/index.js"]
