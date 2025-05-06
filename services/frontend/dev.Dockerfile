FROM node:22-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/shared
COPY . .

WORKDIR /opt/app-root/frontend
COPY ./package*.json .
RUN npm ci

EXPOSE 3000
CMD ["node_modules/.bin/vite"]
