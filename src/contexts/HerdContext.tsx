import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type AnimalStatus = "active" | "sold" | "deceased";
export type AnimalGender = "male" | "female";

export interface Animal {
  id: string;
  farmId: string;
  tagNumber: string;
  name: string;
  breed: string;
  gender: AnimalGender;
  dateOfBirth: string;
  acquisitionDate: string;
  status: AnimalStatus;
  notes: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  farmId: string;
  type: "vaccination" | "treatment" | "vet_visit";
  date: string;
  description: string;
  notes: string;
}

export interface BreedingEvent {
  id: string;
  animalId: string;
  farmId: string;
  breedingDate: string;
  expectedCalvingDate: string;
  actualCalvingDate: string;
  outcome: "pending" | "successful" | "unsuccessful";
  notes: string;
}

interface HerdContextType {
  animals: Animal[];
  healthRecords: HealthRecord[];
  breedingEvents: BreedingEvent[];
  addAnimal: (animal: Omit<Animal, "id" | "farmId">) => Animal;
  updateAnimal: (id: string, data: Partial<Omit<Animal, "id" | "farmId">>) => void;
  deleteAnimal: (id: string) => void;
  addHealthRecord: (record: Omit<HealthRecord, "id" | "farmId">) => void;
  deleteHealthRecord: (id: string) => void;
  addBreedingEvent: (event: Omit<BreedingEvent, "id" | "farmId">) => void;
  updateBreedingEvent: (id: string, data: Partial<Omit<BreedingEvent, "id" | "farmId">>) => void;
  deleteBreedingEvent: (id: string) => void;
}

const HerdContext = createContext<HerdContextType | null>(null);

const ANIMALS_KEY = "lms_animals";
const HEALTH_KEY = "lms_health_records";
const BREEDING_KEY = "lms_breeding_events";

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function HerdProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id || "";

  const [allAnimals, setAllAnimals] = useState<Animal[]>(() => getStored(ANIMALS_KEY, []));
  const [allHealth, setAllHealth] = useState<HealthRecord[]>(() => getStored(HEALTH_KEY, []));
  const [allBreeding, setAllBreeding] = useState<BreedingEvent[]>(() => getStored(BREEDING_KEY, []));

  useEffect(() => { setStored(ANIMALS_KEY, allAnimals); }, [allAnimals]);
  useEffect(() => { setStored(HEALTH_KEY, allHealth); }, [allHealth]);
  useEffect(() => { setStored(BREEDING_KEY, allBreeding); }, [allBreeding]);

  const animals = allAnimals.filter((a) => a.farmId === farmId);
  const healthRecords = allHealth.filter((h) => h.farmId === farmId);
  const breedingEvents = allBreeding.filter((b) => b.farmId === farmId);

  const addAnimal = useCallback((data: Omit<Animal, "id" | "farmId">) => {
    const animal: Animal = { ...data, id: crypto.randomUUID(), farmId };
    setAllAnimals((prev) => [...prev, animal]);
    return animal;
  }, [farmId]);

  const updateAnimal = useCallback((id: string, data: Partial<Omit<Animal, "id" | "farmId">>) => {
    setAllAnimals((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, []);

  const deleteAnimal = useCallback((id: string) => {
    setAllAnimals((prev) => prev.filter((a) => a.id !== id));
    setAllHealth((prev) => prev.filter((h) => h.animalId !== id));
    setAllBreeding((prev) => prev.filter((b) => b.animalId !== id));
  }, []);

  const addHealthRecord = useCallback((data: Omit<HealthRecord, "id" | "farmId">) => {
    const record: HealthRecord = { ...data, id: crypto.randomUUID(), farmId };
    setAllHealth((prev) => [...prev, record]);
  }, [farmId]);

  const deleteHealthRecord = useCallback((id: string) => {
    setAllHealth((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const addBreedingEvent = useCallback((data: Omit<BreedingEvent, "id" | "farmId">) => {
    const event: BreedingEvent = { ...data, id: crypto.randomUUID(), farmId };
    setAllBreeding((prev) => [...prev, event]);
  }, [farmId]);

  const updateBreedingEvent = useCallback((id: string, data: Partial<Omit<BreedingEvent, "id" | "farmId">>) => {
    setAllBreeding((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  }, []);

  const deleteBreedingEvent = useCallback((id: string) => {
    setAllBreeding((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return (
    <HerdContext.Provider
      value={{
        animals, healthRecords, breedingEvents,
        addAnimal, updateAnimal, deleteAnimal,
        addHealthRecord, deleteHealthRecord,
        addBreedingEvent, updateBreedingEvent, deleteBreedingEvent,
      }}
    >
      {children}
    </HerdContext.Provider>
  );
}

export function useHerd() {
  const context = useContext(HerdContext);
  if (!context) throw new Error("useHerd must be used within HerdProvider");
  return context;
}
