FROM node:24-alpine

ENV TZ="Europe/Helsinki"

# https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Safe-chain install
RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh -s -- --ci

WORKDIR /opt/app-root/frontend
COPY . .
RUN npm ci

EXPOSE 3000
CMD ["node_modules/.bin/vite"]
