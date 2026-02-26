import { useState, useMemo } from "react";
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
import { usePastures, type Pasture, type PastureCondition, type RotationEntry } from "@/contexts/PastureContext";
import { useToast } from "@/hooks/use-toast";

const conditionColors: Record<string, string> = {
  good: "bg-green-100 text-green-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

function PastureDialog({ open, onOpenChange, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  onSubmit: (data: Omit<Pasture, "id" | "farmId">) => void;
}) {
  const [form, setForm] = useState({ name: "", sizeAcres: "", grassType: "", condition: "good" as PastureCondition, currentHerdCount: "0", isResting: false, notes: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: form.name, sizeAcres: parseFloat(form.sizeAcres) || 0, grassType: form.grassType, condition: form.condition, currentHerdCount: parseInt(form.currentHerdCount) || 0, isResting: form.isResting, notes: form.notes });
    onOpenChange(false);
    setForm({ name: "", sizeAcres: "", grassType: "", condition: "good", currentHerdCount: "0", isResting: false, notes: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Pasture</DialogTitle><DialogDescription>Register a new pasture or paddock.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Size (acres)</Label><Input type="number" step="0.1" value={form.sizeAcres} onChange={(e) => setForm({ ...form, sizeAcres: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Grass Type</Label><Input value={form.grassType} onChange={(e) => setForm({ ...form, grassType: e.target.value })} /></div>
            <div className="space-y-2"><Label>Condition</Label>
              <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as PastureCondition })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="good">Good</SelectItem><SelectItem value="fair">Fair</SelectItem><SelectItem value="poor">Poor</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isResting} onCheckedChange={(v) => setForm({ ...form, isResting: v })} />
            <Label>Currently Resting</Label>
          </div>
          <div className="space-y-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Add Pasture</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RotationDialog({ open, onOpenChange, pastures, onSubmit }: {
  open: boolean; onOpenChange: (o: boolean) => void;
  pastures: Pasture[];
  onSubmit: (data: Omit<RotationEntry, "id" | "farmId">) => void;
}) {
  const [form, setForm] = useState({ pastureId: "", startDate: "", endDate: "", herdGroup: "" });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
    setForm({ pastureId: "", startDate: "", endDate: "", herdGroup: "" });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Add Rotation</DialogTitle><DialogDescription>Schedule a herd rotation to a pasture.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2"><Label>Pasture *</Label>
            <Select value={form.pastureId} onValueChange={(v) => setForm({ ...form, pastureId: v })}>
              <SelectTrigger><SelectValue placeholder="Select pasture" /></SelectTrigger>
              <SelectContent>{pastures.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date *</Label><Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div className="space-y-2"><Label>End Date *</Label><Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="space-y-2"><Label>Herd Group *</Label><Input required value={form.herdGroup} onChange={(e) => setForm({ ...form, herdGroup: e.target.value })} placeholder="e.g. Dairy Herd A" /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Add Rotation</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Pastures() {
  const { pastures, rotations, addPasture, deletePasture, addRotation, deleteRotation } = usePastures();
  const { toast } = useToast();
  const [pastureOpen, setPastureOpen] = useState(false);
  const [rotationOpen, setRotationOpen] = useState(false);

  const stats = useMemo(() => ({
    total: pastures.length,
    totalAcres: pastures.reduce((s, p) => s + p.sizeAcres, 0),
    resting: pastures.filter((p) => p.isResting).length,
    poor: pastures.filter((p) => p.condition === "poor").length,
  }), [pastures]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pasture Management</h1>
          <p className="text-sm text-muted-foreground">Manage pastures, rotation schedules, and utilization</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setRotationOpen(true)}><CalendarDays className="h-4 w-4 mr-1" /> Add Rotation</Button>
          <Button onClick={() => setPastureOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Pasture</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><TreePine className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Pastures</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><MapPin className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.totalAcres.toFixed(1)}</p><p className="text-xs text-muted-foreground">Total Acres</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-primary/10 p-2"><TreePine className="h-5 w-5 text-primary" /></div><div><p className="text-2xl font-bold">{stats.resting}</p><p className="text-xs text-muted-foreground">Resting</p></div></CardContent></Card>
        <Card><CardContent className="pt-4 flex items-center gap-3"><div className="rounded-full bg-destructive/10 p-2"><TreePine className="h-5 w-5 text-destructive" /></div><div><p className="text-2xl font-bold">{stats.poor}</p><p className="text-xs text-muted-foreground">Poor Condition</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Pastures</TabsTrigger><TabsTrigger value="rotations">Rotation Schedule ({rotations.length})</TabsTrigger></TabsList>

        <TabsContent value="overview">
          {pastures.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No pastures registered yet. Add your first pasture.</CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastures.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{p.sizeAcres} acres · {p.grassType || "Unknown grass"}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deletePasture(p.id); toast({ title: "Pasture deleted" }); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    <Badge className={conditionColors[p.condition] + " capitalize"}>{p.condition}</Badge>
                    {p.isResting && <Badge variant="secondary">Resting</Badge>}
                    {p.currentHerdCount > 0 && <Badge variant="outline">{p.currentHerdCount} animals</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rotations">
          <Card><CardContent className="p-0">
            {rotations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No rotations scheduled.</div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Pasture</TableHead><TableHead>Herd Group</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {[...rotations].sort((a, b) => a.startDate.localeCompare(b.startDate)).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{pastures.find((p) => p.id === r.pastureId)?.name || "—"}</TableCell>
                      <TableCell>{r.herdGroup}</TableCell>
                      <TableCell className="text-xs">{r.startDate}</TableCell>
                      <TableCell className="text-xs">{r.endDate}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { deleteRotation(r.id); toast({ title: "Rotation deleted" }); }}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      <PastureDialog open={pastureOpen} onOpenChange={setPastureOpen} onSubmit={(d) => { addPasture(d); toast({ title: "Pasture added" }); }} />
      <RotationDialog open={rotationOpen} onOpenChange={setRotationOpen} pastures={pastures} onSubmit={(d) => { addRotation(d); toast({ title: "Rotation scheduled" }); }} />
    </div>
  );
}
