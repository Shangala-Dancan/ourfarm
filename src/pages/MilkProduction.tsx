import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Milk, TrendingUp, Droplets } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useMilk, type MilkRecord } from "@/contexts/MilkContext";
import { useHerd } from "@/contexts/HerdContext";
import { useToast } from "@/hooks/use-toast";

function RecordDialog({ open, onOpenChange, animals, onSubmit }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  animals: { id: string; tagNumber: string; name: string }[];
  onSubmit: (data: Omit<MilkRecord, "id" | "farmId">) => void;
}) {
  const [form, setForm] = useState({
    animalId: "",
    date: new Date().toISOString().split("T")[0],
    session: "morning" as "morning" | "evening",
    yieldLiters: "",
    butterfatPercent: "",
    temperature: "",
    qualityNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      animalId: form.animalId,
      date: form.date,
      session: form.session,
      yieldLiters: parseFloat(form.yieldLiters) || 0,
      butterfatPercent: parseFloat(form.butterfatPercent) || 0,
      temperature: parseFloat(form.temperature) || 0,
      qualityNotes: form.qualityNotes,
    });
    onOpenChange(false);
    setForm({ animalId: "", date: new Date().toISOString().split("T")[0], session: "morning", yieldLiters: "", butterfatPercent: "", temperature: "", qualityNotes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log Milk Production</DialogTitle>
          <DialogDescription>Record a milking session for an animal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label>Animal *</Label>
            <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
              <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
              <SelectContent>
                {animals.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.tagNumber} {a.name && `— ${a.name}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v as "morning" | "evening" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Yield (L) *</Label>
              <Input type="number" step="0.1" required value={form.yieldLiters} onChange={(e) => setForm({ ...form, yieldLiters: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Butterfat %</Label>
              <Input type="number" step="0.1" value={form.butterfatPercent} onChange={(e) => setForm({ ...form, butterfatPercent: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Temp (°C)</Label>
              <Input type="number" step="0.1" value={form.temperature} onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Quality Notes</Label>
            <Input value={form.qualityNotes} onChange={(e) => setForm({ ...form, qualityNotes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Log Production</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MilkProduction() {
  const { records, addRecord, deleteRecord } = useMilk();
  const { animals } = useHerd();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const femaleAnimals = animals.filter((a) => a.gender === "female" && a.status === "active");
  const animalMap = Object.fromEntries(animals.map((a) => [a.id, a]));

  const todayTotal = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return records.filter((r) => r.date === today).reduce((s, r) => s + r.yieldLiters, 0);
  }, [records]);

  const avgButterfat = useMemo(() => {
    const withBf = records.filter((r) => r.butterfatPercent > 0);
    return withBf.length ? (withBf.reduce((s, r) => s + r.butterfatPercent, 0) / withBf.length).toFixed(1) : "—";
  }, [records]);

  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    records.forEach((r) => { map[r.date] = (map[r.date] || 0) + r.yieldLiters; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30).map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 10) / 10 }));
  }, [records]);

  const perAnimalData = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    records.forEach((r) => {
      if (!map[r.animalId]) map[r.animalId] = { name: animalMap[r.animalId]?.name || animalMap[r.animalId]?.tagNumber || r.animalId.slice(0, 6), total: 0, count: 0 };
      map[r.animalId].total += r.yieldLiters;
      map[r.animalId].count++;
    });
    return Object.values(map).map((v) => ({ name: v.name, avg: Math.round((v.total / v.count) * 10) / 10 })).sort((a, b) => b.avg - a.avg).slice(0, 10);
  }, [records, animalMap]);

  const handleAdd = (data: Omit<MilkRecord, "id" | "farmId">) => {
    addRecord(data);
    toast({ title: "Production logged", description: `${data.yieldLiters}L recorded.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Milk Production</h1>
          <p className="text-sm text-muted-foreground">Track daily yields, quality checks, and production trends</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Log Production</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2"><Milk className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{records.length}</p><p className="text-xs text-muted-foreground">Total Records</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2"><Droplets className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{todayTotal.toFixed(1)}L</p><p className="text-xs text-muted-foreground">Today's Yield</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2"><TrendingUp className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{avgButterfat}%</p><p className="text-xs text-muted-foreground">Avg Butterfat</p></div>
        </CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2"><Milk className="h-5 w-5 text-primary" /></div>
          <div><p className="text-2xl font-bold">{records.reduce((s, r) => s + r.yieldLiters, 0).toFixed(0)}L</p><p className="text-xs text-muted-foreground">Total Production</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="records">
        <TabsList>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="per-animal">Per Animal</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card><CardContent className="p-0">
            {records.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No production records yet. Log your first milking session.</div>
            ) : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Animal</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Yield (L)</TableHead>
                  <TableHead className="hidden md:table-cell">Fat %</TableHead>
                  <TableHead className="hidden md:table-cell">Temp</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {[...records].sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{r.date}</TableCell>
                      <TableCell>{animalMap[r.animalId]?.tagNumber || "—"}</TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize text-xs">{r.session}</Badge></TableCell>
                      <TableCell className="font-medium">{r.yieldLiters}L</TableCell>
                      <TableCell className="hidden md:table-cell">{r.butterfatPercent || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.temperature ? `${r.temperature}°C` : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteRecord(r.id); toast({ title: "Record deleted" }); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card><CardHeader><CardTitle className="text-base">Daily Production (Last 30 Days)</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {dailyData.length === 0 ? <p className="text-sm text-muted-foreground">No data to display.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="hsl(152, 45%, 28%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="per-animal">
          <Card><CardHeader><CardTitle className="text-base">Average Yield per Animal</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              {perAnimalData.length === 0 ? <p className="text-sm text-muted-foreground">No data to display.</p> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perAnimalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="avg" fill="hsl(152, 45%, 28%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <RecordDialog open={dialogOpen} onOpenChange={setDialogOpen} animals={femaleAnimals} onSubmit={handleAdd} />
    </div>
  );
}
