import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-11f03654/health", (c) => {
  return c.json({ status: "ok" });
});

// Sign up endpoint
app.post("/make-server-11f03654/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Error in signup endpoint: ${error}`);
    return c.json({ error: "Failed to create user", details: String(error) }, 500);
  }
});

// Get all portfolios for a user
app.get("/make-server-11f03654/portfolios/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const portfolios = await kv.getByPrefix(`portfolio:${userId}:`);
    return c.json({ portfolios: portfolios || [] });
  } catch (error) {
    console.log(`Error fetching portfolios: ${error}`);
    return c.json({ error: "Failed to fetch portfolios", details: String(error) }, 500);
  }
});

// Create a new portfolio
app.post("/make-server-11f03654/portfolios", async (c) => {
  try {
    const { userId, name } = await c.req.json();
    const portfolioId = `portfolio:${userId}:${Date.now()}`;
    const portfolio = {
      id: portfolioId,
      userId,
      name,
      createdAt: new Date().toISOString(),
    };
    await kv.set(portfolioId, portfolio);
    return c.json({ portfolio });
  } catch (error) {
    console.log(`Error creating portfolio: ${error}`);
    return c.json({ error: "Failed to create portfolio", details: String(error) }, 500);
  }
});

// Get all holdings for a portfolio
app.get("/make-server-11f03654/holdings/:portfolioId", async (c) => {
  try {
    const portfolioId = c.req.param("portfolioId");
    const holdings = await kv.getByPrefix(`holding:${portfolioId}:`);
    return c.json({ holdings: holdings || [] });
  } catch (error) {
    console.log(`Error fetching holdings: ${error}`);
    return c.json({ error: "Failed to fetch holdings", details: String(error) }, 500);
  }
});

// Add a new holding
app.post("/make-server-11f03654/holdings", async (c) => {
  try {
    const { portfolioId, ticker, name, quantity, purchasePrice, purchaseDate } = await c.req.json();
    const holdingId = `holding:${portfolioId}:${ticker}:${Date.now()}`;
    const holding = {
      id: holdingId,
      portfolioId,
      ticker,
      name,
      quantity,
      purchasePrice,
      purchaseDate,
      createdAt: new Date().toISOString(),
    };
    await kv.set(holdingId, holding);
    return c.json({ holding });
  } catch (error) {
    console.log(`Error adding holding: ${error}`);
    return c.json({ error: "Failed to add holding", details: String(error) }, 500);
  }
});

// Update a holding
app.put("/make-server-11f03654/holdings/:holdingId", async (c) => {
  try {
    const holdingId = c.req.param("holdingId");
    const { quantity, purchasePrice, purchaseDate } = await c.req.json();
    
    // Get existing holding
    const existingHolding = await kv.get(holdingId);
    if (!existingHolding) {
      return c.json({ error: "Holding not found" }, 404);
    }
    
    // Update the holding
    const updatedHolding = {
      ...existingHolding,
      quantity,
      purchasePrice,
      purchaseDate,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(holdingId, updatedHolding);
    return c.json({ holding: updatedHolding });
  } catch (error) {
    console.log(`Error updating holding: ${error}`);
    return c.json({ error: "Failed to update holding", details: String(error) }, 500);
  }
});

// Delete a holding
app.delete("/make-server-11f03654/holdings/:holdingId", async (c) => {
  try {
    const holdingId = c.req.param("holdingId");
    
    // Check if holding exists
    const existingHolding = await kv.get(holdingId);
    if (!existingHolding) {
      return c.json({ error: "Holding not found" }, 404);
    }
    
    await kv.del(holdingId);
    return c.json({ success: true, message: "Holding deleted successfully" });
  } catch (error) {
    console.log(`Error deleting holding: ${error}`);
    return c.json({ error: "Failed to delete holding", details: String(error) }, 500);
  }
});

// Get earnings transcript data for a stock
app.get("/make-server-11f03654/earnings/:ticker", async (c) => {
  try {
    const ticker = c.req.param("ticker");
    const earningsData = await kv.get(`earnings:${ticker}`);
    
    // If no data exists, return mock data for demo purposes
    if (!earningsData) {
      const mockData = generateMockEarningsData(ticker);
      await kv.set(`earnings:${ticker}`, mockData);
      return c.json({ earnings: mockData });
    }
    
    return c.json({ earnings: earningsData });
  } catch (error) {
    console.log(`Error fetching earnings data: ${error}`);
    return c.json({ error: "Failed to fetch earnings data", details: String(error) }, 500);
  }
});

// Get full earnings transcript for a specific quarter
app.get("/make-server-11f03654/transcript/:ticker/:quarter", async (c) => {
  try {
    const ticker = c.req.param("ticker");
    const quarter = c.req.param("quarter");
    const transcriptKey = `transcript:${ticker}:${quarter}`;
    
    let transcriptData = await kv.get(transcriptKey);
    
    // If no data exists, generate mock transcript
    if (!transcriptData) {
      transcriptData = generateMockTranscript(ticker, quarter);
      await kv.set(transcriptKey, transcriptData);
    }
    
    return c.json({ transcript: transcriptData });
  } catch (error) {
    console.log(`Error fetching transcript: ${error}`);
    return c.json({ error: "Failed to fetch transcript", details: String(error) }, 500);
  }
});

// Get current stock price (mock data)
app.get("/make-server-11f03654/price/:ticker", async (c) => {
  try {
    const ticker = c.req.param("ticker");
    // Generate mock price data
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 20;
    const changePercent = (change / basePrice) * 100;
    
    return c.json({
      ticker,
      price: basePrice,
      change,
      changePercent,
      history: generatePriceHistory(basePrice),
    });
  } catch (error) {
    console.log(`Error fetching price data: ${error}`);
    return c.json({ error: "Failed to fetch price data", details: String(error) }, 500);
  }
});

// Helper function to generate mock earnings data
function generateMockEarningsData(ticker: string) {
  const topics = [
    "Revenue grew 23% YoY to $4.2B, beating analyst estimates of $3.9B",
    "Operating margin expanded to 28%, up from 24% in the previous quarter",
    "Cloud services segment showed strong momentum with 45% growth",
    "Management raised full-year guidance, now expecting $18-19B in revenue",
    "Customer acquisition costs decreased by 15% while retention improved",
    "New product launches contributed $300M in incremental revenue",
    "International markets outperformed with 35% growth vs 20% domestic",
    "Free cash flow increased to $1.1B, representing 26% of revenue",
  ];
  
  return {
    ticker,
    quarter: "Q3 2024",
    date: "2024-10-28",
    highlights: topics.slice(0, 5 + Math.floor(Math.random() * 3)),
    sentiment: Math.random() > 0.3 ? "positive" : "neutral",
  };
}

// Helper function to generate price history
function generatePriceHistory(basePrice: number) {
  const history = [];
  let price = basePrice;
  for (let i = 30; i >= 0; i--) {
    price = price + (Math.random() - 0.5) * 5;
    history.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: Math.max(price, 10),
    });
  }
  return history;
}

// Helper function to generate mock transcript
function generateMockTranscript(ticker: string, quarter: string) {
  const highlights = [
    {
      id: "h1",
      text: "Revenue for the quarter came in at $4.2 billion, representing a 23% year-over-year increase and beating consensus estimates by $300 million. This growth was primarily driven by our cloud services division which saw remarkable adoption across enterprise customers.",
      sentiment: "positive",
      impact: 5,
      explanation: "Revenue beating estimates by 7.7% is a strong positive signal, indicating robust business performance and potential for continued growth.",
      aiInsight: "This substantial revenue beat suggests the company is executing well on its growth strategy. The 23% YoY growth rate is particularly impressive in the current market environment, and the fact that it's driven by cloud services (typically higher-margin) bodes well for future profitability. This could lead to positive earnings revisions."
    },
    {
      id: "h2",
      text: "Operating margins expanded to 28%, up from 24% in the prior quarter and 22% in the year-ago period. This improvement reflects our disciplined cost management and the positive operating leverage we're achieving as we scale.",
      sentiment: "positive",
      impact: 4,
      explanation: "Margin expansion of 400 basis points year-over-year demonstrates improving operational efficiency and pricing power.",
      aiInsight: "The consistent margin expansion is a key indicator of business quality. Moving from 22% to 28% in one year while growing revenue 23% shows strong operational leverage. This suggests the company has pricing power and is not sacrificing margins for growth—a sign of a healthy, sustainable business model."
    },
    {
      id: "h3",
      text: "Customer acquisition costs have risen by 18% compared to last quarter, though we're seeing strong unit economics on these new customers with an LTV/CAC ratio of 3.5x.",
      sentiment: "negative",
      impact: 2,
      explanation: "Rising CAC can pressure margins if it continues, though the strong LTV/CAC ratio suggests customer economics remain healthy.",
      aiInsight: "While the 18% increase in CAC is concerning and worth monitoring, the 3.5x LTV/CAC ratio indicates the company is still acquiring customers profitably. Industry best practice suggests 3x or higher is good, so this is still in healthy territory. However, if CAC continues rising while competition intensifies, it could become problematic."
    },
    {
      id: "h4",
      text: "We're investing heavily in R&D, with spending up 35% year-over-year to $800 million. These investments are focused on our next-generation AI platform which we expect to launch in Q1 next year.",
      sentiment: "positive",
      impact: 4,
      explanation: "Strategic R&D investment in high-growth areas like AI positions the company for long-term competitive advantage.",
      aiInsight: "The significant R&D investment shows management is thinking long-term and positioning the company for the AI revolution. While this temporarily pressures near-term profitability, it's a necessary investment for maintaining competitive positioning. The fact that margins are still expanding despite this increased R&D spend is particularly impressive."
    },
    {
      id: "h5",
      text: "International revenue declined 5% due to macroeconomic headwinds in Europe and currency fluctuations. We're seeing particular softness in our EMEA region.",
      sentiment: "negative",
      impact: 3,
      explanation: "International weakness and FX headwinds indicate external challenges that could persist and impact growth trajectory.",
      aiInsight: "The 5% decline in international revenue is a red flag that needs close monitoring. While management attributes it to macro factors and FX, investors should watch for whether this is the start of a trend. If international markets represent a significant portion of the growth thesis, continued weakness here could lead to multiple compression. The company may need to demonstrate resilience in these markets or show that domestic strength can compensate."
    },
    {
      id: "h6",
      text: "Free cash flow for the quarter was $1.1 billion, up 42% year-over-year, representing a 26% free cash flow margin. We're using this to fund our share buyback program and have repurchased $400 million in shares this quarter.",
      sentiment: "positive",
      impact: 5,
      explanation: "Strong FCF generation and capital allocation through buybacks demonstrates financial strength and shareholder-friendly management.",
      aiInsight: "The 42% FCF growth outpacing revenue growth (23%) is excellent, showing strong cash conversion and working capital management. The 26% FCF margin is impressive and the $400M buyback demonstrates confidence in the business and commitment to returning capital to shareholders. This financial strength provides flexibility for both investment and shareholder returns."
    }
  ];

  // Generate sections with regular text between highlights
  const regularTexts = [
    "Good afternoon, and welcome to our Q4 2024 earnings call. I'm joined today by our CFO and COO to discuss our financial results and business performance. Before we begin, I'd like to remind everyone that this call may contain forward-looking statements.",
    "Looking at our product performance, we continued to see strong momentum across our entire portfolio. Our enterprise segment grew 31% year-over-year, while small and medium businesses grew 18%. The cross-sell opportunities we've been developing are starting to pay dividends.",
    "From an operational perspective, we've made significant investments in automation and process improvements. Our customer support team has implemented AI-assisted ticketing that has reduced response times by 40% while maintaining high satisfaction scores. These efficiency gains are contributing to our margin expansion.",
    "On the talent front, we've been selective in our hiring, focusing on high-impact roles in engineering and product. Our employee retention rates remain strong at 94%, which is above industry benchmarks. We're also seeing great results from our internal mobility program.",
    "Regarding our go-to-market strategy, we've expanded our partner ecosystem significantly. We now have over 500 certified implementation partners globally, up from 320 last year. This is helping us scale more efficiently while maintaining quality standards.",
    "In closing, we're pleased with our Q4 results and the momentum we're carrying into next year. We remain focused on sustainable growth, operational excellence, and creating long-term value for our shareholders. We'll now open it up for questions."
  ];

  const sections = [];
  highlights.forEach((highlight, index) => {
    // Add regular text before the highlight
    if (index < regularTexts.length) {
      sections.push({
        type: "regular",
        content: regularTexts[index]
      });
    }
    
    // Add the highlight
    sections.push({
      type: "highlight",
      content: highlight.text,
      highlight: highlight
    });
  });

  // Add final regular text
  if (highlights.length < regularTexts.length) {
    sections.push({
      type: "regular",
      content: regularTexts[regularTexts.length - 1]
    });
  }

  return {
    quarter,
    date: formatQuarterDate(quarter),
    summary: [
      "Revenue beat estimates by 7.7% at $4.2B with 23% YoY growth",
      "Operating margins expanded 600bps to 28%, showing strong operational leverage",
      "Free cash flow increased 42% YoY to $1.1B (26% FCF margin)",
      "Cloud services division driving growth with strong enterprise adoption",
      "International revenue declined 5% due to macro headwinds and FX",
      "Heavy R&D investment in AI platform for Q1 launch",
      "Executed $400M share buyback demonstrating capital allocation discipline"
    ],
    highlights,
    sections
  };
}

function formatQuarterDate(quarter: string) {
  const [year, q] = quarter.split("-");
  const quarterNum = parseInt(q.replace("Q", ""));
  const month = (quarterNum - 1) * 3 + 2; // Middle month of quarter
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[month]} ${year}`;
}

Deno.serve(app.fetch);
