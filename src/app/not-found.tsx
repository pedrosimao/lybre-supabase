import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="dark h-screen w-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl text-foreground">Page Not Found</h2>
        <p className="text-muted-foreground">Could not find the requested page.</p>
        <Button asChild>
          <Link href="/portfolio">Return to Portfolio</Link>
        </Button>
      </div>
    </div>
  )
}

