# Lybre Web

A portfolio management application with real-time stock data and AI-powered earnings analysis.

The original design is available at https://www.figma.com/design/5iEwwKGsmcky1bwDKAqmBz/Lybre-Web.

## Features

- **Real-time Stock Prices**: Integration with Financial Modeling Prep API for live stock quotes and historical data
- **AI Earnings Analysis**: Earnings transcripts analyzed and stored in Supabase
- **Portfolio Management**: Track your stock holdings with real-time valuations
- **Interactive Charts**: Visualize price history and performance

## Setup

### 1. Install Dependencies

```bash
npm i
```

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `FMP_API_KEY`: Your Financial Modeling Prep API key ([Get one here](https://site.financialmodelingprep.com/developer/docs))

### 3. Database Setup

The application uses a Supabase table `ai_analyses` for earnings transcript data. The schema is:

```sql
create table public.ai_analyses (
  id uuid not null default gen_random_uuid(),
  symbol character varying(20) not null,
  year integer not null,
  quarter integer not null,
  llm_model character varying(50) not null,
  analysis_date timestamp without time zone not null default now(),
  topics jsonb not null,
  analysis jsonb not null,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint ai_analyses_pkey primary key (id)
);
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Sources

### Stock Prices & Charts
- **Provider**: Financial Modeling Prep (FMP) API
- **Data**: Real-time quotes, historical prices (30 days)
- **Endpoints**: `/quote`, `/historical-price-full`
- **Caching**: 60 seconds for quotes, 1 hour for historical data

### Earnings & Transcripts
- **Provider**: Supabase `ai_analyses` table
- **Data**: AI-analyzed earnings call transcripts with sentiment analysis
- **Features**: Highlights, impact scores, AI insights
- **Caching**: Stored in KV store per user

## Supported Stocks

The application currently supports the following stocks:
- AAPL (Apple Inc.)
- MSFT (Microsoft Corporation)
- GOOGL (Alphabet Inc.)
- AMZN (Amazon.com Inc.)
- NVDA (NVIDIA Corporation)
- TSLA (Tesla Inc.)
- META (Meta Platforms Inc.)
- BRK.B (Berkshire Hathaway Inc.)
- V (Visa Inc.)
- JPM (JPMorgan Chase & Co.)

## Architecture

- **Frontend**: Next.js 14 with App Router
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **API**: Financial Modeling Prep
