FROM registry.access.redhat.com/ubi10/nodejs-24-minimal

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096

WORKDIR /opt/app-root/shared

COPY ./shared .
RUN npm ci

WORKDIR /opt/app-root/backend

COPY ./backend .
RUN npm ci

EXPOSE 8080

CMD ["node_modules/.bin/nodemon", "--exec", "node --import tsx index.ts", "--ext", "ts,js,json", "--watch", "src", "--watch", "index.ts", "--legacy-watch"]
