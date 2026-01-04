#!/bin/bash

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🎵 Starting MusicBoi Launcher..."
echo "================================="

# Trap ctrl-c and exit
trap 'kill 0' SIGINT EXIT

# 1. Setup Python Backend
echo "🐍 Checking Python Environment..."
cd python

if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "   Installing backend dependencies..."
pip install -r requirements.txt

# Deactivate venv to let npm/electron handle their environment if needed
# But electron main.js expects python at python/venv/bin/python, so that's fine.
deactivate
cd ..

if [ ! -d "node_modules" ]; then
    echo "   Installing Node modules (Frontend)..."
    npm install
fi

echo "   Starting MusicBoi (Electron + AI Server)..."
npm start
echo "================================="
echo "✅ MusicBoi is running!"
echo "   AI Server: http://localhost:8000"
echo "   Web App: http://localhost:5173"
echo "================================="
# Wait for processes
wait
