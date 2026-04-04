import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="mb-6">
            <span className="font-heading font-extrabold text-3xl tracking-[-0.04em] text-foreground">Ledge</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your 14-day free trial — no card required
          </p>
        </div>

        {/* Form */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Company name</Label>
              <Input id="company" placeholder="Acme FMCG Pvt. Ltd." className="h-12 rounded-lg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Your name</Label>
              <Input id="name" placeholder="Rajesh Kumar" className="h-12 rounded-lg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Work email</Label>
              <Input id="email" type="email" placeholder="rajesh@acmefmcg.in" className="h-12 rounded-lg" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  className="h-12 rounded-lg pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Link to="/dashboard">
              <Button className="w-full" size="default">
                <Sparkles className="h-4 w-4" />
                Start free trial
              </Button>
            </Link>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
