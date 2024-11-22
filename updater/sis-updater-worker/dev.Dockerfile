FROM node:22-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node", "--watch", "src/index.js"]
