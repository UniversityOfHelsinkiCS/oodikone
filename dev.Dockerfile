FROM node:8.11.3

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN rm -rf /usr/src/app/node_modules
RUN npm install
EXPOSE 8080
 
CMD ["npm", "run", "dev"]
