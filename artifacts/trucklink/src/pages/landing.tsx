import { Link } from "wouter";
import { motion } from "framer-motion";
import { Truck, Package, Map, BarChart3, Shield, Zap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Active Trucks", value: "12,400+" },
  { label: "Loads Delivered", value: "98,200+" },
  { label: "US States Covered", value: "50" },
  { label: "On-Time Rate", value: "97.8%" },
];

const features = [
  {
    icon: Package,
    title: "Smart Load Board",
    description: "Real-time load matching with intelligent bidding. Find the best freight for your truck in seconds.",
  },
  {
    icon: Map,
    title: "Live Fleet Tracking",
    description: "GPS telematics with live map view, driver status, and route progress — all in one dashboard.",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description: "Track earnings, load history, and performance metrics with detailed charts and reports.",
  },
  {
    icon: Zap,
    title: "Route Optimizer",
    description: "AI-powered route planning with fuel cost estimates, toll calculations, and rest stop planning.",
  },
  {
    icon: Shield,
    title: "Verified Carriers",
    description: "Every carrier and driver is verified with DOT compliance checks and ratings system.",
  },
  {
    icon: Truck,
    title: "Fleet Management",
    description: "Manage your entire fleet — truck specs, maintenance schedules, driver assignments, and more.",
  },
];

const roles = [
  { role: "dispatcher", label: "Dispatcher", desc: "Manage loads, assign drivers, track fleet", color: "text-blue-400" },
  { role: "driver", label: "Driver", desc: "Browse loads, place bids, navigate routes", color: "text-green-400" },
  { role: "carrier", label: "Carrier", desc: "Oversee fleet operations and analytics", color: "text-amber-400" },
  { role: "shipper", label: "Shipper", desc: "Post loads, review bids, track deliveries", color: "text-purple-400" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Truck size={28} />
            <span className="font-bold text-2xl text-white">TruckLink</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary text-white hover:bg-primary/90 red-glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Red glow orbs */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm">
              The #1 Trucking Platform of 2026
            </Badge>

            <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
              Move America's
              <br />
              <span className="text-primary">Freight Smarter</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              TruckLink connects shippers, carriers, and drivers on one powerful platform.
              Real-time load board, GPS tracking, AI-powered route optimization, and instant bidding.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg red-glow group">
                  Start For Free
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-border/60 text-foreground hover:bg-muted/50 px-8 py-6 text-lg">
                  View Demo
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              {["No credit card required", "Free 14-day trial", "Cancel anytime"].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Truck image / dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="bg-card border border-border rounded-2xl p-1 shadow-2xl overflow-hidden">
              <div className="bg-muted/30 rounded-xl p-6 h-64 flex items-center justify-center relative">
                {/* Mock dashboard preview */}
                <div className="grid grid-cols-4 gap-3 w-full max-w-2xl">
                  {[
                    { label: "Active Loads", value: "48", color: "text-primary" },
                    { label: "Fleet Online", value: "23", color: "text-green-400" },
                    { label: "Revenue MTD", value: "$284K", color: "text-blue-400" },
                    { label: "Bids Today", value: "156", color: "text-amber-400" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-lg p-3 text-center">
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-border/50 bg-muted/20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl font-black text-primary">{stat.value}</p>
                <p className="text-muted-foreground mt-2 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4">Everything You Need to Run a Modern Fleet</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From load board to delivery confirmation — TruckLink covers the entire freight lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon size={24} className="text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 bg-muted/10 border-y border-border/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">Built for Every Role in Trucking</h2>
            <p className="text-muted-foreground text-lg">One platform, four perspectives.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map((r, i) => (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/30 transition-colors"
              >
                <div className={`text-4xl font-black mb-2 ${r.color}`}>{r.label[0]}</div>
                <h3 className={`font-bold text-lg mb-2 ${r.color}`}>{r.label}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{r.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Haul More, <span className="text-primary">Earn More?</span>
          </h2>
          <p className="text-muted-foreground text-xl mb-8">
            Join thousands of trucking professionals on TruckLink today.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-6 text-xl red-glow">
              Get Started Free
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Truck size={22} />
            <span className="font-bold text-xl text-white">TruckLink</span>
          </div>
          <p className="text-muted-foreground text-sm">2026 TruckLink Inc. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
