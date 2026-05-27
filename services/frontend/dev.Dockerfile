FROM registry.access.redhat.com/ubi9/nodejs-24-minimal

ENV TZ="Europe/Helsinki"

# https://github.com/hadolint/hadolint/wiki/DL4006
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Safe-chain install
RUN curl -fsSL https://github.com/AikidoSec/safe-chain/releases/latest/download/install-safe-chain.sh | sh -s -- --ci

WORKDIR /opt/app-root/frontend
COPY --chown=1001:1001 . .

USER 1001
RUN npm ci

EXPOSE 3000
CMD ["node_modules/.bin/vite"]
