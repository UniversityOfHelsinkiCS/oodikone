FROM node:24-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

ENV TZ="Europe/Helsinki"

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node", "--watch", "src/index.js"]
