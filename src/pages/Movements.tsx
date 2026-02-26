import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ArrowRightLeft, LogIn, LogOut, AlertTriangle } from "lucide-react";
import { useMovements, type MovementRecord, type MovementType } from "@/contexts/MovementContext";
import { useHerd } from "@/contexts/HerdContext";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<string, React.ReactNode> = {
  entry: <LogIn className="h-4 w-4 text-green-600" />,
  exit: <LogOut className="h-4 w-4 text-red-600" />,
  transfer: <ArrowRightLeft className="h-4 w-4 text-blue-600" />,
};

function MovementDialog({ open, onOpenChange, animals, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  animals: { id: string; tagNumber: string; name: string }[];
  onSubmit: (data: Omit<MovementRecord, "id" | "farmId">) => void;
}) {
  const [form, setForm] = useState({ animalId: "", type: "entry" as MovementType, date: new Date().toISOString().split("T")[0], reason: "", destination: "", source: "", notes: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
    setForm({ animalId: "", type: "entry", date: new Date().toISOString().split("T")[0], reason: "", destination: "", source: "", notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Log Movement</DialogTitle><DialogDescription>Record an animal entry, exit, or transfer.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2"><Label>Animal *</Label>
            <Select value={form.animalId} onValueChange={(v) => setForm({ ...form, animalId: v })}>
              <SelectTrigger><SelectValue placeholder="Select animal" /></SelectTrigger>
              <SelectContent>{animals.map((a) => <SelectItem key={a.id} value={a.id}>{a.tagNumber} {a.name && `— ${a.name}`}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MovementType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="entry">Entry</SelectItem><SelectItem value="exit">Exit</SelectItem><SelectItem value="transfer">Transfer</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Date *</Label><Input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Reason</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Purchase, sale, pasture rotation" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Source</Label><Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
            <div className="space-y-2"><Label>Destination</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Log Movement</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Movements() {
  const { movements, addMovement, deleteMovement } = useMovements();
  const { animals } = useHerd();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const animalMap = Object.fromEntries(animals.map((a) => [a.id, a]));

  const stats = useMemo(() => ({
    total: movements.length,
    entries: movements.filter((m) => m.type === "entry").length,
    exits: movements.filter((m) => m.type === "exit").length,
    thisMonth: movements.filter((m) => m.date.startsWith(new Date().toISOString().slice(0, 7))).length,
  }), [movements]);

  const alerts = useMemo(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const recentAnimalIds = new Set(movements.filter((m) => m.date >= thirtyDaysAgo).map((m) => m.animalId));
    return animals.filter((a) => a.status === "active" && movements.some((m) => m.animalId === a.id) && !recentAnimalIds.has(a.id));
  }, [animals, movements]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Movement Monitoring</h1>
          <p className="text-sm text-muted-foreground">Track animal movements, entries, exits, and alerts</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Log Movement</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><ArrowRightLeft className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Movements</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-green-100 p-2"><LogIn className="h-5 w-5 text-green-700" /></div><div><p className="text-2xl font-bold">{stats.entries}</p><p className="text-xs text-muted-foreground">Entries</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-red-100 p-2"><LogOut className="h-5 w-5 text-red-700" /></div><div><p className="text-2xl font-bold">{stats.exits}</p><p className="text-xs text-muted-foreground">Exits</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><ArrowRightLeft className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.thisMonth}</p><p className="text-xs text-muted-foreground">This Month</p></div></CardContent></Card>
      </div>

      {alerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-destructive" /><span className="text-sm font-medium">Alerts</span></div>
            <ul className="text-sm text-muted-foreground space-y-1">
              {alerts.map((a) => <li key={a.id}>• {a.tagNumber} ({a.name || "unnamed"}) — no movement logged in 30+ days</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card><CardContent className="p-0">
        {movements.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No movements recorded yet.</div>
        ) : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Type</TableHead><TableHead>Date</TableHead><TableHead>Animal</TableHead><TableHead>Reason</TableHead><TableHead className="hidden md:table-cell">Source/Dest</TableHead><TableHead className="w-10"></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {[...movements].sort((a, b) => b.date.localeCompare(a.date)).map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{typeIcons[m.type]}</TableCell>
                  <TableCell className="text-xs">{m.date}</TableCell>
                  <TableCell>{animalMap[m.animalId]?.tagNumber || "—"}</TableCell>
                  <TableCell className="text-xs">{m.reason || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{m.type === "exit" ? m.destination : m.source || "—"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteMovement(m.id); toast({ title: "Movement deleted" }); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <MovementDialog open={dialogOpen} onOpenChange={setDialogOpen} animals={animals} onSubmit={(d) => { addMovement(d); toast({ title: "Movement logged" }); }} />
    </div>
  );
}
