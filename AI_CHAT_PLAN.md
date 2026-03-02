# AI Chat Feature Implementation Plan
## My Money App - Natural Language Financial Assistant

**Date:** February 26, 2026  
**Status:** Planning Phase  
**Estimated Implementation Time:** 3-4 days

---

## 1. Feature Overview

### What It Does
An AI-powered chat interface that allows users to ask natural language questions about their financial data and receive intelligent, contextual answers. The AI has access to the user's transactions, budgets, subscriptions, and spending patterns.

### User Stories
- **"How much did I spend on groceries last month?"**
- **"What's my average daily spending this week?"**
- **"Show me all transactions over $100 from January"**
- **"Am I over budget on dining out?"**
- **"What are my recurring subscriptions and when do they renew?"**
- **"Compare my spending this month vs last month"**
- **"Suggest ways to reduce my monthly expenses"**

---

## 2. Technical Architecture

### High-Level Flow
```
User Question → Context Builder → AI Model → Response Parser → UI Display
                    ↓
            [Transactions, Budgets, Subscriptions]
```

### Components

#### 2.1 Frontend: `AIChatWidget.tsx`
- Floating chat button (FAB) in bottom-right corner
- Expandable chat drawer/sheet
- Message history with user/AI bubbles
- Quick action buttons (suggested questions)
- Loading states and error handling

#### 2.2 Backend: `/api/ai/chat` Endpoint
- POST endpoint accepting `{ message: string, context?: object }`
- Middleware to fetch user's financial data
- Context compression to fit AI token limits
- Response streaming for better UX

#### 2.3 Context Builder Service
- Aggregates transactions, budgets, subscriptions
- Summarizes data to reduce token usage
- Caches processed context (Redis/memory)
- Privacy-first approach (no PII sent to AI)

#### 2.4 AI Integration Layer
- Supports multiple providers (OpenAI, Anthropic, Kimi, Gemini)
- Configurable model selection
- Prompt templating system
- Token usage tracking

---

## 3. Data Context Strategy

### The Challenge
Sending 1000+ transactions to an AI exceeds token limits and exposes sensitive data.

### Solution: Smart Context Summarization

#### 3.1 Pre-Computed Summaries
```typescript
interface FinancialContext {
  // High-level metrics
  summary: {
    totalIncome: number
    totalExpenses: number
    netSavings: number
    transactionCount: number
    dateRange: { start: string, end: string }
  }
  
  // Category breakdowns (top 10)
  categories: {
    name: string
    amount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }[]
  
  // Monthly trends (last 6 months)
  monthlyTrends: {
    month: string
    income: number
    expenses: number
  }[]
  
  // Budget status
  budgets: {
    category: string
    allocated: number
    spent: number
    remaining: number
    status: 'under' | 'near' | 'over'
  }[]
  
  // Recurring/subscriptions
  subscriptions: {
    name: string
    amount: number
    frequency: string
    nextDue: string
  }[]
  
  // Recent notable transactions (top 20)
  recentTransactions: {
    date: string
    description: string
    amount: number
    category: string
  }[]
}
```

#### 3.2 Dynamic Query-Based Fetching
For specific questions, fetch targeted data:
- **"Show me Amazon purchases"** → Filter transactions by merchant
- **"What did I spend in January?"** → Filter by date range
- **"Transactions over $500"** → Filter by amount threshold

#### 3.3 Privacy Measures
- Never send raw transaction IDs
- Hash/anonymize merchant names if needed
- Let users disable AI features
- Clear data retention policies

---

## 4. AI Model Selection

### Primary Options

| Provider | Model | Pros | Cons | Cost |
|----------|-------|------|------|------|
| **Kimi** | kimi-k2.5 | Fast, good at structured output, cost-effective | Limited availability | Low |
| **OpenAI** | gpt-4o-mini | Reliable, fast, good reasoning | Higher cost | Medium |
| **Anthropic** | claude-3-haiku | Excellent at following instructions | Slower | Medium |
| **Gemini** | gemini-1.5-flash | Large context window, fast | Variable quality | Low |

### Recommendation
**Primary:** Kimi k2.5 (if available)  
**Fallback:** OpenAI GPT-4o-mini

### Prompt Engineering Strategy

#### System Prompt Template
```
You are a helpful financial assistant. You have access to the user's financial summary:

{{CONTEXT}}

Guidelines:
- Answer questions based ONLY on the provided data
- If you don't have enough information, say so
- Provide specific numbers and dates when available
- Suggest actionable insights when appropriate
- Never make up data or transactions
- Keep responses concise but informative
- Use markdown formatting for clarity

When asked about trends or comparisons:
- Calculate percentages and changes
- Highlight significant deviations
- Provide context ("this is 20% higher than last month")
```

#### Function Calling (Optional)
For structured queries, implement function calling:
- `get_transactions(filters)`
- `get_category_spending(category, period)`
- `get_budget_status(category)`
- `compare_periods(period1, period2)`

---

## 5. Security & Privacy

### Data Protection
1. **Context Sanitization:** Remove sensitive fields (account numbers, full descriptions)
2. **Token Encryption:** Encrypt context before sending to AI provider
3. **No Training:** Use providers that don't train on API calls
4. **User Consent:** Explicit opt-in required
5. **Audit Logs:** Log all AI interactions for transparency

### Rate Limiting
- 50 questions per day per user (generous)
- 5 concurrent requests max
- Token limit per request: 4K input, 2K output

---

## 6. Implementation Phases

### Phase 1: MVP (Day 1-2)
**Goal:** Basic chat with pre-computed summaries

**Tasks:**
1. Create `AIChatContextBuilder` service
2. Build `AIChatWidget` UI component
3. Implement `/api/ai/chat` endpoint
4. Add Kimi/OpenAI integration
5. Basic prompt template

**Deliverable:** Users can ask simple questions about spending and income

### Phase 2: Smart Queries (Day 3)
**Goal:** Dynamic data fetching based on question intent

**Tasks:**
1. Implement query classifier (simple keyword matching)
2. Add targeted data fetching functions
3. Support date range queries
4. Support category/merchant filtering
5. Add suggested questions UI

**Deliverable:** Users can ask specific questions like "Show me Amazon purchases in January"

### Phase 3: Advanced Features (Day 4)
**Goal:** Insights and recommendations

**Tasks:**
1. Trend analysis and comparisons
2. Anomaly detection ("unusual spending detected")
3. Budget recommendations
4. Subscription optimization suggestions
5. Export chat history

**Deliverable:** Proactive insights and actionable recommendations

---

## 7. File Organization

```
/root/cashflow/
├── apps/web/src/
│   ├── components/
│   │   ├── AIChat/
│   │   │   ├── AIChatWidget.tsx      # Main chat UI
│   │   │   ├── AIChatBubble.tsx      # Message bubble component
│   │   │   ├── AIChatInput.tsx       # Input with send button
│   │   │   └── SuggestedQuestions.tsx # Quick question chips
│   │   └── ...
│   ├── hooks/
│   │   └── useAIChat.ts              # Chat state management
│   └── services/
│       └── aiChatService.ts          # API client
│
├── services/api/src/
│   ├── routes/
│   │   └── aiChat.ts                 # /api/ai/chat endpoint
│   ├── services/
│   │   ├── AIChatContextBuilder.ts   # Context aggregation
│   │   ├── AIProvider.ts             # AI client abstraction
│   │   └── QueryClassifier.ts        # Intent detection
│   └── utils/
│       └── contextCompression.ts     # Token optimization
│
└── AI_CHAT_PLAN.md                   # This document
```

---

## 8. Implementation Steps (Using Cody + Claude)

### Step 1: Scaffold Backend
```bash
# Use Cody to generate the API route and services
cody --task "Create /api/ai/chat endpoint with context builder service" \
     --agents claude
```

**Expected Output:**
- `routes/aiChat.ts` with POST endpoint
- `services/AIChatContextBuilder.ts` with data aggregation
- `services/AIProvider.ts` with Kimi/OpenAI clients

### Step 2: Build Frontend Widget
```bash
# Use Cody to build the chat UI
cody --task "Create AIChatWidget component with chat interface" \
     --agents claude
```

**Expected Output:**
- `components/AIChat/AIChatWidget.tsx`
- `components/AIChat/AIChatBubble.tsx`
- `hooks/useAIChat.ts`

### Step 3: Connect Frontend to Backend
```bash
# Use Cody to wire up the API calls
cody --task "Connect AI chat widget to backend API with error handling" \
     --agents claude
```

**Expected Output:**
- Updated `aiChatService.ts`
- Error states in UI
- Loading indicators

### Step 4: Optimize Context & Prompts
```bash
# Use Cody to refine the AI prompts
cody --task "Optimize AI prompts for financial Q&A and add suggested questions" \
     --agents claude
```

**Expected Output:**
- Improved system prompt
- Query classification logic
- Suggested questions based on user data

### Step 5: Test & Polish
```bash
# Manual testing with sample questions
curl -X POST /api/ai/chat \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "How much did I spend on food last month?"}'
```

---

## 9. Testing Strategy

### Unit Tests
- Context builder accuracy
- Query classifier intent detection
- AI provider error handling

### Integration Tests
- End-to-end chat flow
- Token limit handling
- Rate limiting enforcement

### Manual Test Cases
1. **Basic:** "What was my total spending last month?"
2. **Category:** "How much on groceries this week?"
3. **Comparison:** "Compare January vs February spending"
4. **Budget:** "Am I over budget on dining?"
5. **Merchant:** "Show me all Amazon transactions"
6. **Edge:** "What did I spend on XYZ category?" (non-existent category)

---

## 10. Success Metrics

- **Engagement:** 30% of users try the chat within first week
- **Retention:** 50% of users return to chat within 7 days
- **Accuracy:** 90% of answers are factually correct
- **Performance:** Average response time < 3 seconds
- **Satisfaction:** User ratings > 4/5

---

## Appendix A: Sample Context JSON

```json
{
  "summary": {
    "totalIncome": 5200.00,
    "totalExpenses": 3847.50,
    "netSavings": 1352.50,
    "transactionCount": 127,
    "dateRange": { "start": "2026-02-01", "end": "2026-02-26" }
  },
  "categories": [
    { "name": "Food & Dining", "amount": 845.20, "percentage": 22, "trend": "up" },
    { "name": "Transport", "amount": 420.00, "percentage": 11, "trend": "stable" },
    { "name": "Shopping", "amount": 650.30, "percentage": 17, "trend": "down" }
  ],
  "monthlyTrends": [
    { "month": "2026-01", "income": 5200, "expenses": 4100 },
    { "month": "2026-02", "income": 5200, "expenses": 3847 }
  ],
  "budgets": [
    { "category": "Food", "allocated": 800, "spent": 845, "remaining": -45, "status": "over" },
    { "category": "Transport", "allocated": 500, "spent": 420, "remaining": 80, "status": "under" }
  ],
  "subscriptions": [
    { "name": "Netflix", "amount": 15.99, "frequency": "monthly", "nextDue": "2026-03-05" },
    { "name": "Spotify", "amount": 9.99, "frequency": "monthly", "nextDue": "2026-03-12" }
  ],
  "recentTransactions": [
    { "date": "2026-02-25", "description": "Whole Foods Market", "amount": 127.45, "category": "Food" },
    { "date": "2026-02-24", "description": "Shell Station", "amount": 45.00, "category": "Transport" }
  ]
}
```

---

## Appendix B: Cody Commands Reference

### Generate Backend
```bash
cody --task "Create AI chat backend with context builder and Kimi integration" \
     --agents claude \
     --workspace /root/cashflow
```

### Generate Frontend
```bash
cody --task "Create AIChatWidget component with floating button and chat drawer" \
     --agents claude \
     --workspace /root/cashflow
```

### Integrate & Test
```bash
cody --task "Wire up AI chat frontend to backend and add error handling" \
     --agents claude \
     --workspace /root/cashflow
```

---

**End of Plan**

Ready for implementation. Start with Phase 1 and iterate based on user feedback.
