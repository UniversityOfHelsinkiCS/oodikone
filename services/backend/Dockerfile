FROM registry.access.redhat.com/ubi8/nodejs-14-minimal

ENV TZ="Europe/Helsinki"

WORKDIR /opt/app-root/src

EXPOSE 8080

ENV NODE_ENV=production

ARG STAGING
ENV REACT_APP_STAGING=$STAGING

COPY ./package* ./
RUN npm ci --omit-dev
COPY . .

CMD ["npm", "start"]
