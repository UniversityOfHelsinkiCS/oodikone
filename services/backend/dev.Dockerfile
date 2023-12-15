FROM node:18-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 8080

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["npm", "run", "dev"]
