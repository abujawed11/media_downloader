#!/bin/bash

# Media Downloader Development Startup Script
# This script starts both backend and frontend in development mode

echo "🚀 Starting Media Downloader Development Environment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python found: $(python3 --version)${NC}"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    echo -e "${GREEN}✅ Python found: $(python --version)${NC}"
    PYTHON_CMD="python"
else
    echo -e "${RED}❌ Python not found. Please install Python 3.8+${NC}"
    exit 1
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping all services...${NC}"
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend
start_backend() {
    echo -e "\n${BLUE}🔧 Starting Backend Server...${NC}"
    cd backend
    
    # Install Python dependencies if requirements.txt exists
    if [ -f "requirements.txt" ]; then
        echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
        pip install -r requirements.txt
    fi
    
    # Start the FastAPI server
    echo -e "${GREEN}🚀 Starting FastAPI server on http://localhost:8000${NC}"
    $PYTHON_CMD start.py &
    BACKEND_PID=$!
    
    cd ..
}

# Start frontend
start_frontend() {
    echo -e "\n${BLUE}📱 Starting React Native App...${NC}"
    cd frontend
    
    # Install npm dependencies
    if [ -f "package.json" ]; then
        echo -e "${BLUE}📦 Installing npm dependencies...${NC}"
        npm install
    fi
    
    # Start Metro bundler
    echo -e "${GREEN}🚀 Starting Metro bundler...${NC}"
    npm start &
    METRO_PID=$!
    
    cd ..
}

# Main execution
echo -e "\n${YELLOW}🔄 Starting services...${NC}"

# Start backend
start_backend

# Wait for backend to start
sleep 3

# Start frontend
start_frontend

echo -e "\n${GREEN}✅ Development environment started!${NC}"
echo -e "${CYAN}🌐 Backend API: http://localhost:8000${NC}"
echo -e "${CYAN}📖 API Docs: http://localhost:8000/docs${NC}"
echo -e "${CYAN}📱 React Native Metro: http://localhost:8081${NC}"
echo -e "\n${YELLOW}⏹️  Press Ctrl+C to stop all services${NC}"

# Wait for user input or signal
wait
