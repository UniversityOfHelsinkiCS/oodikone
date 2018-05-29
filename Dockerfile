FROM node:8.9.4

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm i

RUN npm run dist
RUN npm install -g serve@6.5.5 

EXPOSE 5000

CMD ["serve", "-s", "dist"]
