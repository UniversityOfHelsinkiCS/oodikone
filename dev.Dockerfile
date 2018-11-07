FROM node:8.9.4

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN rm -rf /usr/src/app/node_modules

RUN npm install
EXPOSE 8081

CMD ["npm", "run", "docker"]