import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Loader2, MapPin, Navigation, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister, useUpdateUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const roles = [
  { value: "dispatcher", label: "Dispatcher", desc: "Manage loads & assign drivers" },
  { value: "driver", label: "Driver", desc: "Browse loads & place bids" },
  { value: "carrier", label: "Carrier", desc: "Operate a fleet of trucks" },
  { value: "shipper", label: "Shipper", desc: "Post loads & find carriers" },
];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState("driver");
  const [step, setStep] = useState<"form" | "location">("form");
  const [registeredUser, setRegisteredUser] = useState<{ id: number; token: string } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", company: "", phone: "",
  });

  const { mutate: registerMutate, isPending } = useRegister();
  const { mutate: updateUser } = useUpdateUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutate(
      { data: { ...formData, role: selectedRole as "driver" | "dispatcher" | "carrier" | "shipper" | "admin" } },
      {
        onSuccess: (data) => {
          if (selectedRole === "driver") {
            setRegisteredUser({ id: data.user.id, token: data.token });
            login(data);
            setStep("location");
          } else {
            login(data);
            setLocation("/dashboard");
          }
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error || "Registration failed";
          toast({ title: "Registration failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  const requestLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationStatus("granted");
        if (registeredUser) {
          updateUser(
            {
              id: registeredUser.id,
              data: { currentLat: pos.coords.latitude, currentLng: pos.coords.longitude },
            },
            {
              onSuccess: () => {
                toast({ title: "Location saved!", description: "Your location is now visible on the fleet map." });
                setTimeout(() => setLocation("/dashboard"), 1200);
              },
            }
          );
        }
      },
      () => {
        setLocationStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const skipLocation = () => setLocation("/dashboard");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-2 text-primary mb-8">
          <Truck size={28} />
          <span className="font-bold text-2xl text-white">TruckLink</span>
        </div>

        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-3xl font-black mb-2">Create your account</h2>
              <p className="text-muted-foreground mb-8">Join America's fastest-growing trucking platform</p>

              <div className="mb-6">
                <Label className="text-sm text-muted-foreground uppercase tracking-wider mb-3 block">Select your role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all duration-200",
                        selectedRole === role.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-muted/20 text-muted-foreground hover:border-border/80"
                      )}
                    >
                      <p className="font-semibold text-sm">{role.label}</p>
                      <p className="text-xs mt-0.5 opacity-70">{role.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Smith" className="bg-muted/30" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Smith Logistics LLC" className="bg-muted/30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="you@company.com" className="bg-muted/30" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className="bg-muted/30" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 123-4567" className="bg-muted/30" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white py-5 text-base mt-2" disabled={isPending}>
                  {isPending ? <Loader2 size={20} className="animate-spin mr-2" /> : null}
                  {isPending ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <p className="text-center text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
                {locationStatus === "granted"
                  ? <CheckCircle2 size={36} className="text-green-400" />
                  : <MapPin size={36} className="text-primary" />
                }
              </div>

              <h2 className="text-3xl font-black mb-2">Share your location</h2>
              <p className="text-muted-foreground mb-2">
                Let dispatchers and shippers see where you are on the live fleet map.
              </p>
              <p className="text-muted-foreground text-sm mb-8">
                You'll also see loads posted near your current position so you can bid on the best nearby freight.
              </p>

              {locationStatus === "denied" && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 mb-6 text-sm text-destructive">
                  Location access was denied. You can enable it later in your browser settings.
                </div>
              )}

              {locationStatus === "granted" ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 text-sm text-green-400">
                  <CheckCircle2 size={16} className="inline mr-2" />
                  Location saved — taking you to the dashboard...
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    onClick={requestLocation}
                    disabled={locationStatus === "loading"}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-5 text-base"
                  >
                    {locationStatus === "loading"
                      ? <><Loader2 size={18} className="animate-spin mr-2" />Getting location...</>
                      : <><Navigation size={18} className="mr-2" />Share My Location</>
                    }
                  </Button>
                  <Button variant="ghost" onClick={skipLocation} className="w-full text-muted-foreground hover:text-foreground">
                    Skip for now
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
