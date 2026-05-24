FROM node:24-alpine

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development
ENV NODE_OPTIONS=--max-old-space-size=4096

# https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/ash", "-o", "pipefail", "-c"]

# Safe-chain install
RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh -s -- --ci

WORKDIR /opt/app-root/backend
COPY . .
RUN npm ci

EXPOSE 8080
CMD ["node_modules/.bin/nodemon", "--exec", "node --import tsx index.ts", "--ext", "ts,js,json", "--watch", "src", "--watch", "index.ts", "--legacy-watch"]
