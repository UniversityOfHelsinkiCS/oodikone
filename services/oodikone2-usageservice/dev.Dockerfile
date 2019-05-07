FROM node:10

COPY . /usr/src/app
WORKDIR /usr/src/app
ENV NODE_ENV dev
EXPOSE 545
RUN npm ci

CMD npm run dev
