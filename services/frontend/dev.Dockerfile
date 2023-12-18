FROM node:16-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 3000

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["npm", "start"]
