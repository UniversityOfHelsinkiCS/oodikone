FROM registry.access.redhat.com/ubi9/nodejs-20-minimal

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 8080

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096

ARG BASE_PATH
ENV PUBLIC_URL=$BASE_PATH

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

ARG SENTRY_ENVIRONMENT
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT

ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

COPY ./package*.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build

RUN cp -r config dist/
RUN cp package.json dist/
RUN cp package-lock.json dist/
RUN cp index.js dist/

RUN find src -name '*.js' -exec cp --parents {} dist \;

RUN npm prune --production

CMD ["node", "dist/index.js"]
