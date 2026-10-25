FROM node:24-alpine

ENV TZ="Europe/Helsinki"
ENV NODE_ENV=development

# Alpine doesn't contain curl, is needed for healthchecks
RUN apk update && apk upgrade && apk --no-cache add curl

WORKDIR /opt/app-root/src
COPY . .
RUN npm ci

EXPOSE 8082

CMD ["node_modules/.bin/nodemon", "--exec", "node src/index.js", "--watch", "src", "--watch", "--ext", "ts, js, json", "--legacy-watch"]
