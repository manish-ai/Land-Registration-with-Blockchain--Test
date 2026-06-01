#!/bin/bash
# =============================================================
# Land Registration DApp - One-Click Setup Script (macOS)
# =============================================================
# This script sets up everything needed to run the application.
# Just open Terminal, navigate to this folder, and run:
#   chmod +x setup.sh && ./setup.sh
# =============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo ""
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_success() {
    echo -e "${GREEN}  [OK] $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}  [!] $1${NC}"
}

print_error() {
    echo -e "${RED}  [ERROR] $1${NC}"
}

# ----------------------------------------------------------
# Step 0: Check prerequisites
# ----------------------------------------------------------
print_step "Step 1/6: Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    echo ""
    echo "  Please install Node.js first:"
    echo "  1. Go to https://nodejs.org/"
    echo "  2. Download the LTS version (v18 or later)"
    echo "  3. Run the installer"
    echo "  4. Close and reopen Terminal"
    echo "  5. Run this script again"
    echo ""
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js v18 or later is required. You have $(node -v)"
    echo "  Please update Node.js from https://nodejs.org/"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed! It should come with Node.js."
    exit 1
fi
print_success "npm $(npm -v) found"

# Check git
if ! command -v git &> /dev/null; then
    print_warn "Git is not installed. Installing via Xcode Command Line Tools..."
    xcode-select --install 2>/dev/null || true
    echo "  If prompted, click 'Install' in the popup and wait for it to finish."
    echo "  Then run this script again."
    exit 1
fi
print_success "Git found"

# ----------------------------------------------------------
# Step 1: Install global tools
# ----------------------------------------------------------
print_step "Step 2/6: Installing Truffle and Ganache..."

if ! command -v truffle &> /dev/null; then
    npm install -g truffle ganache
    print_success "Truffle and Ganache installed"
else
    print_success "Truffle already installed"
    if ! command -v ganache &> /dev/null; then
        npm install -g ganache
        print_success "Ganache installed"
    else
        print_success "Ganache already installed"
    fi
fi

# ----------------------------------------------------------
# Step 2: Install project dependencies
# ----------------------------------------------------------
print_step "Step 3/6: Installing project dependencies..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "  Installing Gov Portal dependencies..."
cd gov-portal
npm install --silent 2>&1 | tail -1
print_success "Gov Portal dependencies installed"

echo "  Installing Client dependencies (this may take a few minutes)..."
cd ../client
npm install --silent 2>&1 | tail -1
print_success "Client dependencies installed"

cd "$SCRIPT_DIR"

# ----------------------------------------------------------
# Step 3: Done! Create the start script
# ----------------------------------------------------------
print_step "Step 4/6: Creating start script..."

cat > "$SCRIPT_DIR/start.sh" << 'STARTSCRIPT'
#!/bin/bash
# =============================================================
# Land Registration DApp - Start All Services
# =============================================================
# Run this to start the application:  ./start.sh
# Stop everything with: Ctrl+C
# =============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down all services...${NC}"
    kill $GANACHE_PID $GOV_PID $CLIENT_PID 2>/dev/null
    wait $GANACHE_PID $GOV_PID $CLIENT_PID 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}===================================================${NC}"
echo -e "${BLUE}   Land Registration DApp - Starting Services${NC}"
echo -e "${BLUE}===================================================${NC}"

# Start Ganache
echo -e "${CYAN}[1/4] Starting Ganache (blockchain)...${NC}"
npx ganache --port 7545 --deterministic --accounts 10 --networkId 5777 --quiet &
GANACHE_PID=$!
sleep 3

# Check Ganache is running
if ! kill -0 $GANACHE_PID 2>/dev/null; then
    echo -e "${RED}Ganache failed to start. Port 7545 might be in use.${NC}"
    echo "  Try: lsof -ti:7545 | xargs kill"
    exit 1
fi
echo -e "${GREEN}  Ganache running on port 7545${NC}"

# Deploy smart contracts
echo -e "${CYAN}[2/4] Deploying smart contracts...${NC}"
npx truffle migrate --reset --network development 2>&1 | grep -E "(contract address|Replacing|Total cost)" || true
echo -e "${GREEN}  Contracts deployed${NC}"

# Delete old gov database so it re-seeds with fresh data
rm -f gov-portal/data/govt.db gov-portal/data/govt.db-wal gov-portal/data/govt.db-shm

# Start Gov Portal
echo -e "${CYAN}[3/4] Starting Government Portal...${NC}"
cd gov-portal
node index.js &
GOV_PID=$!
cd "$SCRIPT_DIR"
sleep 2

if ! kill -0 $GOV_PID 2>/dev/null; then
    echo -e "${RED}Gov Portal failed to start. Port 4002 might be in use.${NC}"
    kill $GANACHE_PID 2>/dev/null
    exit 1
fi
echo -e "${GREEN}  Gov Portal running on port 4002${NC}"

# Start React client
echo -e "${CYAN}[4/4] Starting React app (this may take a moment)...${NC}"
cd client
npm start &
CLIENT_PID=$!
cd "$SCRIPT_DIR"

echo ""
echo -e "${GREEN}===================================================${NC}"
echo -e "${GREEN}   All services are starting!${NC}"
echo -e "${GREEN}===================================================${NC}"
echo ""
echo -e "  ${CYAN}App:${NC}          http://localhost:4000"
echo -e "  ${CYAN}Gov Portal:${NC}   http://localhost:4002"
echo -e "  ${CYAN}Blockchain:${NC}   http://localhost:7545"
echo ""
echo -e "  ${YELLOW}Test Accounts (OTP for all: 1234):${NC}"
echo -e "  ─────────────────────────────────────────────────"
echo -e "  Land Inspector  Aadhaar: 100000000001"
echo -e "  Seller (Rahul)  Aadhaar: 123456789012  PAN: ABCDE1234F"
echo -e "  Buyer (Priya)   Aadhaar: 234567890123  PAN: BCDEF2345G"
echo -e "  Deepa Nair      Aadhaar: 678901234567  PAN: FGHIJ6789K"
echo -e "  ─────────────────────────────────────────────────"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for all processes
wait
STARTSCRIPT

chmod +x "$SCRIPT_DIR/start.sh"
print_success "start.sh created"

# ----------------------------------------------------------
# Step 4: Create stop script
# ----------------------------------------------------------
cat > "$SCRIPT_DIR/stop.sh" << 'STOPSCRIPT'
#!/bin/bash
# Kill all services
echo "Stopping all Land Registry services..."
lsof -ti:7545 | xargs kill 2>/dev/null && echo "  Ganache stopped" || echo "  Ganache not running"
lsof -ti:4002 | xargs kill 2>/dev/null && echo "  Gov Portal stopped" || echo "  Gov Portal not running"
lsof -ti:4000 | xargs kill 2>/dev/null && echo "  React app stopped" || echo "  React app not running"
echo "Done."
STOPSCRIPT

chmod +x "$SCRIPT_DIR/stop.sh"
print_success "stop.sh created"

# ----------------------------------------------------------
# Step 5: Quick verification
# ----------------------------------------------------------
print_step "Step 5/6: Quick verification..."

echo "  Starting Ganache temporarily to verify setup..."
npx ganache --port 7545 --deterministic --accounts 10 --networkId 5777 --quiet &
TEMP_GANACHE=$!
sleep 3

if kill -0 $TEMP_GANACHE 2>/dev/null; then
    print_success "Ganache starts correctly"

    echo "  Deploying contracts to verify..."
    if npx truffle migrate --reset --network development > /dev/null 2>&1; then
        print_success "Smart contracts deploy correctly"
    else
        print_warn "Contract deployment had issues — will retry on start"
    fi

    kill $TEMP_GANACHE 2>/dev/null
    wait $TEMP_GANACHE 2>/dev/null
else
    print_warn "Could not verify Ganache — will try again on start"
fi

# ----------------------------------------------------------
# Step 6: Done!
# ----------------------------------------------------------
print_step "Step 6/6: Setup Complete!"

echo ""
echo -e "${GREEN}  Everything is installed and ready!${NC}"
echo ""
echo -e "  To start the application, run:"
echo -e "  ${CYAN}  ./start.sh${NC}"
echo ""
echo -e "  To stop all services:"
echo -e "  ${CYAN}  ./stop.sh${NC}"
echo -e "  (or press Ctrl+C in the terminal running start.sh)"
echo ""
echo -e "  ${YELLOW}Quick Start Guide:${NC}"
echo -e "  1. Run ./start.sh and wait for the browser to open"
echo -e "  2. The app opens at http://localhost:4000"
echo -e "  3. Use these test credentials to log in:"
echo -e "     - Land Inspector: Aadhaar 100000000001, OTP: 1234"
echo -e "     - Or register as a new Seller/Buyer"
echo ""
