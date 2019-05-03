FROM node:10

RUN mkdir -p /usr/src/app
COPY . /usr/src/app
WORKDIR /usr/src/app

RUN npm ci && mv /usr/src/app/node_modules /node_modules
EXPOSE 4567

CMD ["npm", "run", "dev"]
