#!/bin/bash

# Validation Script for Meta-Orchestration Implementation
# This script validates the complete meta-orchestration observability system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

echo "🔍 Validating Meta-Orchestration Implementation..."
echo "=================================================="
echo ""

# Function to check if file exists
check_file() {
  if [ ! -f "$1" ]; then
    echo -e "${RED}❌ Missing: $1${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
  echo -e "${GREEN}✅ Found: $1${NC}"
  PASSED=$((PASSED + 1))
  return 0
}

# Function to check if directory exists
check_dir() {
  if [ ! -d "$1" ]; then
    echo -e "${RED}❌ Missing directory: $1${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
  echo -e "${GREEN}✅ Found directory: $1${NC}"
  PASSED=$((PASSED + 1))
  return 0
}

# Function to run command and check result
run_check() {
  local description="$1"
  shift
  echo -e "${BLUE}▶ $description${NC}"

  if "$@"; then
    echo -e "${GREEN}✅ $description - PASSED${NC}"
    PASSED=$((PASSED + 1))
    return 0
  else
    echo -e "${RED}❌ $description - FAILED${NC}"
    FAILED=$((FAILED + 1))
    return 1
  fi
}

# Section 1: Check File Structure
echo "📁 Section 1: Checking File Structure"
echo "--------------------------------------"

check_file "src/coordination/event-stream-manager.ts" || echo -e "${YELLOW}⚠️  Note: EventStreamManager not yet implemented${NC}"
check_file "src/mcp/observability-tools.ts" || check_file "src/mcp/tools.ts"
check_file "src/mcp/swarm-tools.ts"

echo ""

# Section 2: Check Test Files
echo "🧪 Section 2: Checking Test Files"
echo "----------------------------------"

check_file "tests/integration/event-stream.test.ts"
check_file "tests/integration/observability-tools.test.ts"
check_file "tests/integration/hive-mind-events.test.ts"
check_file "tests/e2e/meta-orchestration.test.ts"

echo ""

# Section 3: Check Examples
echo "📝 Section 3: Checking Examples"
echo "--------------------------------"

check_file "examples/meta-orchestration/basic-monitoring.js"
check_file "examples/meta-orchestration/multi-swarm-coordination.js"

# Make examples executable
if [ -f "examples/meta-orchestration/basic-monitoring.js" ]; then
  chmod +x examples/meta-orchestration/basic-monitoring.js
  echo -e "${GREEN}✅ Made basic-monitoring.js executable${NC}"
fi

if [ -f "examples/meta-orchestration/multi-swarm-coordination.js" ]; then
  chmod +x examples/meta-orchestration/multi-swarm-coordination.js
  echo -e "${GREEN}✅ Made multi-swarm-coordination.js executable${NC}"
fi

echo ""

# Section 4: Check Documentation
echo "📚 Section 4: Checking Documentation"
echo "-------------------------------------"

check_file "tests/integration/README.md" || echo -e "${YELLOW}⚠️  Test README not found${NC}"

echo ""

# Section 5: TypeScript Compilation
echo "🔨 Section 5: Running TypeScript Compilation"
echo "---------------------------------------------"

if command -v npm &> /dev/null; then
  run_check "TypeScript compilation" npm run typecheck || echo -e "${YELLOW}⚠️  TypeScript errors found (may be expected if implementation is incomplete)${NC}"
else
  echo -e "${YELLOW}⚠️  npm not found, skipping TypeScript check${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Section 6: Run Tests
echo "🧪 Section 6: Running Tests"
echo "----------------------------"

if command -v npm &> /dev/null; then
  echo "Running integration tests..."

  # Run event-stream tests
  if [ -f "tests/integration/event-stream.test.ts" ]; then
    run_check "event-stream.test.ts" npm test -- tests/integration/event-stream.test.ts || true
  fi

  # Run observability-tools tests
  if [ -f "tests/integration/observability-tools.test.ts" ]; then
    run_check "observability-tools.test.ts" npm test -- tests/integration/observability-tools.test.ts || true
  fi

  # Run hive-mind-events tests
  if [ -f "tests/integration/hive-mind-events.test.ts" ]; then
    run_check "hive-mind-events.test.ts" npm test -- tests/integration/hive-mind-events.test.ts || true
  fi

  # Run E2E tests
  if [ -f "tests/e2e/meta-orchestration.test.ts" ]; then
    run_check "meta-orchestration.test.ts (E2E)" npm test -- tests/e2e/meta-orchestration.test.ts || true
  fi
else
  echo -e "${YELLOW}⚠️  npm not found, skipping tests${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Section 7: Build Project
echo "📦 Section 7: Building Project"
echo "-------------------------------"

if command -v npm &> /dev/null; then
  run_check "Project build" npm run build || echo -e "${YELLOW}⚠️  Build failed (may be expected if implementation is incomplete)${NC}"
else
  echo -e "${YELLOW}⚠️  npm not found, skipping build${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Section 8: Validate Examples (Syntax Check)
echo "📝 Section 8: Validating Examples"
echo "----------------------------------"

if command -v node &> /dev/null; then
  # Check syntax of examples
  if [ -f "examples/meta-orchestration/basic-monitoring.js" ]; then
    run_check "basic-monitoring.js syntax" node --check examples/meta-orchestration/basic-monitoring.js
  fi

  if [ -f "examples/meta-orchestration/multi-swarm-coordination.js" ]; then
    run_check "multi-swarm-coordination.js syntax" node --check examples/meta-orchestration/multi-swarm-coordination.js
  fi
else
  echo -e "${YELLOW}⚠️  node not found, skipping example validation${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Section 9: Check for Dependencies
echo "📦 Section 9: Checking Dependencies"
echo "------------------------------------"

if [ -f "package.json" ]; then
  echo -e "${GREEN}✅ package.json found${NC}"
  PASSED=$((PASSED + 1))

  # Check for required dependencies
  if grep -q "fs-extra" package.json; then
    echo -e "${GREEN}✅ fs-extra dependency found${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${YELLOW}⚠️  fs-extra dependency not found${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}❌ package.json not found${NC}"
  FAILED=$((FAILED + 1))
fi

echo ""

# Section 10: Implementation Status
echo "📊 Section 10: Implementation Status"
echo "-------------------------------------"

echo "Checking for implemented features..."

# Check if EventStreamManager exists
if [ -f "src/coordination/event-stream-manager.ts" ]; then
  echo -e "${GREEN}✅ EventStreamManager implemented${NC}"
else
  echo -e "${YELLOW}⚠️  EventStreamManager not yet implemented${NC}"
  echo "   This is expected as tests are written in TDD style"
fi

# Check if observability tools exist
if [ -f "src/mcp/observability-tools.ts" ]; then
  echo -e "${GREEN}✅ Observability tools implemented${NC}"
else
  echo -e "${YELLOW}⚠️  Observability tools not yet implemented${NC}"
  echo "   Tests define the expected interface"
fi

# Check if CLI integration exists
if grep -r "enable-events" src/ 2>/dev/null | grep -q "enable-events"; then
  echo -e "${GREEN}✅ CLI integration with --enable-events found${NC}"
else
  echo -e "${YELLOW}⚠️  CLI integration not yet implemented${NC}"
  echo "   Tests define the expected behavior"
fi

echo ""

# Final Summary
echo "=================================================="
echo "📊 VALIDATION SUMMARY"
echo "=================================================="
echo ""
echo -e "${GREEN}✅ Passed:   $PASSED${NC}"
echo -e "${RED}❌ Failed:   $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All critical validations passed!${NC}"
  echo ""
  echo "Note: Some components may not be implemented yet."
  echo "Tests are written in TDD style and define the expected behavior."
  echo ""
  echo "Next Steps:"
  echo "1. Implement EventStreamManager in src/coordination/"
  echo "2. Implement observability tools in src/mcp/"
  echo "3. Add --enable-events flag to CLI"
  echo "4. Run tests to verify implementation"
  exit 0
else
  echo -e "${RED}❌ Some validations failed!${NC}"
  echo ""
  echo "Please review the errors above and fix them before proceeding."
  exit 1
fi
