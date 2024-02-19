FROM registry.access.redhat.com/ubi9/nodejs-20-minimal

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

ARG SENTRY_ENVIRONMENT
ENV REACT_APP_SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT

ARG SENTRY_RELEASE
ENV REACT_APP_SENTRY_RELEASE=$SENTRY_RELEASE

COPY ./package* ./
RUN npm ci --include=dev
COPY . .

RUN npm run build && npm install -g serve@12.0.0

CMD ["serve", "--single", "--listen", "5000", "build"]
