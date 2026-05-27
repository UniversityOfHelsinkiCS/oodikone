FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

WORKDIR /opt/app-root/src

ENV TZ="Europe/Helsinki"

ENV NODE_ENV=development

# https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Safe-chain install
RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh -s -- --ci

COPY ./package* ./
RUN npm ci
COPY . .

EXPOSE 8082

CMD ["node", "--watch", "src/index.js"]
