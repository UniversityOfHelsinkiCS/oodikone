FROM registry.access.redhat.com/ubi8/nodejs-14-minimal

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 5000

ENV NODE_ENV=production

ARG BASE_PATH
ENV PUBLIC_URL=$BASE_PATH

ARG BUILT_AT
ENV REACT_APP_BUILT_AT=$BUILT_AT

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

COPY ./package* ./
RUN npm ci --omit-dev
COPY . .

RUN npm run build && npm install -g serve@12.0.0

CMD ["serve", "--single", "--listen", "5000", "build"]
