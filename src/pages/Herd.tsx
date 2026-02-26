import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, PawPrint, Heart, Baby } from "lucide-react";
import { useHerd, type Animal } from "@/contexts/HerdContext";
import { AnimalFormDialog } from "@/components/herd/AnimalFormDialog";
import { AnimalDetailSheet } from "@/components/herd/AnimalDetailSheet";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  sold: "bg-yellow-100 text-yellow-800",
  deceased: "bg-red-100 text-red-800",
};

export default function Herd() {
  const { animals, healthRecords, breedingEvents, addAnimal, updateAnimal, deleteAnimal } = useHerd();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [detailAnimal, setDetailAnimal] = useState<Animal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filtered = useMemo(() => {
    return animals.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tagNumber.toLowerCase().includes(search.toLowerCase()) ||
        a.breed.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      const matchesGender = genderFilter === "all" || a.gender === genderFilter;
      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [animals, search, statusFilter, genderFilter]);

  const stats = useMemo(() => ({
    total: animals.length,
    active: animals.filter((a) => a.status === "active").length,
    healthRecords: healthRecords.length,
    pendingBreeding: breedingEvents.filter((b) => b.outcome === "pending").length,
  }), [animals, healthRecords, breedingEvents]);

  const handleAdd = (data: Omit<Animal, "id" | "farmId">) => {
    addAnimal(data);
    toast({ title: "Animal added", description: `${data.name || data.tagNumber} registered.` });
  };

  const handleEdit = (data: Omit<Animal, "id" | "farmId">) => {
    if (editAnimal) {
      updateAnimal(editAnimal.id, data);
      toast({ title: "Animal updated" });
      setEditAnimal(null);
    }
  };

  const handleDelete = (animal: Animal) => {
    deleteAnimal(animal.id);
    toast({ title: "Animal removed", description: `${animal.name || animal.tagNumber} deleted.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Herd Management</h1>
          <p className="text-sm text-muted-foreground">Manage your animal registry, health records, and breeding</p>
        </div>
        <Button onClick={() => { setEditAnimal(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Animal
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2"><PawPrint className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Animals</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2"><PawPrint className="h-5 w-5 text-green-700" /></div>
            <div><p className="text-2xl font-bold">{stats.active}</p><p className="text-xs text-muted-foreground">Active</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2"><Heart className="h-5 w-5 text-blue-700" /></div>
            <div><p className="text-2xl font-bold">{stats.healthRecords}</p><p className="text-xs text-muted-foreground">Health Records</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="rounded-full bg-orange-100 p-2"><Baby className="h-5 w-5 text-orange-700" /></div>
            <div><p className="text-2xl font-bold">{stats.pendingBreeding}</p><p className="text-xs text-muted-foreground">Pending Calving</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, tag, or breed..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Gender" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gender</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {animals.length === 0
                ? 'No animals registered yet. Click "Add Animal" to get started.'
                : "No animals match your filters."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Breed</TableHead>
                  <TableHead className="hidden sm:table-cell">Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">DOB</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((animal) => (
                  <TableRow
                    key={animal.id}
                    className="cursor-pointer"
                    onClick={() => { setDetailAnimal(animal); setDetailOpen(true); }}
                  >
                    <TableCell className="font-medium">{animal.tagNumber}</TableCell>
                    <TableCell>{animal.name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">{animal.breed || "—"}</TableCell>
                    <TableCell className="hidden sm:table-cell capitalize">{animal.gender}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[animal.status] + " capitalize"}>{animal.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">{animal.dateOfBirth || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDelete(animal); }}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AnimalFormDialog
        open={formOpen || !!editAnimal}
        onOpenChange={(open) => { if (!open) { setFormOpen(false); setEditAnimal(null); } }}
        animal={editAnimal}
        onSubmit={editAnimal ? handleEdit : handleAdd}
      />
      <AnimalDetailSheet
        animal={detailAnimal}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={(a) => { setDetailOpen(false); setEditAnimal(a); setFormOpen(true); }}
      />
    </div>
  );
}
