import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Truck, 
  Package, 
  Map as MapIcon, 
  Route as RouteIcon, 
  User, 
  LogOut, 
  Bell,
  Menu,
  ChevronLeft
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingChatbot } from "./floating-chatbot";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/trucks", label: "Trucks", icon: Truck },
    { href: "/loads", label: "Loads", icon: Package },
    { href: "/map", label: "Live Map", icon: MapIcon },
    { href: "/routes", label: "Routes", icon: RouteIcon },
  ];

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden text-foreground">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 260 : 72,
          transition: { duration: 0.3, ease: "easeInOut" }
        }}
        className={cn(
          "bg-sidebar border-r border-sidebar-border hidden md:flex flex-col relative z-20 flex-shrink-0"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden text-primary">
            <Truck size={24} className="shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-xl tracking-tight text-white whitespace-nowrap"
                >
                  TruckLink
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-5 h-6 w-6 rounded-full bg-sidebar border border-sidebar-border shadow-sm text-muted-foreground hover:text-foreground z-30"
          >
            <ChevronLeft size={14} className={cn("transition-transform duration-300", !isSidebarOpen && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors group relative overflow-hidden",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                    />
                  )}
                  <item.icon size={20} className="shrink-0" />
                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border mt-auto">
          <Link href="/profile">
            <div className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors",
              location === "/profile" 
                ? "bg-sidebar-accent text-sidebar-foreground" 
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}>
              <Avatar className="h-8 w-8 shrink-0 border border-sidebar-border">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                    <p className="text-xs text-sidebar-foreground/50 capitalize truncate">{user.role}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4 md:hidden">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Menu size={20} />
            </Button>
            <div className="flex items-center gap-2 text-primary">
              <Truck size={20} />
              <span className="font-bold text-lg text-white">TruckLink</span>
            </div>
          </div>

          <div className="hidden md:flex items-center">
            <h2 className="text-lg font-semibold capitalize text-foreground/90">
              {location.split("/")[1] || "Dashboard"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
            </Button>
            
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <Badge variant="outline" className="hidden sm:flex capitalize bg-muted/50 border-border text-muted-foreground">
                {user.role}
              </Badge>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-auto max-w-7xl h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <FloatingChatbot />
    </div>
  );
}

// Needed for AnimatePresence in Layout
import { AnimatePresence } from "framer-motion";