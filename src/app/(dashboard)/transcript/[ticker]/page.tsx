import { getTranscript, getAvailableQuarters } from '@/actions/stocks'
import TranscriptDetail from '@/components/client/TranscriptDetail'

type PageProps = {
  params: Promise<{ ticker: string }>
}

export default async function TranscriptPage({ params }: PageProps) {
  const { ticker } = await params

  // Fetch available quarters from database
  const availableQuarters = await getAvailableQuarters(ticker)

  // Use the first (most recent) quarter as default, or fallback to Q3 2024
  const defaultQuarter = availableQuarters.length > 0 ? availableQuarters[0] : 'Q3 2024'

  console.log('[TranscriptPage] Available quarters:', availableQuarters)
  console.log('[TranscriptPage] Default quarter:', defaultQuarter)

  // Fetch initial transcript data on the server
  const result = await getTranscript(ticker, defaultQuarter)

  return (
    <div className="h-screen w-full bg-background">
      <TranscriptDetail
        ticker={ticker}
        initialResult={result}
        defaultQuarter={defaultQuarter}
        availableQuarters={availableQuarters}
      />
    </div>
  )
}
