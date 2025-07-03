#!/bin/bash

# COMPASS Design GenAI - Start Script
# Starts both frontend and backend services

set -e

echo "🚀 Starting COMPASS Design GenAI Services..."

# Function to cleanup background processes on exit
cleanup() {
    echo "🛑 Stopping services..."
    jobs -p | xargs -r kill
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup EXIT INT TERM

# Start backend server
echo "📦 Starting Backend Server (compass-design-bridge-server)..."
cd compass-design-bridge-server
npm run dev &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend (compass-design-bridge)..."
cd ../compass-design-bridge
npm run dev &
FRONTEND_PID=$!

echo "✅ Services started successfully!"
echo "📍 Frontend: http://localhost:5173"
echo "📍 Backend: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background jobs
wait
