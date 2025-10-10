#!/bin/bash

# Quick Demo Script for Expense Fast Lane
# Run this to see the full workflow in action!

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     💸 Expense Fast Lane - Quick Demo                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from example..."
    cp env.example .env
    echo "✅ .env created (using mock mode)"
    echo ""
fi

echo "🎬 Running Demo with Sample Receipt..."
echo ""
echo "This will demonstrate:"
echo "  1️⃣  Reading payment message"
echo "  2️⃣  Verifying payment (mock)"
echo "  3️⃣  Creating Jira task (mock)"
echo "  4️⃣  Adding Notion entry (mock)"
echo "  5️⃣  Sending Slack confirmation (mock)"
echo ""
echo "Press Enter to start..."
read

npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json --dryRun

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     ✅ Demo Complete!                                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "Try these other samples:"
echo "  npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample2.json --dryRun"
echo "  npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample3.json --dryRun"
echo ""

