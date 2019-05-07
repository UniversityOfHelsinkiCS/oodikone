FROM node:10

COPY . /usr/src/app
WORKDIR /usr/src/app
ENV NODE_ENV dev
EXPOSE 8080

CMD npm ci && npm run dev