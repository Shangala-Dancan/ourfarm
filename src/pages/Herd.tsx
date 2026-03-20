import { useState, useMemo, useEffect } from "react";
import axios from "axios";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Plus, Search, PawPrint, Heart, Baby } from "lucide-react";

import { type Animal } from "@/contexts/HerdContext";
import { AnimalFormDialog } from "@/components/herd/AnimalFormDialog";
import { AnimalDetailSheet } from "@/components/herd/AnimalDetailSheet";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  sold: "bg-yellow-100 text-yellow-800",
  deceased: "bg-red-100 text-red-800",
};

export default function Herd() {
  const { toast } = useToast();

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<Animal | null>(null);
  const [detailAnimal, setDetailAnimal] = useState<Animal | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ✅ Fetch animals
  const fetchAnimals = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://dancan.alwaysdata.net/api/get_animal");

      const normalized: Animal[] = res.data.map((a: any) => ({
        ...a,
        tagNumber: a.tag, // normalize API field
      }));

      setAnimals(normalized);
    } catch (error) {
      console.error(error);
      toast({ title: "Error fetching animals" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, []);

  // ✅ Filtering
  const filtered = useMemo(() => {
    return animals.filter((a) => {
      const matchesSearch =
        a.name?.toLowerCase().includes(search.toLowerCase()) ||
        a.tagNumber?.toLowerCase().includes(search.toLowerCase()) ||
        a.breed?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || a.status === statusFilter;

      const matchesGender =
        genderFilter === "all" || a.gender === genderFilter;

      return matchesSearch && matchesStatus && matchesGender;
    });
  }, [animals, search, statusFilter, genderFilter]);

  // ✅ Stats
  const stats = useMemo(
    () => ({
      total: animals.length,
      active: animals.filter((a) => a.status === "active").length,
    }),
    [animals]
  );

  // ✅ Delete animal
  const handleDelete = async (animal: Animal) => {
    try {
      await axios.delete(
        `http://dancan.alwaysdata.net/api/delete_animal/${animal.id}`
      );

      setAnimals((prev) => prev.filter((a) => a.id !== animal.id));

      toast({
        title: "Animal removed",
        description: `${animal.name || animal.tagNumber} deleted.`,
      });
    } catch (error) {
      console.error(error);
      toast({ title: "Delete failed" });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Herd Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your animal registry
          </p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Animal
        </Button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <PawPrint className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Animals</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Heart className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <Baby className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {animals.filter((a) => a.gender === "female").length}
              </p>
              <p className="text-xs text-muted-foreground">Females</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <Input
            placeholder="Search by name, tag, or breed..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="sold">Sold</SelectItem>
            <SelectItem value="deceased">Deceased</SelectItem>
          </SelectContent>
        </Select>

        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Gender</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="male">Male</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">Loading animals...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No animals found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Breed
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Gender
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    DOB
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map((animal) => (
                  <TableRow
                    key={animal.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setDetailAnimal(animal);
                      setDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">
                      {animal.tagNumber}
                    </TableCell>
                    <TableCell>{animal.name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {animal.breed || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell capitalize">
                      {animal.gender}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          (statusColors[animal.status] || "") +
                          " capitalize"
                        }
                      >
                        {animal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs">
                      {animal.DOB || "—"}
                    </TableCell>

                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(animal);
                        }}
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

      {/* FORM */}
      <AnimalFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        animal={editAnimal}
        onSubmit={fetchAnimals}
      />

      {/* ✅ SAFE DETAIL SHEET */}
      {detailAnimal && (
        <AnimalDetailSheet
          animal={detailAnimal}
          open={detailOpen}
          onOpenChange={(open) => {
            setDetailOpen(open);
            if (!open) setDetailAnimal(null); // cleanup
          }}
          onEdit={(animal) => {
            setDetailOpen(false);
            setEditAnimal(animal);
            setFormOpen(true);
          }}
        />
      )}
    </div>
  );
}