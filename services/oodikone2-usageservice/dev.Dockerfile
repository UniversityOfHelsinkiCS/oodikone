FROM node:10

COPY . /usr/src/app
WORKDIR /usr/src/app
ENV NODE_ENV dev
RUN npm ci && mv /usr/src/app/node_modules /node_modules
EXPOSE 545

CMD ["npm", "run", "dev"]
