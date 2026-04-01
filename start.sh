#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd server
npm run dev &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
