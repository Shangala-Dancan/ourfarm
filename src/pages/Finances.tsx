"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";

// ---------------- Types ----------------
export type FinanceType = "income" | "expense";
export type FinanceCategory =
  | "feed"
  | "veterinary"
  | "labor"
  | "equipment"
  | "maintenance"
  | "other_expense"
  | "milk_sales"
  | "animal_sales"
  | "other_income";

export interface FinanceRecord {
  id?: string;
  type: FinanceType;
  category: FinanceCategory;
  amount: number;
  date: string;
  description: string;
  notes?: string;
}

// ---------------- Categories ----------------
const expenseCategories: { value: FinanceCategory; label: string }[] = [
  { value: "feed", label: "Feed" },
  { value: "veterinary", label: "Veterinary" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other_expense", label: "Other" },
];

const incomeCategories: { value: FinanceCategory; label: string }[] = [
  { value: "milk_sales", label: "Milk Sales" },
  { value: "animal_sales", label: "Animal Sales" },
  { value: "other_income", label: "Other" },
];

const PIE_COLORS = ["hsl(152,45%,28%)", "hsl(152,45%,40%)", "hsl(152,45%,55%)", "hsl(200,60%,50%)", "hsl(30,80%,55%)", "hsl(0,60%,50%)"];

// ---------------- Finance Dialog ----------------
function FinanceDialog({
  open,
  onOpenChange,
  onAddTransaction,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAddTransaction: (data: FormData) => Promise<void>;
}) {
  const [form, setForm] = useState({
    type: "expense" as FinanceType,
    category: "feed" as FinanceCategory,
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    notes: "",
  });

  const categories = form.type === "expense" ? expenseCategories : incomeCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData from state
    const formData = new FormData();
    formData.append("type", form.type);
    formData.append("category", form.category);
    formData.append("amount", form.amount);
    formData.append("date", form.date);
    formData.append("description", form.description);
    formData.append("notes", form.notes || "");

    // Call API
    await onAddTransaction(formData);

    onOpenChange(false);
    setForm({
      type: "expense",
      category: "feed",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>Record an expense or income entry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => {
                  setForm({
                    ...form,
                    type: v as FinanceType,
                    category: v === "expense" ? "feed" : "milk_sales",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as FinanceCategory })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount ($) *</Label>
              <Input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Main Component ----------------
export default function Finances() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // ---------------- Fetch all records ----------------
  const fetchRecords = async () => {
    try {
      const res = await axios.get("http://dancan.alwaysdata.net/api/get_finance");
      setRecords(res.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch records", variant: "destructive" });
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  // ---------------- Add transaction ----------------
  const addTransaction = async (formData: FormData) => {
    try {
      const res = await axios.post("http://dancan.alwaysdata.net/api/add_finance", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Update state locally
      const newRecord: FinanceRecord = {
        type: formData.get("type") as FinanceType,
        category: formData.get("category") as FinanceCategory,
        amount: parseFloat(formData.get("amount") as string),
        date: formData.get("date") as string,
        description: formData.get("description") as string,
        notes: formData.get("notes") as string,
      };
      setRecords((prev) => [...prev, newRecord]);

      toast({ title: "Transaction added successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to add transaction", variant: "destructive" });
    }
  };

  // ---------------- Delete transaction ----------------
  const deleteTransaction = async (id?: string) => {
    if (!id) return;
    try {
      await axios.delete(`http://dancan.alwaysdata.net/api/finance/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      toast({ title: "Transaction deleted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete transaction", variant: "destructive" });
    }
  };

  // ---------------- Computed Metrics ----------------
  const totalIncome = useMemo(() => records.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0), [records]);
  const totalExpenses = useMemo(() => records.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0), [records]);
  const profit = totalIncome - totalExpenses;

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expense: number }> = {};
    records.forEach((r) => {
      const m = r.date.slice(0, 7);
      if (!map[m]) map[m] = { month: m, income: 0, expense: 0 };
      if (r.type === "income") map[m].income += r.amount;
      else map[m].expense += r.amount;
    });
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month)).slice(-12).map((d) => ({ ...d, month: d.month.slice(2) }));
  }, [records]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    records.filter((r) => r.type === "expense").forEach((r) => { map[r.category] = (map[r.category] || 0) + r.amount; });
    return Object.entries(map).map(([name, value]) => ({ name: name.replace("_", " "), value: Math.round(value) }));
  }, [records]);

  const allCategories = [...expenseCategories, ...incomeCategories];
  const getCatLabel = (v: string) => allCategories.find((c) => c.value === v)?.label || v;

  // ---------------- Render ----------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Management</h1>
          <p className="text-sm text-muted-foreground">Track expenses, income, and generate financial reports</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Transaction</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2"><TrendingUp className="h-5 w-5 text-green-700" /></div>
            <div>
              <p className="text-2xl font-bold">${totalIncome.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Income</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2"><TrendingDown className="h-5 w-5 text-red-700" /></div>
            <div>
              <p className="text-2xl font-bold">${totalExpenses.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className={`rounded-full p-2 ${profit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              <DollarSign className={`h-5 w-5 ${profit >= 0 ? "text-green-700" : "text-red-700"}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">${profit.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Net Profit</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2"><BarChart3 className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{records.length}</p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Transactions</TabsTrigger>
          <TabsTrigger value="charts">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No transactions yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...records].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs">{r.date}</TableCell>
                        <TableCell><Badge variant={r.type === "income" ? "default" : "secondary"} className="capitalize text-xs">{r.type}</Badge></TableCell>
                        <TableCell className="text-xs capitalize">{getCatLabel(r.category)}</TableCell>
                        <TableCell className="text-xs">{r.description}</TableCell>
                        <TableCell className={`text-right font-medium ${r.type === "income" ? "text-green-700" : "text-red-700"}`}>{r.type === "income" ? "+" : "-"}${r.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteTransaction(r.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue vs Expenses</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {monthlyData.length === 0 ? <p className="text-sm text-muted-foreground">No data to display.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="hsl(152,45%,28%)" name="Income" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" fill="hsl(0,60%,50%)" name="Expenses" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {expenseByCategory.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Expenses by Category</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {expenseByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <FinanceDialog open={dialogOpen} onOpenChange={setDialogOpen} onAddTransaction={addTransaction} />
    </div>
  );
}