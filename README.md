# 💸 Expense → Revenue Fast Lane MVP

**Hackathon winning project**: Qualcomm Local AI Hackathon - **contributor**: Shruti Goyal (Github:[ @shrutiebony](https://github.com/shrutiebony))

A 20-minute demo MVP that orchestrates payment processing workflows using **CodeGlide MCP servers**. This project connects Slack → Payment Verification → Jira → Notion → Slack confirmation in a single automated flow.

## 🚀 Quick Demo

**Golden Path Flow:**
```
📨 Slack message → 💳 Verify payment → 🧾 Jira task → 📘 Notion entry → 🔔 Slack confirmation
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Expense Fast Lane                        │
│                                                             │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐│
│  │  Slack   │──▶│ Payment  │──▶│   Jira   │──▶│  Notion  ││
│  │   MCP    │   │ Verify   │   │   MCP    │   │   MCP    ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘│
│       │                                             │       │
│       └─────────────────────────────────────────────┘       │
│                   Confirmation Reply                        │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Node.js 18+ and npm
- CodeGlide MCP servers for Slack, Jira, and Notion
- API credentials (or run in mock mode)

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL_ID=C01234567

# Notion Configuration
NOTION_TOKEN=secret_your-notion-integration-token
NOTION_DB_ID=your-notion-database-id

# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=EXP

# Payment Configuration (optional)
SQUARE_ACCESS_TOKEN=your-square-access-token
MOCK_MODE=true
```

### 3. Setup CodeGlide MCP Servers

Clone the CodeGlide MCP artifactory:

```bash
# Create a directory for MCP servers
mkdir -p mcp-servers
cd mcp-servers

# Clone the CodeGlide MCP artifactory
git clone https://github.com/CodeGlide/mcp-artifactory.git .

# Install dependencies for each MCP server
cd slack_web && npm install && cd ..
cd Notion && npm install && cd ..
cd Jira_Integration_API && npm install && cd ..

cd ..
```

Update `mcp.config.json` with the correct paths if needed.

## 🎯 Usage

### Run with Mock Data (No API Keys Required)

Perfect for testing and demos:

```bash
npm run dev -- --mockReceiptFile ./scripts/demo-data/receipt.sample.json --dryRun
```

### Run with Real Slack Channel

Read payment messages from a specific Slack channel:

```bash
npm run dev -- --sourceSlackChannel C01234567
```

### Run Full Pipeline

With all integrations enabled:

```bash
npm run dev
```

### Command-Line Options

```bash
npm run dev -- [options]

Options:
  -s, --sourceSlackChannel  Slack channel ID to read payments from
  -m, --mockReceiptFile     Path to mock receipt JSON file
  -d, --dryRun             Dry run mode (skip writes)
  -v, --verbose            Enable verbose logging
  -h, --help               Show help
```

## 📦 Project Structure

```
mvp-expense-lane/
├── src/
│   ├── index.ts              # Main entry point
│   ├── orchestrator.ts       # Main orchestration logic
│   ├── mcp/
│   │   └── clients.ts        # MCP client initialization
│   ├── services/
│   │   ├── receipts.ts       # Receipt parsing & validation
│   │   ├── payments.ts       # Payment verification (Square/mock)
│   │   ├── jira.ts           # Jira issue creation
│   │   ├── notion.ts         # Notion database updates
│   │   └── slack.ts          # Slack message handling
│   └── util/
│       ├── env.ts            # Environment configuration
│       └── log.ts            # Logging utilities
├── scripts/
│   └── demo-data/
│       └── receipt.sample.json
├── mcp.config.json           # MCP server configuration
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

## 🔄 Workflow Steps

### 1. Read Payment Message from Slack

The orchestrator fetches recent messages from a Slack channel and parses them to extract payment information:

```typescript
// Looks for patterns like:
// "Payment received: $150 from John Doe for Order #12345"
```

### 2. Verify Payment

Verifies the payment via Square API or mock verification:

```typescript
const verification = await verifyPayment(receipt);
// Returns: { verified: true, status: 'success', transactionId: '...' }
```

### 3. Create Jira Task

Creates a Jira issue with payment details:

```typescript
const jiraIssue = await createPaymentJiraIssue(jiraClient, receipt, verification);
// Returns: { key: 'EXP-1234', url: '...' }
```

### 4. Append to Notion Database

Adds an entry to your Notion database:

```typescript
const notionPage = await createNotionPaymentEntry(
  notionClient,
  receipt,
  verification,
  jiraIssue.key
);
```

### 5. Post Confirmation to Slack

Sends a formatted confirmation message back to Slack:

```
✅ Payment Processed Successfully

🧾 Order: ORD-2024-001
💰 Amount: $150.00 USD
👤 Payer: John Doe

📋 Jira Task: EXP-1234
📘 Notion Entry: https://notion.so/...

_Automated via Expense Fast Lane 🚀_
```

## 🧪 Testing

### Mock Mode

Set `MOCK_MODE=true` in `.env` to use mock implementations for all services:

- Mock Slack client returns sample messages
- Mock payment verification always succeeds
- Mock Jira/Notion clients log actions without API calls

### Demo with Sample Data

```bash
npm run dev -- \
  --mockReceiptFile ./scripts/demo-data/receipt.sample.json \
  --dryRun
```

### Create Custom Test Receipts

Create a JSON file with your test data:

```json
{
  "orderId": "TEST-001",
  "amount": 99.99,
  "currency": "USD",
  "payer": "Jane Smith",
  "description": "Test payment",
  "source": "manual"
}
```

Then run:

```bash
npm run dev -- --mockReceiptFile ./my-test-receipt.json
```

## 🎨 Customization

### Adding New Payment Providers

Edit `src/services/payments.ts` to add support for additional payment gateways:

```typescript
export async function verifyPaymentWithStripe(receipt: Receipt) {
  // Your Stripe integration logic
}
```

### Customizing Jira Fields

Edit `src/services/jira.ts` to customize the issue format:

```typescript
const summary = `Custom: ${receipt.orderId}`;
// Add custom fields, labels, etc.
```

### Notion Database Schema

The code expects a Notion database with these properties:

- **Order ID** (Title)
- **Amount** (Number)
- **Currency** (Select)
- **Payer** (Text)
- **Status** (Select: Verified, Pending)
- **Source** (Select: slack, email, webhook, manual)
- **Timestamp** (Date)
- **Jira Issue** (Text) - optional
- **Transaction ID** (Text) - optional

## 🚦 Error Handling

The orchestrator continues execution even if individual steps fail:

- Each step is wrapped in try-catch
- Errors are collected and reported at the end
- Mock clients are used as fallback when API clients fail

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use environment variables for all secrets
- MCP servers run as separate processes with isolated credentials
- Consider using secret management tools for production

## 📚 References

- **CodeGlide Documentation**: https://codeglide.ai/docs/introduction.html
- **MCP Artifactory**: https://github.com/CodeGlide/mcp-artifactory
- **Model Context Protocol**: https://modelcontextprotocol.io

## 🤝 Contributing

This is a hackathon MVP. Contributions and improvements are welcome!

### Stretch Goals

- [ ] Add retry logic with exponential backoff
- [ ] Include Notion page link in Slack reply
- [ ] Display payment reconciliation statistics
- [ ] Support multiple payment providers
- [ ] Add webhook receiver for real-time processing
- [ ] Create dashboard for monitoring

## 📄 License

MIT

---

**Built with ❤️ using CodeGlide MCP Servers**

