#!/bin/bash

# Test traffic generation script for SCOMS observability testing

echo "🚀 Generating test traffic to SCOMS application..."

BASE_URL="http://localhost:3000"

echo "✅ Testing health endpoint..."
for i in {1..5}; do
    curl -s "$BASE_URL/health" > /dev/null
    echo "Health check $i completed"
    sleep 1
done

echo "⚠️ Testing 404 endpoints to generate error metrics..."
for i in {1..3}; do
    curl -s "$BASE_URL/api/orders" > /dev/null
    curl -s "$BASE_URL/api/warehouses" > /dev/null
    echo "Error test $i completed"
    sleep 1
done

echo "📊 Testing metrics endpoint..."
for i in {1..2}; do
    curl -s "$BASE_URL/metrics" > /dev/null
    echo "Metrics fetch $i completed"
    sleep 1
done

echo "🔍 Testing various non-existent endpoints..."
endpoints=("/api/users" "/api/products" "/dashboard" "/admin" "/api/inventory")
for endpoint in "${endpoints[@]}"; do
    curl -s "$BASE_URL$endpoint" > /dev/null
    echo "Testing $endpoint completed"
    sleep 0.5
done

echo "✨ Traffic generation completed! Check Grafana dashboard for metrics."
