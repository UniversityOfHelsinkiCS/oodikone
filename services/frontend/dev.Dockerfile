FROM node:24-alpine

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/frontend
COPY . .
RUN npm ci

EXPOSE 3000
CMD ["node_modules/.bin/vite"]
