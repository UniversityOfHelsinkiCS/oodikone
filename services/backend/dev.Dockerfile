FROM node:14.17-alpine3.13

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 8080

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["npm", "run", "dev"]
