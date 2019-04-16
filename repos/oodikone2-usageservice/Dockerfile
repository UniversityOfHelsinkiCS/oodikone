FROM node:10-alpine

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install
EXPOSE 545
 
CMD ["npm", "start"]
