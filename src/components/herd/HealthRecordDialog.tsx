import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { HealthRecord } from "@/contexts/HerdContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string;
  onSubmit: (data: Omit<HealthRecord, "id" | "farmId">) => void;
}

export function HealthRecordDialog({ open, onOpenChange, animalId, onSubmit }: Props) {
  const [form, setForm] = useState({
    type: "vaccination" as HealthRecord["type"],
    date: new Date().toISOString().split("T")[0],
    description: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, animalId });
    onOpenChange(false);
    setForm({ type: "vaccination", date: new Date().toISOString().split("T")[0], description: "", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Health Record</DialogTitle>
          <DialogDescription>Log a vaccination, treatment, or vet visit.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as HealthRecord["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vaccination">Vaccination</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="vet_visit">Vet Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description *</Label>
            <Input id="desc" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Record</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
