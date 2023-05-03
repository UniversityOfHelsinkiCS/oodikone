FROM registry.access.redhat.com/ubi8/nodejs-14-minimal

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 5000

ARG SENTRY_ENVIRONMENT
ENV REACT_APP_SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ARG SENTRY_RELEASE
ENV REACT_APP_SENTRY_RELEASE=$SENTRY_RELEASE
ARG BUILT_AT
ENV REACT_APP_BUILT_AT=$BUILT_AT

COPY ./package* ./
RUN npm ci --omit-dev
COPY . .

RUN npm run build && npm install -g serve@12.0.0

CMD ["serve", "--single", "--listen", "5000", "build"]
