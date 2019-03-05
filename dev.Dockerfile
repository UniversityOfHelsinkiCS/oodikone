FROM node:8.9.4

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

ENV NODE_ENV dev
RUN npm install && mv /usr/src/app/node_modules /node_modules
EXPOSE 8081

CMD ["npm", "run", "docker"]