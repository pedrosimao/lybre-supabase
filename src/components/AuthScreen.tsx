import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";
import { TrendingUp } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { getSupabaseClient } from "../utils/supabase/client";

interface AuthScreenProps {
  onAuthSuccess: (userId: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase = getSupabaseClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-11f03654/signup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign up");
      }

      // After successful signup, sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (signInData.user) {
        onAuthSuccess(signInData.user.id);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
      console.error("Sign up error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        onAuthSuccess(data.user.id);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
      console.error("Sign in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen w-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md bg-card border-border p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl gradient-green flex items-center justify-center mb-3 glow-green-sm">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl">Stock Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSignUp ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-primary/10 border border-red-primary/20 text-red-primary text-sm">
            {error}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                className="bg-input border-border text-sm h-10"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-input border-border text-sm h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-input border-border text-sm h-10"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-green hover:opacity-90 transition-opacity text-white h-10 text-sm"
          >
            {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </Card>
    </div>
  );
}
