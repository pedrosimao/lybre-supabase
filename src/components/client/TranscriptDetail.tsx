'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Info,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  getTranscript,
  TranscriptData,
  TranscriptHighlight,
  TranscriptSection,
  Result,
} from '@/actions/stocks'

interface TranscriptDetailProps {
  ticker: string
  initialResult: Result<TranscriptData>
  defaultQuarter: string
}

export default function TranscriptDetail({ ticker, initialResult, defaultQuarter }: TranscriptDetailProps) {
  const router = useRouter()
  const [selectedQuarter, setSelectedQuarter] = useState<string>(
    initialResult.success ? initialResult.data.quarter : defaultQuarter
  )
  const [transcript, setTranscript] = useState<TranscriptData | null>(
    initialResult.success ? initialResult.data : null
  )
  const [error, setError] = useState<string | null>(
    initialResult.success ? null : initialResult.error
  )
  const [loading, setLoading] = useState(false)
  const highlightRefs = useRef<{
    [key: string]: HTMLDivElement | null
  }>({})

  // Generate available quarters (last 5 years)
  const quarters = generateQuarters()

  useEffect(() => {
    if (selectedQuarter && selectedQuarter !== transcript?.quarter) {
      fetchTranscript()
    }
  }, [selectedQuarter, ticker])

  const fetchTranscript = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getTranscript(ticker, selectedQuarter)
      if (result.success) {
        setTranscript(result.data)
        setError(null)
      } else {
        setTranscript(null)
        setError(result.error)
      }
    } catch (error) {
      console.error('Error fetching transcript:', error)
      setError('An unexpected error occurred while fetching the transcript.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToHighlight = (highlightId: string) => {
    const element = highlightRefs.current[highlightId]
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background')
      setTimeout(() => {
        element.classList.remove(
          'ring-2',
          'ring-primary',
          'ring-offset-2',
          'ring-offset-background'
        )
      }, 2000)
    }
  }

  const getImpactColor = (impact: number) => {
    if (impact >= 4) return 'text-primary'
    if (impact >= 3) return 'text-yellow-500'
    return 'text-muted-foreground'
  }

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-primary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-destructive/6 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-border/50 px-6 py-4 glass floating-sm z-10 text-muted-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/portfolio')}
              className="h-9 px-3 text-foreground glass-subtle rounded-xl hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-base">{ticker} - Earnings Transcript</h1>
              <p className="text-[10px] text-muted-foreground">{transcript?.ticker || ticker}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
              <SelectTrigger className="w-40 h-9 text-xs glass-subtle border-border/50 rounded-xl">
                <SelectValue placeholder="Select quarter" />
              </SelectTrigger>
              <SelectContent>
                {quarters.map(q => (
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
      <div className="flex-1 overflow-hidden flex min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground text-sm">Loading transcript...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="glass-strong floating-sm border-red-primary/30 rounded-xl max-w-2xl w-full">
              <div className="p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-primary/10 mb-2">
                  <AlertCircle className="w-8 h-8 text-red-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-foreground">Unable to Load Transcript</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {error}
                  </p>
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button
                    onClick={() => fetchTranscript()}
                    variant="outline"
                    size="sm"
                    className="glass-subtle border-border/50 rounded-xl"
                  >
                    Try Again
                  </Button>
                  <Button
                    onClick={() => router.push('/portfolio')}
                    size="sm"
                    className="gradient-green hover:opacity-90 transition-opacity text-white rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to Portfolio
                  </Button>
                </div>
                <div className="pt-4 border-t border-border/30 mt-6">
                  <p className="text-xs text-muted-foreground">
                    If this issue persists, please check your database configuration or contact support.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : transcript ? (
          <>
            {/* Sidebar with Summary */}
            <div className="w-96 overflow-y-auto p-6 space-y-6 text-foreground flex-shrink-0">
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Transcript Info
                  </h3>
                  <Card className="glass-strong floating-sm p-4 space-y-3 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                        {transcript.quarter}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{transcript.date}</span>
                    </div>
                    <div className="text-[11px] leading-relaxed text-foreground/90">
                      <p>
                        <span className="text-primary mr-1.5">•</span>
                        {transcript.highlights.length} key highlights identified
                      </p>
                      <p>
                        <span className="text-primary mr-1.5">•</span>
                        {transcript.sections.length} transcript sections
                      </p>
                    </div>
                  </Card>
                </div>

                <div>
                  <h3 className="text-sm mb-2">Key Highlights</h3>
                  <div className="space-y-2">
                    {transcript.highlights.map(highlight => (
                      <Card
                        key={highlight.id}
                        className={`glass-subtle floating-sm p-2.5 cursor-pointer hover:bg-white/10 transition-colors rounded-xl ${
                          highlight.sentiment === 'positive'
                            ? 'border-green-primary/30'
                            : 'border-red-primary/30'
                        }`}
                        onClick={() => scrollToHighlight(highlight.id)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 ${
                                highlight.sentiment === 'positive'
                                  ? 'bg-green-primary/10 text-green-primary border-green-primary/30'
                                  : 'bg-red-primary/10 text-red-primary border-red-primary/30'
                              }`}
                            >
                              {highlight.sentiment === 'positive' ? (
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
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className={`w-1 h-3 rounded-full ${
                                        i < highlight.impact
                                          ? getImpactColor(highlight.impact)
                                          : 'bg-muted'
                                      }`}
                                    />
                                  ))}
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
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Transcript */}
            <div className="flex-1 overflow-y-auto p-6 text-foreground">
              <div className="max-w-4xl mx-auto space-y-4">
                <h2 className="text-lg mb-4 ">Full Transcript</h2>

                {!transcript.sections || transcript.sections.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    <p>No transcript sections available for this quarter.</p>
                  </div>
                ) : (
                  transcript.sections.map((section, index) => (
                    <div key={index} className="space-y-3">
                      {section.type === 'highlight' && section.highlight ? (
                        <>
                          {/* Highlighted Text */}
                          <div
                            ref={el => {
                              highlightRefs.current[section.highlight!.id] = el
                            }}
                            className={`p-4 rounded-lg border-l-4 transition-all ${
                              section.highlight.sentiment === 'positive'
                                ? 'bg-green-primary/5 border-green-primary'
                                : 'bg-red-primary/5 border-red-primary'
                            }`}
                          >
                            <p className="text-sm leading-relaxed text-foreground">
                              {section.highlight.text}
                            </p>
                          </div>

                          {/* AI Analysis */}
                          <Card className="glass-subtle floating-sm border-border rounded-xl">
                            <div className="p-4 space-y-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`mt-0.5 p-1.5 rounded ${
                                    section.highlight.sentiment === 'positive'
                                      ? 'bg-green-primary/3'
                                      : 'bg-red-primary/3'
                                  }`}
                                >
                                  <Info
                                    className={`w-3.5 h-3.5 ${
                                      section.highlight.sentiment === 'positive'
                                        ? 'text-green-primary/50'
                                        : 'text-red-primary/50'
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
                                          section.highlight.sentiment === 'positive'
                                            ? 'bg-green-primary/3 text-green-primary/50 border-green-primary/15'
                                            : 'bg-red-primary/3 text-red-primary/50 border-red-primary/15'
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
                                                      ? section.highlight!.sentiment === 'positive'
                                                        ? 'bg-green-primary/40'
                                                        : 'bg-red-primary/40'
                                                      : 'bg-muted'
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
                        <div className="my-6 border-t border-white/5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Card className="glass-strong floating-sm rounded-xl max-w-md">
              <div className="p-8 text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/10 mb-2">
                  <Info className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-medium text-foreground">No Transcript Selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Please select a quarter from the dropdown above to view the transcript.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

function generateQuarters() {
  const quarters = []
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  const currentQuarter = Math.floor(currentMonth / 3) + 1

  for (let year = currentYear; year >= currentYear - 5; year--) {
    const maxQuarter = year === currentYear ? currentQuarter : 4
    for (let q = maxQuarter; q >= 1; q--) {
      quarters.push({
        value: `Q${q} ${year}`,  // Fixed: Use same format as label
        label: `Q${q} ${year}`,
      })
    }
  }

  return quarters
}

function CollapsibleTranscriptSection({ content }: { content: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto py-2 px-4 text-xs text-muted-foreground hover:bg-white/5 rounded-lg border-0"
        >
          <span>{isOpen ? 'Hide' : 'Show'} transcript section</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3">
        <div className="p-4 glass-subtle rounded-lg">
          <p className="text-sm leading-relaxed text-foreground/70">{content}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
