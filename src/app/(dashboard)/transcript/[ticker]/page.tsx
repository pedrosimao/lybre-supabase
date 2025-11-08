import { getTranscript } from '@/actions/stocks'
import TranscriptDetail from '@/components/client/TranscriptDetail'

type PageProps = {
  params: Promise<{ ticker: string }>
}

export default async function TranscriptPage({ params }: PageProps) {
  const { ticker } = await params
  const defaultQuarter = 'Q3 2024'

  // Fetch initial transcript data on the server
  const initialData = await getTranscript(ticker, defaultQuarter)

  return <TranscriptDetail ticker={ticker} initialData={initialData} />
}
