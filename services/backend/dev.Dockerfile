FROM node:22-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 8080

ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node_modules/.bin/tsx", "watch", "--clear-screen=false", "index.js"]
