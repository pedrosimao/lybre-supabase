import { useParams } from '@solidjs/router'
import { createAsync, cache } from '@solidjs/router'
import { Show } from 'solid-js'
import { getTranscript, getAvailableQuarters } from '~/server/stocks'

const loadTranscriptData = cache(async (ticker: string) => {
  'use server'
  
  const availableQuarters = await getAvailableQuarters(ticker)
  const defaultQuarter = availableQuarters[0] || 'Q3 2024'
  const result = await getTranscript(ticker, defaultQuarter)

  return { result, defaultQuarter, availableQuarters }
}, 'transcript-data')

export const route = {
  preload: ({ params }: { params: { ticker: string } }) => loadTranscriptData(params.ticker),
}

export default function TranscriptPage() {
  const params = useParams<{ ticker: string }>()
  const data = createAsync(() => loadTranscriptData(params.ticker))

  return (
    <Show when={data()} fallback={<div>Loading transcript...</div>}>
      {(d) => (
        <div class="h-screen w-full bg-background p-8">
          <h1 class="text-2xl font-bold mb-4">{params.ticker} Transcript</h1>
          <div class="text-sm text-muted-foreground mb-4">
            Quarter: {d().defaultQuarter}
          </div>
          <Show
            when={d().result.success}
            fallback={<div class="text-red-500">Error: {d().result.error}</div>}
          >
            <div class="space-y-4">
              <p>Available quarters: {d().availableQuarters.length}</p>
              {/* TranscriptDetail component will be added here */}
            </div>
          </Show>
        </div>
      )}
    </Show>
  )
}
