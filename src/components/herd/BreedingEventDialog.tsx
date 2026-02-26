import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BreedingEvent } from "@/contexts/HerdContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: string;
  onSubmit: (data: Omit<BreedingEvent, "id" | "farmId">) => void;
}

export function BreedingEventDialog({ open, onOpenChange, animalId, onSubmit }: Props) {
  const [form, setForm] = useState({
    breedingDate: "",
    expectedCalvingDate: "",
    actualCalvingDate: "",
    outcome: "pending" as BreedingEvent["outcome"],
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, animalId });
    onOpenChange(false);
    setForm({ breedingDate: "", expectedCalvingDate: "", actualCalvingDate: "", outcome: "pending", notes: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Breeding Event</DialogTitle>
          <DialogDescription>Record a breeding event for this animal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="bdate">Breeding Date *</Label>
            <Input id="bdate" type="date" required value={form.breedingDate} onChange={(e) => setForm({ ...form, breedingDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edate">Expected Calving Date</Label>
            <Input id="edate" type="date" value={form.expectedCalvingDate} onChange={(e) => setForm({ ...form, expectedCalvingDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adate">Actual Calving Date</Label>
            <Input id="adate" type="date" value={form.actualCalvingDate} onChange={(e) => setForm({ ...form, actualCalvingDate: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Select value={form.outcome} onValueChange={(v) => setForm({ ...form, outcome: v as BreedingEvent["outcome"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="successful">Successful</SelectItem>
                <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
