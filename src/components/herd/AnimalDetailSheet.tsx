import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useHerd, type Animal } from "@/contexts/HerdContext";
import { HealthRecordDialog } from "./HealthRecordDialog";
import { BreedingEventDialog } from "./BreedingEventDialog";

interface Props {
  animal: Animal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (animal: Animal) => void;
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  sold: "bg-yellow-100 text-yellow-800",
  deceased: "bg-red-100 text-red-800",
};

export function AnimalDetailSheet({ animal, open, onOpenChange, onEdit }: Props) {
  const { healthRecords, breedingEvents, addHealthRecord, deleteHealthRecord, addBreedingEvent, deleteBreedingEvent } = useHerd();
  const [healthOpen, setHealthOpen] = useState(false);
  const [breedingOpen, setBreedingOpen] = useState(false);

  if (!animal) return null;

  const animalHealth = healthRecords.filter((h) => h.animalId === animal.id);
  const animalBreeding = breedingEvents.filter((b) => b.animalId === animal.id);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <SheetTitle className="text-xl">
                {animal.name || animal.tagNumber}
              </SheetTitle>
              <Badge className={statusColors[animal.status]}>{animal.status}</Badge>
            </div>
            <SheetDescription>
              Tag: {animal.tagNumber} · {animal.breed || "Unknown breed"} · {animal.gender}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-2">
            <Card>
              <CardContent className="pt-4 grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Date of Birth:</span><br />{animal.dateOfBirth || "—"}</div>
                <div><span className="text-muted-foreground">Acquired:</span><br />{animal.acquisitionDate || "—"}</div>
                {animal.notes && <div className="col-span-2"><span className="text-muted-foreground">Notes:</span><br />{animal.notes}</div>}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(animal); }}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            </div>

            <Tabs defaultValue="health">
              <TabsList className="w-full">
                <TabsTrigger value="health" className="flex-1">Health ({animalHealth.length})</TabsTrigger>
                <TabsTrigger value="breeding" className="flex-1">Breeding ({animalBreeding.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="health" className="space-y-3">
                <Button size="sm" onClick={() => setHealthOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Record
                </Button>
                {animalHealth.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No health records yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animalHealth.sort((a, b) => b.date.localeCompare(a.date)).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs">{r.date}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs capitalize">
                              {r.type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{r.description}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteHealthRecord(r.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="breeding" className="space-y-3">
                <Button size="sm" onClick={() => setBreedingOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Event
                </Button>
                {animalBreeding.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No breeding events yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bred</TableHead>
                        <TableHead>Expected</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {animalBreeding.sort((a, b) => b.breedingDate.localeCompare(a.breedingDate)).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs">{e.breedingDate}</TableCell>
                          <TableCell className="text-xs">{e.expectedCalvingDate || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={e.outcome === "successful" ? "default" : "secondary"} className="text-xs capitalize">
                              {e.outcome}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBreedingEvent(e.id)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <HealthRecordDialog open={healthOpen} onOpenChange={setHealthOpen} animalId={animal.id} onSubmit={addHealthRecord} />
      <BreedingEventDialog open={breedingOpen} onOpenChange={setBreedingOpen} animalId={animal.id} onSubmit={addBreedingEvent} />
    </>
  );
}
