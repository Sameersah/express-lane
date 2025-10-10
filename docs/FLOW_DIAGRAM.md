# 📊 Expense Fast Lane Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER / EXTERNAL SYSTEM                       │
│                                                                      │
│         "Payment received: $150 from John, order #12345"            │
│                                                                      │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │ Posts message
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          SLACK CHANNEL                               │
│                         (Payment Inbox)                              │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 1: Read messages
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SLACK MCP SERVER (CodeGlide)                      │
│                  • conversations.history                             │
│                  • chat.postMessage                                  │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Parse receipt data
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                                   │
│                   (src/orchestrator.ts)                              │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Receipt Object:                                            │    │
│  │ • orderId: "ORD-2024-001"                                  │    │
│  │ • amount: 150.00                                           │    │
│  │ • payer: "John Doe"                                        │    │
│  │ • source: "slack"                                          │    │
│  └────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Step 2: Verify payment
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PAYMENT VERIFICATION                              │
│                   (src/services/payments.ts)                         │
│                                                                      │
│  Mock Mode:              │  Production:                             │
│  • Always succeeds       │  • Square API                            │
│  • Instant response      │  • Real verification                     │
│  • Demo/testing          │  • Transaction ID                        │
└──────────────────────────────────┬───────────────────────────────────┘
                                   │
                                   │ Verification result
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                                   │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │ Verification Result:                                       │    │
│  │ • verified: true                                           │    │
│  │ • status: "success"                                        │    │
│  │ • transactionId: "txn_123"                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────┬───────────────────────┬────────────────────────┘
                     │                       │
     Step 3: Create  │                       │ Step 4: Create
     Jira task       │                       │ Notion entry
                     ▼                       ▼
    ┌──────────────────────┐    ┌──────────────────────┐
    │   JIRA MCP SERVER    │    │  NOTION MCP SERVER   │
    │    (CodeGlide)       │    │    (CodeGlide)       │
    │                      │    │                      │
    │  • createIssue       │    │  • pages.create      │
    │  • Project: EXP      │    │  • Database entry    │
    │  • Type: Task        │    │  • Properties:       │
    └──────────┬───────────┘    └──────────┬───────────┘
               │                           │
               │ Returns                   │ Returns
               │ EXP-1234                  │ page URL
               ▼                           ▼
    ┌──────────────────────────────────────────────┐
    │              JIRA                             │
    │                                               │
    │  Task: EXP-1234                               │
    │  Summary: Payment Received: ORD-2024-001      │
    │  Description: Full payment details            │
    │  Labels: payment, expense, automated          │
    │  Status: To Do                                │
    └───────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────┐
    │              NOTION                           │
    │                                               │
    │  Database Entry:                              │
    │  Order ID: ORD-2024-001                       │
    │  Amount: $150.00                              │
    │  Payer: John Doe                              │
    │  Status: Verified                             │
    │  Jira: EXP-1234                               │
    │  Timestamp: 2024-10-08T10:30:00Z              │
    └───────────────────────────────────────────────┘
               │                           │
               └──────────┬────────────────┘
                          │
                          │ Step 5: Send confirmation
                          ▼
            ┌──────────────────────────────┐
            │   SLACK MCP SERVER           │
            │    (CodeGlide)               │
            │                              │
            │  • chat.postMessage          │
            └──────────────┬───────────────┘
                           │
                           │ Post message
                           ▼
            ┌──────────────────────────────┐
            │      SLACK CHANNEL           │
            │                              │
            │  ✅ Payment Processed        │
            │  🧾 Order: ORD-2024-001      │
            │  💰 Amount: $150.00 USD      │
            │  👤 Payer: John Doe          │
            │  📋 Jira Task: EXP-1234      │
            │  📘 Notion: [link]           │
            │                              │
            │  Automated via Fast Lane 🚀  │
            └──────────────────────────────┘
```

## Sequence Diagram

```
User          Slack      Orchestrator    Payment     Jira MCP    Notion MCP
 │              │              │            │            │            │
 │─Post msg─────>              │            │            │            │
 │              │              │            │            │            │
 │              │<─Read msgs───│            │            │            │
 │              │──Messages────>            │            │            │
 │              │              │            │            │            │
 │              │              │─Verify─────>            │            │
 │              │              │<─Result────│            │            │
 │              │              │                         │            │
 │              │              │─Create issue────────────>            │
 │              │              │<─EXP-1234───────────────│            │
 │              │              │                                      │
 │              │              │─Create entry─────────────────────────>
 │              │              │<─Page URL────────────────────────────│
 │              │              │                         │            │
 │              │<─Post conf───│                         │            │
 │              │              │                         │            │
 │<─See conf────│              │                         │            │
```

## Data Flow

### 1. Receipt Extraction
```
Raw Slack Message:
"Payment received: $150.00 from John Doe for order #ORD-2024-001"

↓ Parse (src/services/receipts.ts)

Receipt Object:
{
  orderId: "ORD-2024-001",
  amount: 150.00,
  currency: "USD",
  payer: "John Doe",
  description: "...",
  timestamp: "2024-10-08T10:30:00Z",
  source: "slack"
}
```

### 2. Payment Verification
```
Receipt
↓
Payment Service (src/services/payments.ts)
↓
Square API / Mock
↓
Verification Result:
{
  verified: true,
  orderId: "ORD-2024-001",
  amount: 150.00,
  status: "success",
  transactionId: "txn_123",
  verifiedAt: "2024-10-08T10:30:05Z"
}
```

### 3. Jira Task Creation
```
Receipt + Verification
↓
Jira Service (src/services/jira.ts)
↓
Jira MCP Server
↓
Jira Issue:
{
  key: "EXP-1234",
  id: "10001",
  url: "https://your-domain.atlassian.net/browse/EXP-1234"
}
```

### 4. Notion Entry
```
Receipt + Verification + Jira Key
↓
Notion Service (src/services/notion.ts)
↓
Notion MCP Server
↓
Notion Page:
{
  id: "abc123",
  url: "https://notion.so/abc123"
}
```

### 5. Slack Confirmation
```
All Results
↓
Format Message (src/services/slack.ts)
↓
Slack MCP Server
↓
Posted to Channel (with thread reference)
```

## Error Handling Flow

```
Orchestrator
│
├─ Step fails?
│  ├─ Log error
│  ├─ Add to errors array
│  └─ Continue to next step
│
└─ All steps complete
   ├─ success: true (if no errors)
   └─ success: false (if any errors)
```

## Mock Mode vs Production Mode

### Mock Mode (MOCK_MODE=true)
```
Slack     → Mock Client (sample data)
Payment   → Mock Verification (always succeeds)
Jira      → Mock Client (logs only)
Notion    → Mock Client (logs only)
```

### Production Mode (MOCK_MODE=false)
```
Slack     → Real MCP Server → Slack API
Payment   → Real Square API
Jira      → Real MCP Server → Jira API
Notion    → Real MCP Server → Notion API
```

## File Organization

```
src/
├── index.ts              # CLI entry point
├── orchestrator.ts       # Main workflow logic
├── mcp/
│   └── clients.ts        # MCP client initialization & management
├── services/
│   ├── receipts.ts       # Receipt parsing & validation
│   ├── payments.ts       # Payment verification (Square/Mock)
│   ├── slack.ts          # Slack operations via MCP
│   ├── jira.ts           # Jira operations via MCP
│   └── notion.ts         # Notion operations via MCP
└── util/
    ├── env.ts            # Environment config & validation
    └── log.ts            # Logging utilities
```

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **MCP SDK**: @modelcontextprotocol/sdk
- **Validation**: Zod
- **CLI**: yargs
- **HTTP**: node-fetch
- **Retry Logic**: p-retry

## Key Design Decisions

1. **Service Layer**: Each integration (Slack, Jira, Notion) has its own service module
2. **Mock Support**: Every service has a mock mode for testing without API keys
3. **Error Resilience**: Orchestrator continues even if individual steps fail
4. **Type Safety**: Zod schemas for runtime validation
5. **Logging**: Structured logging with emojis for better UX
6. **CLI-First**: Command-line interface for easy scripting and demos

