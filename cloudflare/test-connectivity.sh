#!/bin/bash
# Quick connectivity test for your Cloudflare Worker
# Run from your terminal: bash test-connectivity.sh

WORKER_URL="https://coded-landingpage.tools-c81.workers.dev"

echo "=== Testing Cloudflare Worker Connectivity ==="
echo ""

# 1. Health check
echo "1) Health check: $WORKER_URL/"
curl -s -w "\n   Status: %{http_code} | Time: %{time_total}s\n" "$WORKER_URL/"
echo ""

# 2. Graduates list
echo "2) Graduates endpoint: $WORKER_URL/graduates?limit=2"
curl -s -w "\n   Status: %{http_code}\n" "$WORKER_URL/graduates?limit=2" | head -c 200
echo ""
echo ""

# 3. Cohorts
echo "3) Cohorts endpoint: $WORKER_URL/cohorts/FSW"
curl -s -w "\n   Status: %{http_code}\n" "$WORKER_URL/cohorts/FSW" | head -c 200
echo ""
echo ""

# 4. Workshop recommend (POST)
echo "4) Workshop recommend: $WORKER_URL/workshop-recommend"
curl -s -X POST "$WORKER_URL/workshop-recommend" \
  -H "Content-Type: application/json" \
  -d '{"duration":"< 3 Days","teamSize":"< 8","audience":["Executives"],"companyName":"Test"}' \
  -w "\n   Status: %{http_code}\n" | head -c 300
echo ""
echo ""

# 5. Wrangler auth check
echo "5) Wrangler CLI status:"
if command -v wrangler &> /dev/null || command -v npx &> /dev/null; then
  cd "$(dirname "$0")" 2>/dev/null
  npx wrangler whoami 2>&1
else
  echo "   wrangler not found — run: npm install"
fi

echo ""
echo "=== Done ==="
