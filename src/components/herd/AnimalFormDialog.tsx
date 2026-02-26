import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Animal, AnimalGender, AnimalStatus } from "@/contexts/HerdContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animal?: Animal | null;
  onSubmit: (data: Omit<Animal, "id" | "farmId">) => void;
}

const defaultForm = {
  tagNumber: "",
  name: "",
  breed: "",
  gender: "female" as AnimalGender,
  dateOfBirth: "",
  acquisitionDate: "",
  status: "active" as AnimalStatus,
  notes: "",
};

export function AnimalFormDialog({ open, onOpenChange, animal, onSubmit }: Props) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (animal) {
      setForm({
        tagNumber: animal.tagNumber,
        name: animal.name,
        breed: animal.breed,
        gender: animal.gender,
        dateOfBirth: animal.dateOfBirth,
        acquisitionDate: animal.acquisitionDate,
        status: animal.status,
        notes: animal.notes,
      });
    } else {
      setForm(defaultForm);
    }
  }, [animal, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{animal ? "Edit Animal" : "Add Animal"}</DialogTitle>
          <DialogDescription>
            {animal ? "Update animal details below." : "Fill in the details to register a new animal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tagNumber">Tag Number *</Label>
              <Input id="tagNumber" required value={form.tagNumber} onChange={(e) => setForm({ ...form, tagNumber: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as AnimalGender })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acq">Acquisition Date</Label>
              <Input id="acq" type="date" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AnimalStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{animal ? "Save Changes" : "Add Animal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
