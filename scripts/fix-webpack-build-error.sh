#!/bin/bash

echo "🔧 Fixing webpack build error..."

# Stop any running processes
echo "Stopping any running Next.js processes..."
pkill -f "next"

# Clear Next.js cache
echo "Clearing .next cache..."
rm -rf .next

# Clear node_modules cache
echo "Clearing node_modules cache..."
rm -rf node_modules/.cache

# Clear npm/pnpm cache
echo "Clearing package manager cache..."
if command -v pnpm &> /dev/null; then
    pnpm store prune
elif command -v npm &> /dev/null; then
    npm cache clean --force
fi

# Clear Turbo cache if exists
if [ -d ".turbo" ]; then
    echo "Clearing Turbo cache..."
    rm -rf .turbo
fi

# Reinstall dependencies
echo "Reinstalling dependencies..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v npm &> /dev/null; then
    npm install
fi

# Try build again
echo "Attempting build..."
if command -v pnpm &> /dev/null; then
    pnpm run build
elif command -v npm &> /dev/null; then
    npm run build
fi

echo "✅ Build fix attempt completed!"
