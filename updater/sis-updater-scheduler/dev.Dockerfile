FROM node:24-alpine

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

EXPOSE 8082

CMD ["node", "--watch", "src/index.js"]