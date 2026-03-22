"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
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
  notes?: string;
}

export interface HealthRecord {
  id: string;
  animalId: string;
  farmId: string;
  type: "vaccination" | "treatment" | "vet_visit";
  date: string;
  description: string;
  notes?: string;
}

export interface BreedingEvent {
  id: string;
  animalId: string;
  farmId: string;
  breedingDate: string;
  expectedCalvingDate: string;
  actualCalvingDate?: string;
  outcome: "pending" | "successful" | "unsuccessful";
  notes?: string;
}

interface HerdContextType {
  animals: Animal[];
  healthRecords: HealthRecord[];
  breedingEvents: BreedingEvent[];
  loading: boolean;
  fetchAnimals: () => Promise<void>;
  addAnimal: (data: Omit<Animal, "id" | "farmId">) => Promise<void>;
  updateAnimal: (id: string, data: Partial<Omit<Animal, "id" | "farmId">>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  addHealthRecord: (data: Omit<HealthRecord, "id" | "farmId">) => Promise<void>;
  deleteHealthRecord: (id: string) => Promise<void>;
  addBreedingEvent: (data: Omit<BreedingEvent, "id" | "farmId">) => Promise<void>;
  updateBreedingEvent: (id: string, data: Partial<Omit<BreedingEvent, "id" | "farmId">>) => Promise<void>;
  deleteBreedingEvent: (id: string) => Promise<void>;
}

const HerdContext = createContext<HerdContextType | null>(null);

export function HerdProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id;
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [breedingEvents, setBreedingEvents] = useState<BreedingEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // ---------------- Animals ----------------
  const fetchAnimals = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const res = await axios.get("https://dancan.alwaysdata.net/api/get_animal", {
        params: { farmId },
      });
      const normalized: Animal[] = res.data.map((a: any) => ({
        ...a,
        tagNumber: a.tag || a.tagNumber,
      }));
      setAnimals(normalized);
    } catch (err) {
      console.error("Failed to fetch animals", err);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  const addAnimal = useCallback(
    async (data: Omit<Animal, "id" | "farmId">) => {
      if (!farmId) return;
      const formData = new FormData();
      Object.entries({ ...data, farmId }).forEach(([k, v]) => formData.append(k, String(v)));

      const res = await axios.post("https://dancan.alwaysdata.net/api/add_animal", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnimals((prev) => [...prev, { ...data, id: res.data.id, farmId }]);
    },
    [farmId]
  );

  const updateAnimal = useCallback(
    async (id: string, data: Partial<Omit<Animal, "id" | "farmId">>) => {
      await axios.put(`https://dancan.alwaysdata.net/api/update_animal/${id}`, data);
      setAnimals((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
    },
    []
  );

  const deleteAnimal = useCallback(
    async (id: string) => {
      await axios.delete(`https://dancan.alwaysdata.net/api/delete_animal/${id}`);
      setAnimals((prev) => prev.filter((a) => a.id !== id));
      setHealthRecords((prev) => prev.filter((h) => h.animalId !== id));
      setBreedingEvents((prev) => prev.filter((b) => b.animalId !== id));
    },
    []
  );

  // ---------------- Health Records ----------------
  const addHealthRecord = useCallback(
    async (data: Omit<HealthRecord, "id" | "farmId">) => {
      if (!farmId) return;
      const formData = new FormData();
      Object.entries({ ...data, farmId }).forEach(([k, v]) => formData.append(k, String(v)));
      const res = await axios.post("https://dancan.alwaysdata.net/api/add_health_record", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setHealthRecords((prev) => [...prev, { ...data, id: res.data.id, farmId }]);
    },
    [farmId]
  );

  const deleteHealthRecord = useCallback(async (id: string) => {
    await axios.delete(`https://dancan.alwaysdata.net/api/delete_health_record/${id}`);
    setHealthRecords((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // ---------------- Breeding Events ----------------
  const addBreedingEvent = useCallback(
    async (data: Omit<BreedingEvent, "id" | "farmId">) => {
      if (!farmId) return;
      const formData = new FormData();
      Object.entries({ ...data, farmId }).forEach(([k, v]) => formData.append(k, String(v)));
      const res = await axios.post("https://dancan.alwaysdata.net/api/add_breeding_event", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBreedingEvents((prev) => [...prev, { ...data, id: res.data.id, farmId }]);
    },
    [farmId]
  );

  const updateBreedingEvent = useCallback(
    async (id: string, data: Partial<Omit<BreedingEvent, "id" | "farmId">>) => {
      await axios.put(`https://dancan.alwaysdata.net/api/update_breeding_event/${id}`, data);
      setBreedingEvents((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    },
    []
  );

  const deleteBreedingEvent = useCallback(async (id: string) => {
    await axios.delete(`https://dancan.alwaysdata.net/api/delete_breeding_event/${id}`);
    setBreedingEvents((prev) => prev.filter((b) => b.id !== id));
  }, []);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  return (
    <HerdContext.Provider
      value={{
        animals,
        healthRecords,
        breedingEvents,
        loading,
        fetchAnimals,
        addAnimal,
        updateAnimal,
        deleteAnimal,
        addHealthRecord,
        deleteHealthRecord,
        addBreedingEvent,
        updateBreedingEvent,
        deleteBreedingEvent,
      }}
    >
      {children}
    </HerdContext.Provider>
  );
}

export function useHerd() {
  const ctx = useContext(HerdContext);
  if (!ctx) throw new Error("useHerd must be used within HerdProvider");
  return ctx;
}