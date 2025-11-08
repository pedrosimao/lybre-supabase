import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  Target,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";

interface TranscriptDetailProps {
  ticker: string;
  name: string;
  onBack: () => void;
}

interface TranscriptHighlight {
  id: string;
  text: string;
  sentiment: "positive" | "negative";
  impact: number; // 1-5
  explanation: string;
  aiInsight: string;
}

interface TranscriptSection {
  type: "highlight" | "regular";
  content: string;
  highlight?: TranscriptHighlight;
}

interface TranscriptData {
  quarter: string;
  date: string;
  summary: string[];
  highlights: TranscriptHighlight[];
  sections: TranscriptSection[];
}

export function TranscriptDetail({
  ticker,
  name,
  onBack,
}: TranscriptDetailProps) {
  const [selectedQuarter, setSelectedQuarter] =
    useState<string>("");
  const [transcript, setTranscript] =
    useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const highlightRefs = useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});

  // Generate available quarters (last 5 years)
  const quarters = generateQuarters();

  useEffect(() => {
    if (quarters.length > 0 && !selectedQuarter) {
      setSelectedQuarter(quarters[0].value);
    }
  }, [quarters]);

  useEffect(() => {
    if (selectedQuarter) {
      fetchTranscript();
    }
  }, [selectedQuarter, ticker]);

  const fetchTranscript = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/transcript/${ticker}/${selectedQuarter}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transcript");
      }

      const data = await response.json();
      setTranscript(data.transcript);
    } catch (error) {
      console.error("Error fetching transcript:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToHighlight = (highlightId: string) => {
    const element = highlightRefs.current[highlightId];
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      element.classList.add(
        "ring-2",
        "ring-primary",
        "ring-offset-2",
        "ring-offset-background",
      );
      setTimeout(() => {
        element.classList.remove(
          "ring-2",
          "ring-primary",
          "ring-offset-2",
          "ring-offset-background",
        );
      }, 2000);
    }
  };

  const getImpactColor = (impact: number) => {
    if (impact >= 4) return "text-primary";
    if (impact >= 3) return "text-yellow-500";
    return "text-muted-foreground";
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/3 w-[500px] h-[500px] bg-primary/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-destructive/4 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '3s' }} />
      </div>
      
      {/* Header */}
      <header className="relative border-b border-border/50 px-6 py-4 glass floating-sm z-10 text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-9 px-3 text-foreground glass-subtle rounded-xl hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-base">
                {ticker} - Earnings Transcript
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={selectedQuarter}
              onValueChange={setSelectedQuarter}
            >
              <SelectTrigger className="w-40 h-9 text-xs glass-subtle border-border/50 rounded-xl">
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem
                    key={q.value}
                    value={q.value}
                    className="text-xs text-muted-foreground"
                  >
                    {q.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Loading transcript...
            </p>
          </div>
        ) : transcript ? (
          <>
            {/* Sidebar with Summary */}
            <div className="relative w-96 overflow-y-auto p-6 space-y-6">
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    AI Summary
                  </h3>
                  <Card className="glass-strong floating-sm p-4 space-y-3 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5"
                      >
                        {transcript.quarter}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {transcript.date}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {transcript.summary.map(
                        (point, index) => (
                          <li
                            key={index}
                            className="text-[11px] leading-relaxed text-foreground/90"
                          >
                            <span className="text-primary mr-1.5">
                              •
                            </span>
                            {point}
                          </li>
                        ),
                      )}
                    </ul>
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm mb-2">
                    Key Highlights
                  </h3>
                  <div className="space-y-2">
                    {transcript.highlights.map(
                      (highlight, index) => (
                        <Card
                          key={highlight.id}
                          className={`bg-card/50 border backdrop-blur-sm p-2.5 cursor-pointer hover:bg-card/70 transition-colors ${
                            highlight.sentiment === "positive"
                              ? "border-green-primary/30"
                              : "border-red-primary/30"
                          }`}
                          onClick={() =>
                            scrollToHighlight(highlight.id)
                          }
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${
                                  highlight.sentiment ===
                                  "positive"
                                    ? "bg-green-primary/10 text-green-primary border-green-primary/30"
                                    : "bg-red-primary/10 text-red-primary border-red-primary/30"
                                }`}
                              >
                                {highlight.sentiment ===
                                "positive" ? (
                                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                                ) : (
                                  <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                                )}
                                {highlight.sentiment}
                              </Badge>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-0.5">
                                    {[...Array(5)].map(
                                      (_, i) => (
                                        <div
                                          key={i}
                                          className={`w-1 h-3 rounded-full ${
                                            i < highlight.impact
                                              ? getImpactColor(
                                                  highlight.impact,
                                                )
                                              : "bg-muted"
                                          }`}
                                        />
                                      ),
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent className="text-[10px]">
                                  Impact: {highlight.impact}/5
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2">
                            {highlight.text}
                          </p>
                        </Card>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Transcript */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                <h2 className="text-lg mb-4">
                  Full Transcript
                </h2>

                {!transcript.sections || transcript.sections.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    <p>No transcript sections available for this quarter.</p>
                  </div>
                ) : (
                  transcript.sections.map(
                  (section, index) => (
                    <div key={index} className="space-y-3">
                      {section.type === "highlight" && section.highlight ? (
                        <>
                          {/* Highlighted Text */}
                          <div
                            ref={(el) =>
                              (highlightRefs.current[section.highlight!.id] = el)
                            }
                            className={`p-4 rounded-lg border-l-4 transition-all ${
                              section.highlight.sentiment === "positive"
                                ? "bg-green-primary/5 border-green-primary"
                                : "bg-red-primary/5 border-red-primary"
                            }`}
                          >
                            <p className="text-sm leading-relaxed text-foreground">
                              {section.highlight.text}
                            </p>
                          </div>

                          {/* AI Analysis */}
                          <Card className="bg-card/50 border-border backdrop-blur-sm">
                            <div className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-0.5 p-1.5 rounded ${
                                    section.highlight.sentiment === "positive"
                                      ? "bg-green-primary/10"
                                      : "bg-red-primary/10"
                                  }`}
                                >
                                  <Info
                                    className={`w-3.5 h-3.5 ${
                                      section.highlight.sentiment === "positive"
                                        ? "text-green-primary"
                                        : "text-red-primary"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 space-y-2">
                                  <div>
                                    <h4 className="text-xs mb-1 text-muted-foreground uppercase tracking-wider">
                                      AI CFA Analysis
                                    </h4>
                                    <p className="text-sm leading-relaxed text-foreground/90">
                                      {section.highlight.aiInsight}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-4 pt-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Sentiment
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] px-2 py-0.5 ${
                                          section.highlight.sentiment === "positive"
                                            ? "bg-green-primary/10 text-green-primary border-green-primary/30"
                                            : "bg-red-primary/10 text-red-primary border-red-primary/30"
                                        }`}
                                      >
                                        {section.highlight.sentiment}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Impact
                                      </span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <div className="flex items-center gap-0.5">
                                              {[...Array(5)].map((_, i) => (
                                                <div
                                                  key={i}
                                                  className={`w-1.5 h-4 rounded-full ${
                                                    i < section.highlight!.impact
                                                      ? section.highlight!.sentiment === "positive"
                                                        ? "bg-green-primary"
                                                        : "bg-red-primary"
                                                      : "bg-muted"
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent className="text-[10px]">
                                            Impact Level: {section.highlight.impact}/5
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                        Explanation
                                      </span>
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                                          </TooltipTrigger>
                                          <TooltipContent className="max-w-xs text-[11px]">
                                            {section.highlight.explanation}
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </>
                      ) : (
                        /* Regular Transcript Text - Collapsible */
                        <CollapsibleTranscriptSection content={section.content} />
                      )}

                      {/* Separator between sections */}
                      {index < (transcript.sections?.length || 0) - 1 && (
                        <div className="my-6 border-t border-border/50" />
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">
              No transcript data available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function generateQuarters() {
  const quarters = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  for (
    let year = currentYear;
    year >= currentYear - 5;
    year--
  ) {
    const maxQuarter =
      year === currentYear ? currentQuarter : 4;
    for (let q = maxQuarter; q >= 1; q--) {
      quarters.push({
        value: `${year}-Q${q}`,
        label: `Q${q} ${year}`,
      });
    }
  }

  return quarters;
}

function CollapsibleTranscriptSection({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-4 text-xs text-muted-foreground hover:bg-muted/50 border border-border/50 rounded-lg"
        >
          <span>{isOpen ? "Hide" : "Show"} transcript section</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
          <p className="text-sm leading-relaxed text-foreground/70">
            {content}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}