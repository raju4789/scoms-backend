#!/bin/bash

# This script opens the Consul UI in your default browser

CONSUL_HOST=${CONSUL_HOST:-localhost}
CONSUL_PORT=${CONSUL_PORT:-8500}
CONSUL_UI_URL="http://${CONSUL_HOST}:${CONSUL_PORT}/ui/"

echo "Opening Consul UI at: ${CONSUL_UI_URL}"

# Try to open the browser based on platform
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  if command -v xdg-open &>/dev/null; then
    xdg-open "${CONSUL_UI_URL}"
  else
    echo "Cannot open browser automatically. Please visit: ${CONSUL_UI_URL}"
  fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "${CONSUL_UI_URL}"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
  # Windows
  start "${CONSUL_UI_URL}"
else
  echo "Cannot open browser automatically. Please visit: ${CONSUL_UI_URL}"
fi
