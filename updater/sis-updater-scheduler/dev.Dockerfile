FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

COPY . .
RUN npm ci --include=dev

EXPOSE 8082

CMD ["node_modules/.bin/nodemon", "--exec", "node src/index.js", "--watch", "src", "--watch", "--ext", "ts, js, json", "--legacy-watch"]
