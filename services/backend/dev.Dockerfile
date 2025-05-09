FROM node:22-alpine

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096

WORKDIR /opt/app-root/backend
COPY . .
RUN npm ci

EXPOSE 8080
CMD ["node_modules/.bin/tsx", "watch", "--clear-screen=false", "index.js"]
