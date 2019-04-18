FROM node:10

COPY . /usr/src/app
WORKDIR /usr/src/app
ENV NODE_ENV dev
RUN npm ci && mv /usr/src/app/node_modules /node_modules
EXPOSE 8080
 
CMD ["/node_modules/.bin/nodemon", "index.js"]
