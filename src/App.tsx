import { useState, useEffect } from "react";
import { Button } from "./components/ui/button";
import { Plus, TrendingUp, LogOut } from "lucide-react";
import { PortfolioTable } from "./components/PortfolioTable";
import { AddStockDialog } from "./components/AddStockDialog";
import { EditStockDialog } from "./components/EditStockDialog";
import { StockPreviewPanel } from "./components/StockPreviewPanel";
import { TranscriptDetail } from "./components/TranscriptDetail";
import { AuthScreen } from "./components/AuthScreen";
import {
  projectId,
  publicAnonKey,
} from "./utils/supabase/info";
import { getSupabaseClient } from "./utils/supabase/client";

interface Holding {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  createdAt: string;
}

interface HoldingWithPrice extends Holding {
  currentPrice: number;
  change: number;
  changePercent: number;
  priceHistory: { date: string; price: number }[];
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<HoldingWithPrice[]>(
    [],
  );
  const [selectedHolding, setSelectedHolding] =
    useState<HoldingWithPrice | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] =
    useState(false);
  const [editingHolding, setEditingHolding] =
    useState<Holding | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"portfolio" | "transcript">("portfolio");
  const [transcriptStock, setTranscriptStock] = useState<{ ticker: string; name: string } | null>(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        await initializePortfolio(session.user.id);
      }
    } catch (error) {
      console.error("Error checking session:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializePortfolio = async (currentUserId: string) => {
    try {
      // Get or create a portfolio for the user
      const portfoliosResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/portfolios/${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      const portfoliosData = await portfoliosResponse.json();

      let currentPortfolioId: string;

      if (
        portfoliosData.portfolios &&
        portfoliosData.portfolios.length > 0
      ) {
        currentPortfolioId = portfoliosData.portfolios[0].id;
      } else {
        // Create a new portfolio
        const createResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/portfolios`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: currentUserId,
              name: "My Portfolio",
            }),
          },
        );

        const createData = await createResponse.json();
        currentPortfolioId = createData.portfolio.id;
      }

      setPortfolioId(currentPortfolioId);
      await loadHoldings(currentPortfolioId);
    } catch (error) {
      console.error("Error initializing portfolio:", error);
    }
  };

  const loadHoldings = async (portfolioId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/holdings/${portfolioId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      const data = await response.json();

      if (data.holdings && data.holdings.length > 0) {
        // Fetch current prices for all holdings
        const holdingsWithPrices = await Promise.all(
          data.holdings.map(async (holding: Holding) => {
            const priceResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/price/${holding.ticker}`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                },
              },
            );

            const priceData = await priceResponse.json();

            return {
              ...holding,
              currentPrice: priceData.price,
              change: priceData.change,
              changePercent: priceData.changePercent,
              priceHistory: priceData.history,
            };
          }),
        );

        setHoldings(holdingsWithPrices);
      } else {
        setHoldings([]);
      }
    } catch (error) {
      console.error("Error loading holdings:", error);
    }
  };

  const handleAddStock = async (stockData: {
    ticker: string;
    name: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
  }) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/holdings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portfolioId,
            ...stockData,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add stock");
      }

      // Reload holdings to include the new stock
      await loadHoldings(portfolioId);
    } catch (error) {
      console.error("Error adding stock:", error);
    }
  };

  const handleSelectHolding = (holding: Holding) => {
    const fullHolding = holdings.find(
      (h) => h.id === holding.id,
    );
    if (fullHolding) {
      setSelectedHolding(fullHolding);
    }
  };

  const handleEditHolding = (holding: Holding) => {
    setEditingHolding(holding);
    setIsEditDialogOpen(true);
  };

  const handleViewTranscript = (holding: Holding) => {
    setTranscriptStock({ ticker: holding.ticker, name: holding.name });
    setViewMode("transcript");
  };

  const handleBackToPortfolio = () => {
    setViewMode("portfolio");
    setTranscriptStock(null);
  };

  const handleUpdateStock = async (
    holdingId: string,
    data: {
      quantity: number;
      purchasePrice: number;
      purchaseDate: string;
    },
  ) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/holdings/${holdingId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update stock");
      }

      // Reload holdings
      await loadHoldings(portfolioId);
      setEditingHolding(null);
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this stock from your portfolio?",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/holdings/${holdingId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete stock");
      }

      // If the deleted holding was selected, clear the selection
      if (selectedHolding?.id === holdingId) {
        setSelectedHolding(null);
      }

      // Reload holdings
      await loadHoldings(portfolioId);
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  const handleAuthSuccess = async (
    authenticatedUserId: string,
  ) => {
    setUserId(authenticatedUserId);
    await initializePortfolio(authenticatedUserId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setHoldings([]);
    setSelectedHolding(null);
    setPortfolioId("");
  };

  if (loading) {
    return (
      <div className="dark h-screen w-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Loading...
        </p>
      </div>
    );
  }

  if (!userId) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  // Show transcript detail view
  if (viewMode === "transcript" && transcriptStock) {
    return (
      <div className="dark h-screen w-screen bg-background">
        <TranscriptDetail
          ticker={transcriptStock.ticker}
          name={transcriptStock.name}
          onBack={handleBackToPortfolio}
        />
      </div>
    );
  }

  const totalValue = holdings.reduce(
    (sum, h) => sum + h.currentPrice * h.quantity,
    0,
  );
  const totalCost = holdings.reduce(
    (sum, h) => sum + h.purchasePrice * h.quantity,
    0,
  );
  const totalGain = totalValue - totalCost;
  const totalGainPercent =
    totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const isPortfolioPositive = totalGain >= 0;

  return (
    <div className="dark h-screen w-screen bg-background flex flex-col overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-destructive/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 px-6 py-4 glass floating-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gradient-green flex items-center justify-center glow-green-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base text-foreground">
                Lybre Tracker
              </h1>
              <p className="text-[10px] text-muted-foreground">
                My Portfolio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[10px] text-foreground uppercase tracking-wider">
                Total Value
              </p>
              <p className="text-lg text-muted-foreground">
                ${totalValue.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-foreground uppercase tracking-wider">
                Total Gain/Loss
              </p>
              <p
                className={`text-lg ${isPortfolioPositive ? "text-green-primary" : "text-red-primary"}`}
              >
                {isPortfolioPositive ? "+" : ""}$
                {totalGain.toFixed(2)} (
                {totalGainPercent.toFixed(2)}%)
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gradient-green hover:opacity-90 transition-all text-white h-9 px-4 text-sm rounded-xl floating-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Stock
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="glass border-border/50 h-9 px-4 text-sm rounded-xl hover:bg-white/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex-1 flex overflow-hidden gap-6 p-6">
        {/* Portfolio Table */}
        <div className="flex-1 overflow-auto">
          <PortfolioTable
            holdings={holdings}
            onSelectHolding={handleSelectHolding}
            selectedHoldingId={selectedHolding?.id || null}
            onEditHolding={handleEditHolding}
            onDeleteHolding={handleDeleteHolding}
            onViewTranscript={handleViewTranscript}
          />
        </div>

        {/* Side Panel */}
        <div className="w-96 glass-strong floating-lg rounded-3xl overflow-hidden">
          <StockPreviewPanel
            holding={selectedHolding}
            currentPrice={selectedHolding?.currentPrice}
            change={selectedHolding?.change}
            changePercent={selectedHolding?.changePercent}
          />
        </div>
      </div>

      {/* Add Stock Dialog */}
      <AddStockDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddStock={handleAddStock}
      />

      {/* Edit Stock Dialog */}
      <EditStockDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        holding={editingHolding}
        onUpdateStock={handleUpdateStock}
      />
    </div>
  );
}