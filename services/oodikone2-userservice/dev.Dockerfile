FROM node:10

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
EXPOSE 4567
RUN npm ci

CMD npm run dev
