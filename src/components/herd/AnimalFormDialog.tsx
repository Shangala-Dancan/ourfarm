import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Animal, AnimalGender, AnimalStatus } from "@/contexts/HerdContext";
import axios from "axios";

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
const [name,setName]=useState("")
const [tag,setTag]=useState("")
const [breed,setBreed]=useState("")
const [gender,setGender]=useState("")
const [status,setStatus]=useState("")
const [dob,setDOB]=useState("")


const [loading, setLoading]=useState("")
const [success, setSuccess]=useState("")
const [error, setError]=useState("")

  useEffect(() => {
    if (animal) {
      setForm(animal);
    } else {
      setForm(defaultForm);
    }
  }, [animal, open]);
  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()

    setLoading("Plaese wait...")

    const formData=new FormData()

    formData.append("tag",tag)
    formData.append("name",name)
    formData.append("breed",breed)
    formData.append("status",status)
    formData.append("gender",gender)
    formData.append("DOB",dob)

    try {
      const response=await axios.post("http://127.0.0.1:5000/api/add_animal",formData)

      setLoading("")
      setSuccess(response.data.message)
      onOpenChange(false)
      
    } catch (error) {
      setLoading("")
      setError(error.message)
    }



  }

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   onSubmit(form);
  //   onOpenChange(false);
  // };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{animal ? "Edit Animal" : "Add Animal"}</DialogTitle>
          <h1>{error}</h1>
          <h1>{success}</h1>
          <h1>{loading}</h1>
          <DialogDescription>
            {animal ? "Update animal details below." : "Fill in the details to register a new animal."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tagNumber">Tag Number *</Label>
              <Input id="tagNumber" required /*value={form.tagNumber} onChange={(e) => setForm({ ...form, tagNumber: e.target.value })}*/
              onChange={(e)=>setTag(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" /*value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}*/ 
              onChange={(e)=>setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" /*value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} */ 
              onChange={(e)=>setBreed(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select /*value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as AnimalGender })}*/
              onValueChange={(value)=>setGender(value)}
              >
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
              <Input id="dob" type="date" /*value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}*/ 
              onChange={(e)=>setDOB(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acq">Acquisition Date</Label>
              <Input id="acq" type="date" /*value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })}*/ 
              
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select /*value={form.status} onValueChange={(v) => setForm({ ...form, status: v as AnimalStatus })}*/ 
            onValueChange={(value)=>setStatus(value)}
            >
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
            <Textarea id="notes" /*value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}*/ 
            onChange={(e)=>setStatus(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{animal ? "Save Changes" : "Add Animal"}</Button>
            {/* <input type="submit"  value="Submit"/> */}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
