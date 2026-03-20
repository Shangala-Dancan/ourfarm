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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, TreePine, MapPin, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const conditionColors: Record<string, string> = {
  good: "bg-green-100 text-green-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

// ---------------- Pasture Dialog ----------------
function PastureDialog({ open, onOpenChange, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onSubmit: (formData: FormData) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    sizeAcres: "",
    grassType: "",
    condition: "good",
    currentHerdCount: "0",
    isResting: false,
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("size_acres", form.sizeAcres);
    formData.append("grass_type", form.grassType);
    formData.append("condition", form.condition);
    formData.append("current_herd_count", form.currentHerdCount);
    formData.append("is_resting", form.isResting ? "1" : "0");
    formData.append("notes", form.notes);

    await onSubmit(formData);

    onOpenChange(false);
    setForm({ name: "", sizeAcres: "", grassType: "", condition: "good", currentHerdCount: "0", isResting: false, notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Pasture</DialogTitle>
          <DialogDescription>Register a new pasture or paddock.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Size (acres)</Label><Input type="number" step="0.1" value={form.sizeAcres} onChange={(e) => setForm({ ...form, sizeAcres: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Grass Type</Label><Input value={form.grassType} onChange={(e) => setForm({ ...form, grassType: e.target.value })} /></div>
            <div className="space-y-2"><Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isResting} onCheckedChange={(v) => setForm({ ...form, isResting: v })} />
            <Label>Currently Resting</Label>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Pasture</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Main Component ----------------
export default function Pastures() {
  const [pastures, setPastures] = useState<any[]>([]);
  const [pastureOpen, setPastureOpen] = useState(false);
  const { toast } = useToast();

  // ---------------- Fetch pastures from API ----------------
  const fetchPastures = async () => {
    try {
      const res = await axios.get("http://dancan.alwaysdata.net/api/get_pasture");
      setPastures(res.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to fetch pastures", variant: "destructive" });
    }
  };

  useEffect(() => { fetchPastures(); }, []);

  // ---------------- Add pasture via API ----------------
  const addPasture = async (formData: FormData) => {
    try {
      const res = await axios.post("http://dancan.alwaysdata.net/api/add_pasture", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setPastures((prev) => [...prev, res.data]); // assuming API returns created pasture with id
      toast({ title: "Pasture added" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to add pasture", variant: "destructive" });
    }
  };

  const deletePasture = async (id: string) => {
    try {
      await axios.delete(`http://dancan.alwaysdata.net/api/delete_pasture/${id}`);
      setPastures((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Pasture deleted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to delete pasture", variant: "destructive" });
    }
  };

  const stats = useMemo(() => ({
    total: pastures.length,
    totalAcres: pastures.reduce((s, p) => s + (parseFloat(p.size) || 0), 0),
    resting: pastures.filter((p) => p.status).length,
    poor: pastures.filter((p) => p.pcondition === "poor").length,
  }), [pastures]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pasture Management</h1>
          <p className="text-sm text-muted-foreground">Manage pastures, rotation schedules, and utilization</p>
        </div>
        <Button onClick={() => setPastureOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Pasture</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><TreePine className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Pastures</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><MapPin className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.totalAcres.toFixed(1)}</p><p className="text-xs text-muted-foreground">Total Acres</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><TreePine className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.resting}</p><p className="text-xs text-muted-foreground">Resting</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-destructive/10 p-2"><TreePine className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.poor}</p><p className="text-xs text-muted-foreground">Poor Condition</p></div></CardContent></Card>
      </div>

      {pastures.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No pastures registered yet. Add your first pasture.</CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pastures.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{p.size} acres · {p.grass_type || "Unknown grass"}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deletePasture(p.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Badge className={conditionColors[p.pcondition] + " capitalize"}>{p.condition}</Badge>
                {p.is_resting && <Badge variant="secondary">Resting</Badge>}
                {p.current_herd_count > 0 && <Badge variant="outline">{p.current_herd_count} animals</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PastureDialog open={pastureOpen} onOpenChange={setPastureOpen} onSubmit={addPasture} />
    </div>
  );
}