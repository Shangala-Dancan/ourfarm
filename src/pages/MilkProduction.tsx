import { useState, useEffect } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* =========================
   TYPES
========================= */
type MilkRecord = {
  id: string;
  animalId: string;
  date: string;
  session: "morning" | "evening";
  yieldLiters: number;
};

/* =========================
   RECORD DIALOG
========================= */
function RecordDialog({ open, onOpenChange, refresh }: any) {
  const [animals, setAnimals] = useState<any[]>([]);
  const [animalId, setAnimalId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [yieldLiters, setYieldLiters] = useState("");
  const [session, setSession] = useState<"morning" | "evening">("morning");
  const { toast } = useToast();

  // Fetch animals
  const fetchAnimals = async () => {
    const res = await axios.get("https://dancan.alwaysdata.net/api/get_animal");
    const normalized = res.data.map((a: any) => ({
      ...a,
      id: String(a.id),
      tagNumber: a.tag,
    }));
    setAnimals(normalized);
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!animalId || !yieldLiters) {
      toast({ title: "Please select an animal and enter the yield." });
      return;
    }

    const formData = new FormData();
    formData.append("animalId", animalId);
    formData.append("date", date);
    formData.append("session", session);
    formData.append("yieldLiters", yieldLiters);

    try {
      await axios.post("https://dancan.alwaysdata.net/api/add_milk", formData);
      toast({ title: "Milk record added", description: `${yieldLiters} L for selected animal.` });
      refresh();
      onOpenChange(false);
      // Reset form
      setAnimalId("");
      setYieldLiters("");
      setSession("morning");
      setDate(new Date().toISOString().split("T")[0]);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to add milk record" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Milk Production</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Animal select */}
          <Select value={animalId} onValueChange={setAnimalId}>
            <SelectTrigger>
              <SelectValue placeholder="Select animal" />
            </SelectTrigger>
            <SelectContent>
              {animals.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.tagNumber} — {a.name || "Unnamed"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date input */}
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* Session select */}
          <Select value={session} onValueChange={setSession}>
            <SelectTrigger>
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning">Morning</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
            </SelectContent>
          </Select>

          {/* Yield input */}
          <Input
            type="number"
            placeholder="Yield (Liters)"
            step="0.1"
            min="0"
            value={yieldLiters}
            onChange={(e) => setYieldLiters(e.target.value)}
          />

          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function MilkProduction() {
  const [milk, setMilk] = useState<MilkRecord[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch milk records
  const fetchMilk = async () => {
    const res = await axios.get("https://dancan.alwaysdata.net/api/get_milk");
    const normalized = res.data.map((m: any) => ({
      ...m,
      id: String(m.id),
      animalId: String(m.animalId),
      yieldLiters: Number(m.yieldLiters || 0),
    }));
    setMilk(normalized);
  };

  // Fetch animals
  const fetchAnimals = async () => {
    const res = await axios.get("https://dancan.alwaysdata.net/api/get_animal");
    const normalized = res.data.map((a: any) => ({
      ...a,
      id: String(a.id),
      tagNumber: a.tag,
    }));
    setAnimals(normalized);
  };

  useEffect(() => {
    fetchMilk();
    fetchAnimals();
  }, []);

  // Delete record
  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`https://dancan.alwaysdata.net/api/delete_milk/${id}`);
      setMilk((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Record deleted" });
    } catch (err) {
      console.error(err);
      toast({ title: "Delete failed" });
    }
  };

  // Map animalId -> animal
  const animalMap = Object.fromEntries(animals.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-1 h-4 w-4" /> Add Record
      </Button>

      {/* Milk Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Animal</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Yield (L)</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>

        <TableBody>
          {milk.map((r) => {
            const animal = animalMap[r.animalId];
            return (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {animal ? `${animal.tagNumber} — ${animal.name || "Unnamed"}` : "Unknown Animal"}
                </TableCell>
                <TableCell>{r.session.charAt(0).toUpperCase() + r.session.slice(1)}</TableCell>
                <TableCell>{r.yieldLiters.toFixed(1)} L</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(r.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        refresh={fetchMilk}
      />
    </div>
  );
}