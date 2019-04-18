FROM node:10

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm ci
EXPOSE 4568
 
CMD ["npm", "start"]
