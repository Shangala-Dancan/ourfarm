"use client";

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useHerd } from "@/contexts/HerdContext";
import { useMilk } from "@/contexts/MilkContext";
import { useMovements } from "@/contexts/MovementContext";
import { useFinances } from "@/contexts/FinanceContext";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Bug as CowIcon,
  Milk,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentFarm } = useAuth();

  const { animals, healthRecords, breedingEvents } = useHerd();
  const { records: milkRecords } = useMilk();
  const { movements } = useMovements();
  const { records: financeRecords } = useFinances();

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // -------------------- STATS --------------------
  const todayMilk = useMemo(
    () =>
      milkRecords
        .filter((r) => r.date === today)
        .reduce((sum, r) => sum + (r.yieldLiters ?? 0), 0),
    [milkRecords, today]
  );

  const monthlyRevenue = useMemo(
    () =>
      financeRecords
        .filter((r) => r.type === "income" && r.date.startsWith(thisMonth))
        .reduce((sum, r) => sum + (r.amount ?? 0), 0),
    [financeRecords, thisMonth]
  );

  const monthlyExpenses = useMemo(
    () =>
      financeRecords
        .filter((r) => r.type === "expense" && r.date.startsWith(thisMonth))
        .reduce((sum, r) => sum + (r.amount ?? 0), 0),
    [financeRecords, thisMonth]
  );

  const pendingCalving = useMemo(
    () => breedingEvents.filter((b) => b.outcome === "pending").length,
    [breedingEvents]
  );

  const recentMovements = useMemo(
    () =>
      movements.filter(
        (m) =>
          m.date >=
          new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]
      ).length,
    [movements]
  );

  // -------------------- TRENDS --------------------
  const milkTrend = useMemo(() => {
    const map: Record<string, number> = {};
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split("T")[0];
    milkRecords
      .filter((r) => r.date >= cutoff)
      .forEach((r) => (map[r.date] = (map[r.date] || 0) + (r.yieldLiters ?? 0)));
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 10) / 10 }));
  }, [milkRecords]);

  const financeTrend = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    financeRecords.forEach((r) => {
      const m = r.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      if (r.type === "income") map[m].income += r.amount ?? 0;
      else map[m].expense += r.amount ?? 0;
    });
    return Object.values(map)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((d) => ({ ...d, month: d.month.slice(2) }));
  }, [financeRecords]);

  // -------------------- RECENT ACTIVITY --------------------
  const recentActivity = useMemo(() => {
    const items: { date: string; text: string }[] = [];

    milkRecords.slice(-3).forEach((r) =>
      items.push({ date: r.date, text: `Milk logged: ${r.yieldLiters}L` })
    );
    movements.slice(-3).forEach((m) =>
      items.push({ date: m.date, text: `Movement: ${m.type} — ${m.reason || "No reason"}` })
    );
    financeRecords.slice(-3).forEach((f) =>
      items.push({ date: f.date, text: `${f.type}: Kshs ${f.amount?.toFixed(2)} — ${f.description || ""}` })
    );
    healthRecords.slice(-3).forEach((h) =>
      items.push({ date: h.date, text: `Health: ${h.type.replace("_", " ")} — ${h.description || ""}` })
    );

    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  }, [milkRecords, movements, financeRecords, healthRecords]);

  // -------------------- STATS CARDS --------------------
  const stats = [
    {
      label: "Total Herd",
      value: animals.length.toString(),
      icon: CowIcon,
      sub: `${animals.filter((a) => a.status === "active").length} active`,
    },
    {
      label: "Today's Milk",
      value: `${todayMilk.toFixed(1)}L`,
      icon: Milk,
      sub: `${milkRecords.length} total records`,
    },
    {
      label: "Pending Calving",
      value: pendingCalving.toString(),
      icon: AlertTriangle,
      sub: `${recentMovements} movements this week`,
    },
    {
      label: "Monthly Revenue",
      value: `Kshs ${monthlyRevenue.toFixed(0)}`,
      icon: DollarSign,
      sub: `Kshs ${monthlyExpenses.toFixed(0)} expenses`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h2>Welcome</h2>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of {currentFarm?.name || "your farm"}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Milk Production (14 Days)</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/milk")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="h-[220px]">
            {milkTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No production data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={milkTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke="hsl(152,45%,28%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Financial Overview</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/finances")}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="h-[220px]">
            {financeTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground">No financial data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="hsl(152,45%,28%)" name="Income" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(0,60%,50%)" name="Expenses" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Start by adding animals to your herd.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-xs text-muted-foreground min-w-[70px]">{item.date}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/herd")}>
              <Plus className="h-4 w-4 mr-1" /> Add Animal
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/milk")}>
              <Plus className="h-4 w-4 mr-1" /> Log Milk
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/movements")}>
              <Plus className="h-4 w-4 mr-1" /> Log Movement
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/finances")}>
              <Plus className="h-4 w-4 mr-1" /> Add Transaction
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}