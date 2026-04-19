import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Truck, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const demoAccounts = [
  { role: "dispatcher", email: "sarah@trucklink.com", label: "Dispatcher", color: "border-blue-500/30 hover:border-blue-500/60" },
  { role: "driver", email: "mike@trucklink.com", label: "Driver", color: "border-green-500/30 hover:border-green-500/60" },
  { role: "carrier", email: "james@trucklink.com", label: "Carrier", color: "border-amber-500/30 hover:border-amber-500/60" },
  { role: "shipper", email: "lisa@trucklink.com", label: "Shipper", color: "border-purple-500/30 hover:border-purple-500/60" },
  { role: "admin", email: "admin@trucklink.com", label: "Admin", color: "border-primary/30 hover:border-primary/60" },
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: loginMutate, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data);
          setLocation("/dashboard");
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error || "Invalid email or password";
          toast({ title: "Login failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const fillDemo = (email: string) => {
    setEmail(email);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted/30 flex-col items-center justify-center p-12 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Truck size={48} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4">TruckLink</h1>
          <p className="text-muted-foreground text-xl max-w-sm leading-relaxed">
            The professional platform for modern trucking operations.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { label: "Active Trucks", value: "12,400+" },
              { label: "Daily Loads", value: "4,800+" },
              { label: "US Coverage", value: "50 States" },
              { label: "On-Time Rate", value: "97.8%" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 text-primary mb-8">
            <Truck size={28} />
            <span className="font-bold text-2xl text-white">TruckLink</span>
          </div>

          <h2 className="text-3xl font-black mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your TruckLink account</p>

          {/* Demo accounts */}
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Quick Demo Login</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc.email)}
                  className={`px-3 py-1.5 text-xs border rounded-md bg-muted/30 text-foreground transition-colors ${acc.color}`}
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-muted/30 border-border focus-visible:ring-primary/50"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/30 border-border focus-visible:ring-primary/50 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-5 text-base"
              disabled={isPending}
            >
              {isPending ? <Loader2 size={20} className="animate-spin mr-2" /> : null}
              {isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Register free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
