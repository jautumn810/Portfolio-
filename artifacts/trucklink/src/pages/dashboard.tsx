import { motion } from "framer-motion";
import { Truck, Package, Users, DollarSign, TrendingUp, Clock, ArrowUpRight, Activity } from "lucide-react";
import { useGetDashboardAnalytics, useGetLoadsAnalytics, useGetRevenueAnalytics, useListLoads } from "@workspace/api-client-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  posted: "#64748b",
  bidding: "#f59e0b",
  assigned: "#3b82f6",
  in_transit: "#06b6d4",
  delivered: "#22c55e",
  cancelled: "#ef4444",
};

const CHART_COLORS = ["#dc2626", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];

function StatCard({ title, value, icon: Icon, color, change }: {
  title: string; value: string | number; icon: React.ElementType; color: string; change?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/20 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        {change && (
          <div className="flex items-center gap-1 text-green-400 text-xs font-medium">
            <ArrowUpRight size={14} />
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{title}</p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useGetDashboardAnalytics();
  const { data: loadsAnalytics } = useGetLoadsAnalytics();
  const { data: revenueAnalytics } = useGetRevenueAnalytics();
  const { data: loads } = useListLoads();

  const recentLoads = loads?.slice(0, 5) ?? [];

  const pieData = [
    { name: "In Transit", value: analytics?.activeLoads ?? 12 },
    { name: "Posted", value: analytics?.pendingBids ?? 8 },
    { name: "Delivered", value: analytics?.completedLoads ?? 24 },
    { name: "Available Trucks", value: analytics?.availableTrucks ?? 6 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-black">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},{" "}
          <span className="text-primary">{user?.name?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your fleet today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : (
          <>
            <StatCard title="Total Loads" value={analytics?.totalLoads ?? 0} icon={Package} color="bg-primary" change="+12%" />
            <StatCard title="Active Fleet" value={`${analytics?.availableTrucks ?? 0} / ${analytics?.totalTrucks ?? 0}`} icon={Truck} color="bg-blue-600" change="+3" />
            <StatCard title="Total Revenue" value={`$${((analytics?.totalRevenue ?? 0) / 1000).toFixed(0)}K`} icon={DollarSign} color="bg-green-600" change="+8.2%" />
            <StatCard title="On-Time Rate" value={`${analytics?.onTimeDeliveryRate ?? 94.2}%`} icon={TrendingUp} color="bg-amber-600" />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Revenue Trend</h3>
            <Badge variant="outline" className="text-xs">2026</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueAnalytics ?? []}>
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 17%)", borderRadius: "8px", color: "#e2e8f0" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
              <Line type="monotone" dataKey="revenue" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Load status pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-bold mb-4">Load Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 17%)", borderRadius: "8px", color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loads analytics bar chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-bold mb-4">Load Activity</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={loadsAnalytics ?? []}>
            <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 15%, 17%)", borderRadius: "8px", color: "#e2e8f0" }} />
            <Bar dataKey="posted" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Posted" />
            <Bar dataKey="delivered" fill="#22c55e" radius={[2, 2, 0, 0]} name="Delivered" />
            <Bar dataKey="cancelled" fill="#ef4444" radius={[2, 2, 0, 0]} name="Cancelled" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent loads */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold">Recent Loads</h3>
          <Activity size={16} className="text-muted-foreground" />
        </div>
        <div className="divide-y divide-border">
          {recentLoads.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No loads yet</div>
          ) : (
            recentLoads.map((load) => (
              <div key={load.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{load.title}</p>
                    <p className="text-xs text-muted-foreground">{load.originCity}, {load.originState} → {load.destCity}, {load.destState}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary">${load.budget.toLocaleString()}</span>
                  <Badge
                    variant="outline"
                    className="capitalize text-xs"
                    style={{ borderColor: STATUS_COLORS[load.status] + "60", color: STATUS_COLORS[load.status] }}
                  >
                    {load.status.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    <Clock size={12} className="inline mr-1" />
                    {format(new Date(load.pickupDate), "MMM d")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
