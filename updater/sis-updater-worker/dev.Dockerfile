FROM node:18-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node_modules/.bin/nodemon", "src/index.js"]
