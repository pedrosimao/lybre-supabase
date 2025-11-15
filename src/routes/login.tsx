import { createSignal } from 'solid-js'
import { useAction } from '@solidjs/router'
import { signIn } from '~/server/auth'

export default function LoginPage() {
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal('')
  
  const signInAction = useAction(signIn)

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const result = await signInAction(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <div class="w-full max-w-md p-8">
        <h1 class="text-2xl font-bold mb-6">Sign In</h1>
        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              class="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          {error() && (
            <div class="text-red-500 text-sm">{error()}</div>
          )}
          <button
            type="submit"
            class="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
