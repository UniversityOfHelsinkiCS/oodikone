FROM node:20-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

EXPOSE 8082

CMD ["node_modules/.bin/nodemon", "src/index.js"]