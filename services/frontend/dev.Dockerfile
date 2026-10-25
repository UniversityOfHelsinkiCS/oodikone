FROM node:24-alpine

ENV TZ="Europe/Helsinki"
# FIXME: Does nothing at the moment
# Default install location is node_modules/.vite which is not writable
#  by user 1001 when binding the local files to the container
ENV VITE_CACHE_DIR=/tmp/vite

WORKDIR /opt/app-root/shared
COPY ./shared .
RUN npm ci

WORKDIR /opt/app-root/frontend
COPY ./frontend .
RUN npm ci

EXPOSE 3000

CMD ["node_modules/.bin/vite"]
