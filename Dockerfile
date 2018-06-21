FROM node:8.11.3

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm install
EXPOSE 8080
 
CMD ["npm", "start"]
