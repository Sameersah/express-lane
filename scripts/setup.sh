#!/bin/bash

# Setup script for Expense Fast Lane MVP

set -e

echo "🚀 Setting up Expense Fast Lane MVP..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required (current: $(node -v))"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from env.example..."
    cp env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env with your actual credentials"
else
    echo ""
    echo "ℹ️  .env file already exists (skipping)"
fi

# Build TypeScript
echo ""
echo "🔨 Building TypeScript..."
npm run build

# Create MCP servers directory
if [ ! -d "mcp-servers" ]; then
    echo ""
    echo "📂 Creating mcp-servers directory..."
    mkdir -p mcp-servers
    echo "✅ mcp-servers directory created"
    echo ""
    echo "⚠️  Next steps:"
    echo "   1. Clone CodeGlide MCP artifactory:"
    echo "      cd mcp-servers"
    echo "      git clone https://github.com/CodeGlide/mcp-artifactory.git ."
    echo ""
    echo "   2. Install MCP server dependencies:"
    echo "      cd slack_web && npm install && cd .."
    echo "      cd Notion && npm install && cd .."
    echo "      cd Jira_Integration_API && npm install && cd .."
    echo ""
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Quick start:"
echo "   npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json --dryRun"
echo ""
echo "📚 See README.md for more options"

