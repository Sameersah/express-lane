# 🎤 Demo Script - Expense Fast Lane

**Duration**: 5 minutes  
**Audience**: Hackathon judges, investors, or technical audience

---

## 🎯 The Problem (30 seconds)

> "When a company receives payments, there's usually a manual process: someone sees a payment notification, verifies it, creates a task in Jira to track it, logs it in a database like Notion, and notifies the team. This takes 10-15 minutes per payment and is error-prone."

**Pain Points:**
- Manual data entry across multiple systems
- Context switching between Slack, payment systems, Jira, Notion
- Risk of forgetting steps or making errors
- No audit trail

---

## 💡 The Solution (30 seconds)

> "Expense Fast Lane automates this entire workflow using **CodeGlide MCP servers**. When a payment message appears in Slack, our system automatically verifies the payment, creates a Jira task, logs it in Notion, and sends a confirmation—all in seconds."

**Key Innovation:**
- Uses Model Context Protocol (MCP) - the new standard for AI-API integration
- CodeGlide automatically generates MCP servers from existing APIs
- No need to write custom integrations for each tool

---

## 🚀 Live Demo (3 minutes)

### Setup (Show on screen)

```bash
cd expense-fastLane
cat env.example
```

**Narrate:**
> "The system is configured via environment variables. We support Slack, Jira, Notion, and Square payments. For this demo, I'll run in mock mode so you can see it work without real credentials."

### Demo Run 1: Basic Flow

```bash
npm run dev -- \
  --mockReceiptFile ./scripts/demo-data/receipt.sample.json \
  --dryRun
```

**Narrate as it runs:**

1. **"First, it reads the payment message..."**
   - Point to the receipt extraction output
   - Highlight: Order ID, Amount, Payer

2. **"Next, it verifies the payment..."**
   - Show verification result
   - In production, this calls Square API

3. **"Then creates a Jira task..."**
   - Show Jira issue key (EXP-1234)
   - Mention: includes full payment details

4. **"Logs it in Notion database..."**
   - Show Notion page ID
   - Explain: structured data for reporting

5. **"Finally, sends confirmation to Slack"**
   - Show the confirmation message format
   - Highlight: includes links to Jira and Notion

### Demo Run 2: Different Receipt

```bash
npm run dev -- \
  --mockReceiptFile ./scripts/demo-data/receipt.sample2.json \
  --dryRun
```

**Narrate:**
> "It works with any payment format. Here's a different receipt with different wording—the parser automatically extracts the key information."

### Show the Code (30 seconds)

```bash
tree src/ -L 2
```

**Narrate:**
> "The architecture is clean and modular:
> - `orchestrator.ts` - coordinates the workflow
> - `services/` - one module per integration
> - `mcp/clients.ts` - handles MCP server connections
> 
> Each service has a mock mode, making it easy to test and demo."

---

## 🎨 Technical Highlights (1 minute)

### 1. Show MCP Configuration

```bash
cat mcp.config.json
```

**Narrate:**
> "This is where we configure the CodeGlide MCP servers. Each server is a separate process that handles API communication. We just call standard MCP tools—no need to learn each API's quirks."

### 2. Show Receipt Parsing

```bash
cat src/services/receipts.ts | grep -A 5 "const patterns"
```

**Narrate:**
> "The receipt parser uses regex patterns to extract payment info from natural language. It handles various formats:
> - 'Payment received: $150 from John for order #12345'
> - '$99.99 from Jane, order ABC-123'
> - Different orderings, punctuation, etc."

### 3. Show Service Mock Pattern

```bash
cat src/services/slack.ts | grep -A 10 "createMockSlackClient"
```

**Narrate:**
> "Every service has a mock implementation. This makes the system testable without API keys and great for demos like this one."

---

## 🌟 Key Benefits (30 seconds)

**Efficiency:**
- 10-15 minutes → 5 seconds per payment
- Zero manual data entry

**Accuracy:**
- No copy-paste errors
- Consistent formatting

**Auditability:**
- Complete trail in Jira and Notion
- Timestamps and verification status

**Extensibility:**
- Easy to add new payment providers
- Easy to add new integration points
- MCP makes it future-proof

---

## 🔮 What's Next (30 seconds)

**Immediate:**
- Add retry logic with exponential backoff
- Support webhooks for real-time processing
- Dashboard for payment analytics

**Future:**
- AI-powered fraud detection using receipt patterns
- Automated reconciliation against bank statements
- Multi-currency support
- Custom approval workflows

---

## 💬 Q&A Prep

### Expected Questions:

**Q: Why MCP instead of direct API calls?**
> A: MCP provides standardization. Instead of learning Slack API, Jira API, Notion API separately, we use one protocol. CodeGlide auto-generates the MCP servers, so we get updates automatically when APIs change.

**Q: What if verification fails?**
> A: The system still creates Jira and Notion entries but marks them as "Pending" instead of "Verified" and sets higher priority. A human can review and take action.

**Q: Can it handle concurrent payments?**
> A: Yes, each orchestration is independent. You could run multiple instances or add a queue system for high volume.

**Q: What about security?**
> A: MCP servers run as separate processes with isolated credentials. Environment variables for secrets. In production, we'd use proper secret management (AWS Secrets Manager, HashiCorp Vault, etc.).

**Q: How do you handle API rate limits?**
> A: The `p-retry` library is already included for retry logic. Each MCP server handles its own rate limiting based on the underlying API.

**Q: Can I customize the workflow?**
> A: Absolutely. The orchestrator is just a function that calls services in sequence. You can easily reorder steps, add conditional logic, or create completely custom workflows.

---

## 📊 Demo Tips

1. **Practice the timing** - aim for under 5 minutes total
2. **Have terminal ready** with commands in history (up arrow)
3. **Zoom in** on terminal for better visibility
4. **Use `--verbose`** if you want more detailed output
5. **Have backup** - show the README if live demo fails
6. **Show enthusiasm** - this is solving a real problem!

---

## 🎬 Opening Line Options

**Option 1 (Problem-First):**
> "How many of you manually copy payment information into multiple systems? It's tedious and error-prone. Let me show you how we automated that."

**Option 2 (Tech-First):**
> "Model Context Protocol is the new standard for AI-API integration. I built a payment automation system using CodeGlide MCP servers. Let me show you."

**Option 3 (Impact-First):**
> "This system reduces payment processing from 10 minutes to 5 seconds. Here's how it works."

---

## 🎯 Closing Line Options

**Option 1:**
> "That's Expense Fast Lane—turning hours of manual work into seconds of automation using CodeGlide MCP servers. Questions?"

**Option 2:**
> "We've automated the payment processing workflow completely. Ready for production, extensible, and built on the emerging MCP standard. What would you like to know?"

**Option 3:**
> "From payment notification to full tracking in under 5 seconds. That's the power of MCP and CodeGlide. Thank you!"

---

**Good luck! 🚀**

