# 🍽️ Ecomeal - AI-Powered Restaurant Operating System

A full-stack restaurant inventory and kitchen intelligence platform built for the Ecomeal internship assignment.

## 🚀 Live Demo
https://ecomeal-lake.vercel.app

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Groq API (LLaMA 3.3 70B) |
| Real-time | Polling + Supabase |
| Offline | LocalStorage + Queue Sync |

## 📁 Project Structure
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── login/page.tsx            # Login
│   ├── signup/page.tsx           # Signup with role selection
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard with stats
│   │   ├── inventory/page.tsx    # Inventory management
│   │   ├── ai/page.tsx           # AI Chef Specials
│   │   └── analytics/page.tsx   # Analytics & charts
│   └── api/
│       └── ai/route.ts           # Groq AI API route
└── lib/
└── supabase.ts               # Supabase client + offline utilities

## ⚙️ Architecture Decisions

### Why Next.js?
Chose Next.js over separate React + Node/Express setup to reduce complexity. API routes handle backend logic in the same project — one deployment, one codebase, no CORS issues.

### Why Supabase?
Supabase provides PostgreSQL, Auth, and real-time out of the box. For a 48-hour build, this was the right tradeoff — it let me focus engineering effort on core inventory logic and AI integration rather than boilerplate auth infrastructure.

### Why Groq?
Groq's LLaMA 3.3 70B is free, fast, and reliable. It generates structured JSON responses for dish recommendations consistently. In production, this could be swapped for any OpenAI-compatible API.

### Why Polling over WebSockets?
Polling every 30 seconds was chosen over WebSockets for simplicity and debuggability. WebSockets would be the next step in production for true real-time updates.

## 🗄️ Database Design

```sql
profiles        -- User profiles with roles (admin, kitchen_manager, staff)
inventory       -- Inventory items with expiry, quantity, supplier info
chef_specials   -- AI-generated dish recommendations
inventory_logs  -- Audit log for inventory changes
```

### Indexes & Design Decisions
- UUID primary keys for all tables
- `expiry_date` indexed for fast expiry queries
- `category` field for filtering
- `min_stock_level` per item for flexible low-stock alerts

## 📶 Offline-First Strategy

1. On load, fetch from Supabase and cache to `localStorage`
2. On offline, serve from cache
3. Any add/delete actions are queued in `localStorage`
4. On reconnect, queue is synced to Supabase automatically
5. UI shows online/offline status indicator

## 🤖 AI Integration

- User's expiring inventory items are sent to Groq API
- LLaMA 3.3 70B generates 3 dish recommendations as structured JSON
- Each dish includes: name, description, ingredients used, waste reduction tip
- Fallback error handling if AI API is down

## ⚡ Performance Optimizations

- Client-side search and filter (no extra API calls)
- localStorage caching reduces database reads
- Polling interval of 30s to balance freshness vs server load
- Next.js automatic code splitting per route

## 🔒 Error Handling

- All API routes wrapped in try/catch
- Offline queue prevents data loss
- UI shows clear error messages
- Graceful fallback to cache when network fails

## 🧠 Assumptions Made

- Single restaurant deployment (not multi-tenant)
- Inventory managed by authenticated users only
- AI recommendations based on soonest-expiring items (top 6)
- Offline sync uses last-write-wins strategy

## 🔮 Future Improvements

- WebSockets for true real-time updates
- Push notifications for expiry alerts
- BullMQ + Redis for background job processing
- Docker + CI/CD pipeline
- Unit and integration tests
- Mobile app (React Native)
- Multi-restaurant/tenant support

## 🏃 Running Locally

1. Clone the repo
2. Install dependencies: `npm install`
3. Create `.env.local`:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GEMINI_API_KEY=your_groq_api_key

4. Run: `npm run dev`
5. Open: `http://localhost:3000`

## 📡 API Documentation

### POST /api/ai
Generates AI-powered dish recommendations based on expiring ingredients.

**Request Body:**
```json
{
  "ingredients": "Paneer (20kg, expires 2026-05-29), Spinach (5kg, expires 2026-05-28)"
}
```

**Success Response:**
```json
{
  "dishes": [
    {
      "name": "Palak Paneer",
      "description": "Creamy spinach curry with paneer",
      "ingredients": ["Paneer", "Spinach"],
      "waste_tip": "Uses expiring spinach and paneer to reduce waste"
    }
  ]
}
```

**Error Response:**
```json
{
  "error": "AI generation failed"
}
```