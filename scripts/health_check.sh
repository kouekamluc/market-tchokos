#!/bin/bash

# AgriConnect Health Check Script
# Exits with 0 only if all checks pass

set -e  # Exit on any error

echo "🔍 Starting AgriConnect Health Check..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${YELLOW}⚠️  $message${NC}"
    fi
}

# Check 1: Django Tests
echo "🧪 Running Django Tests..."
cd backend
if python manage.py test --verbosity=2; then
    print_status "PASS" "Django Tests"
else
    print_status "FAIL" "Django Tests"
    exit 1
fi

# Check 2: ESLint
echo "🔍 Running ESLint..."
cd ../frontend
if npm run lint; then
    print_status "PASS" "ESLint"
else
    print_status "FAIL" "ESLint"
    exit 1
fi

# Check 3: TypeScript Type Check
echo "📝 Running TypeScript Type Check..."
if npx tsc --noEmit; then
    print_status "PASS" "TypeScript Type Check"
else
    print_status "FAIL" "TypeScript Type Check"
    exit 1
fi

# Check 4: Container Health (if Docker is running)
echo "🐳 Checking Container Health..."
if command -v docker &> /dev/null && docker info &> /dev/null; then
    if docker-compose ps | grep -q "Up"; then
        print_status "PASS" "Container Health"
    else
        print_status "FAIL" "Container Health - No containers running"
        exit 1
    fi
else
    print_status "WARN" "Docker not available - skipping container health check"
fi

# Check 5: Database Connection
echo "🗄️  Checking Database Connection..."
cd ../backend
if python manage.py check --database default; then
    print_status "PASS" "Database Connection"
else
    print_status "FAIL" "Database Connection"
    exit 1
fi

# Check 6: Frontend Build
echo "🏗️  Checking Frontend Build..."
cd ../frontend
if npm run build; then
    print_status "PASS" "Frontend Build"
else
    print_status "FAIL" "Frontend Build"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All Health Checks Passed!${NC}"
echo "AgriConnect is ready for production deployment."
exit 0
