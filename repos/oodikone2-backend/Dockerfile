FROM node:dubnium
# dubnium means version 10.15

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm ci
EXPOSE 8080
 
CMD ["npm", "start"]
