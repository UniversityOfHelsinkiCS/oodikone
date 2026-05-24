FROM node:24-alpine

WORKDIR /opt/app-root/src

ENV NODE_ENV=development

ENV TZ="Europe/Helsinki"

# https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Safe-chain install
RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh -s -- --ci

COPY ./package* ./
RUN npm ci
COPY . .

CMD ["node", "--watch", "src/index.js"]
