FROM node:14.17-alpine3.13

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 3000

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["npm", "start"]
