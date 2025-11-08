import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MiniChart } from "./MiniChart";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronRight,
} from "lucide-react";

interface Holding {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

interface HoldingWithPrice extends Holding {
  currentPrice: number;
  change: number;
  changePercent: number;
  priceHistory: { date: string; price: number }[];
}

interface PortfolioTableProps {
  holdings: HoldingWithPrice[];
  onSelectHolding: (holding: Holding) => void;
  selectedHoldingId: string | null;
  onEditHolding: (holding: Holding) => void;
  onDeleteHolding: (holdingId: string) => void;
  onViewTranscript: (holding: Holding) => void;
}

export function PortfolioTable({
  holdings,
  onSelectHolding,
  selectedHoldingId,
  onEditHolding,
  onDeleteHolding,
  onViewTranscript,
}: PortfolioTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        <p>
          No stocks in your portfolio. Add your first stock to
          get started.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-strong floating-lg rounded-3xl overflow-hidden"  >
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-white/5 ">
            <TableHead className="w-[200px] text-xs h-10  ">
              Stock
            </TableHead>
            <TableHead className="w-[120px] text-xs h-10">
              Chart (30D)
            </TableHead>
            <TableHead className="text-right text-xs h-10">
              Price
            </TableHead>
            <TableHead className="text-right text-xs h-10">
              Change
            </TableHead>
            <TableHead className="text-right text-xs h-10">
              Holdings
            </TableHead>
            <TableHead className="text-right text-xs h-10">
              Value
            </TableHead>
            <TableHead className="text-right text-xs h-10">
              Gain/Loss
            </TableHead>
            <TableHead className="w-[80px] text-xs h-10">
              Alerts
            </TableHead>
            <TableHead className="w-[160px] text-xs h-10">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => {
            const isPositive = holding.change >= 0;
            const totalValue =
              holding.currentPrice * holding.quantity;
            const costBasis =
              holding.purchasePrice * holding.quantity;
            const totalGain = totalValue - costBasis;
            const totalGainPercent =
              (totalGain / costBasis) * 100;
            const isSelected = selectedHoldingId === holding.id;

            return (
              <TableRow
                key={holding.id}
                className={`border-border/30 cursor-pointer transition-all ${
                  isSelected
                    ? "bg-white/10"
                    : "hover:bg-white/5"
                }`}
                onClick={() => onSelectHolding(holding)}
              >
                <TableCell className="py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">
                        {holding.ticker}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {holding.quantity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {holding.name}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  <div className="h-10 w-full">
                    <MiniChart
                      data={holding.priceHistory}
                      isPositive={isPositive}
                    />
                  </div>
                </TableCell>

                <TableCell className="text-right text-sm py-3 text-foreground">
                  ${holding.currentPrice.toFixed(2)}
                </TableCell>

                <TableCell className="text-right py-3">
                  <div
                    className={`flex items-center justify-end gap-1 ${isPositive ? "text-green-primary" : "text-red-primary"}`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <div className="text-xs">
                      <div>
                        {isPositive ? "+" : ""}
                        {holding.change.toFixed(2)}
                      </div>
                      <div className="text-[10px]">
                        ({isPositive ? "+" : ""}
                        {holding.changePercent.toFixed(2)}%)
                      </div>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-right text-sm py-3 text-foreground">
                  ${costBasis.toFixed(2)}
                </TableCell>

                <TableCell className="text-right text-sm py-3 text-foreground">
                  ${totalValue.toFixed(2)}
                </TableCell>

                <TableCell className="text-right py-3">
                  <div
                    className={
                      totalGain >= 0
                        ? "text-green-primary"
                        : "text-red-primary"
                    }
                  >
                    <div className="text-xs">
                      {totalGain >= 0 ? "+" : ""}$
                      {totalGain.toFixed(2)}
                    </div>
                    <div className="text-[10px]">
                      ({totalGainPercent.toFixed(2)}%)
                    </div>
                  </div>
                </TableCell>

                <TableCell className="py-3">
                  {Math.abs(holding.changePercent) > 5 && (
                    <Badge
                      variant={
                        isPositive ? "default" : "destructive"
                      }
                      className={`text-[10px] px-1.5 py-0.5 flex items-center gap-1 w-fit ${
                        isPositive
                          ? "bg-green-primary/20 text-green-primary border-green-primary/30"
                          : "bg-red-primary/20 text-red-primary border-red-primary/30"
                      }`}
                    >
                      <AlertCircle className="w-2.5 h-2.5" />
                      Vol
                    </Badge>
                  )}
                </TableCell>

                <TableCell className="py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewTranscript(holding);
                      }}
                      className="h-8 px-3 text-[11px] text-foreground/80 hover:bg-white/10 rounded-xl transition-all glass-subtle"
                    >
                      Details
                      <ChevronRight className="h-3 w-3 ml-0.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditHolding(holding);
                      }}
                      className="h-8 w-8 p-0 text-foreground/80 hover:bg-white/10 rounded-xl transition-all glass-subtle"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHolding(holding.id);
                      }}
                      className="h-8 w-8 p-0 text-foreground/80 hover:bg-red-primary/10 hover:text-red-primary rounded-xl transition-all glass-subtle"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}