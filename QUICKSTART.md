# 🚀 Quick Start Guide

Get the Expense Fast Lane MVP running in under 5 minutes!

## Option 1: Quick Demo (No Setup Required)

Run with mock data - perfect for demos and testing:

```bash
# Install dependencies
npm install

# Run with sample receipt
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json --dryRun
```

This will:
- ✅ Parse the sample receipt
- ✅ Mock payment verification
- ✅ Simulate Jira task creation
- ✅ Simulate Notion entry
- ✅ Show confirmation message

**No API keys required!**

## Option 2: Full Setup (5 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your credentials
nano .env  # or use your favorite editor
```

Minimum configuration:
```env
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_CHANNEL_ID=C01234567
MOCK_MODE=true  # Keep this for now
```

### Step 3: Setup MCP Servers

```bash
# Create MCP servers directory
mkdir -p mcp-servers
cd mcp-servers

# Clone CodeGlide MCP servers
git clone https://github.com/CodeGlide/mcp-artifactory.git .

# Install Slack MCP server
cd slack_web
npm install
cd ..

# Install Notion MCP server (optional)
cd Notion
npm install
cd ..

# Install Jira MCP server (optional)
cd Jira_Integration_API
npm install
cd ..

# Go back to project root
cd ..
```

### Step 4: Run It!

```bash
npm run dev
```

## Testing Different Scenarios

### 1. Test with Sample Receipt 1 (Office Supplies)
```bash
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json --dryRun
```

### 2. Test with Sample Receipt 2 (Software Subscription)
```bash
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample2.json --dryRun
```

### 3. Test with Sample Receipt 3 (Marketing Expenses)
```bash
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample3.json --dryRun
```

### 4. Read from Real Slack Channel
```bash
# Make sure SLACK_BOT_TOKEN and SLACK_CHANNEL_ID are set in .env
npm run dev -- --sourceSlackChannel C01234567
```

### 5. Full Pipeline (All Integrations)
```bash
# Remove --dryRun to actually create Jira/Notion entries
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json
```

## Troubleshooting

### "Environment validation failed"
- Make sure `.env` file exists
- Check that required variables are set
- Use `MOCK_MODE=true` for testing

### "Failed to initialize MCP client"
- Verify MCP server paths in `mcp.config.json`
- Ensure MCP servers are installed (`npm install` in each server directory)
- Check credentials in `.env`

### "No payment receipt found"
- Verify Slack channel ID is correct
- Make sure bot has access to the channel
- Try using `--mockReceiptFile` instead

### Cannot find module errors
- Run `npm install` to ensure all dependencies are installed
- Run `npm run build` to compile TypeScript

## What's Next?

1. **Customize Receipt Parsing**: Edit `src/services/receipts.ts`
2. **Add Payment Providers**: Edit `src/services/payments.ts`
3. **Customize Jira Issues**: Edit `src/services/jira.ts`
4. **Adjust Notion Schema**: Edit `src/services/notion.ts`
5. **Change Slack Messages**: Edit `src/services/slack.ts`

## Demo Script

For hackathon presentations:

```bash
# 1. Show the architecture
cat README.md | grep -A 10 "Architecture"

# 2. Run the demo
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json

# 3. Show the output
# Point out:
# - Receipt parsing
# - Payment verification
# - Jira task creation
# - Notion entry
# - Slack confirmation

# 4. Show the code structure
tree src/

# 5. Explain extensibility
# - Easy to add new payment providers
# - Easy to customize workflows
# - MCP servers handle API complexity
```

## Need Help?

- 📖 See full [README.md](README.md) for detailed documentation
- 🔍 Check [CodeGlide docs](https://codeglide.ai/docs/introduction.html)
- 🐙 Browse [MCP artifactory](https://github.com/CodeGlide/mcp-artifactory)

---

**Ready to go? Run this now:**

```bash
npm install && npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json --dryRun
```

