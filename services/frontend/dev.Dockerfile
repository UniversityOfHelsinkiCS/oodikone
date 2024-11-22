FROM node:22-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 3000

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node_modules/.bin/vite"]
