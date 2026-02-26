import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type PastureCondition = "good" | "fair" | "poor";

export interface Pasture {
  id: string;
  farmId: string;
  name: string;
  sizeAcres: number;
  grassType: string;
  condition: PastureCondition;
  currentHerdCount: number;
  isResting: boolean;
  notes: string;
}

export interface RotationEntry {
  id: string;
  farmId: string;
  pastureId: string;
  startDate: string;
  endDate: string;
  herdGroup: string;
}

interface PastureContextType {
  pastures: Pasture[];
  rotations: RotationEntry[];
  addPasture: (data: Omit<Pasture, "id" | "farmId">) => void;
  updatePasture: (id: string, data: Partial<Omit<Pasture, "id" | "farmId">>) => void;
  deletePasture: (id: string) => void;
  addRotation: (data: Omit<RotationEntry, "id" | "farmId">) => void;
  deleteRotation: (id: string) => void;
}

const PastureContext = createContext<PastureContextType | null>(null);
const PASTURES_KEY = "lms_pastures";
const ROTATIONS_KEY = "lms_rotations";

function getStored<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}

export function PastureProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id || "";
  const [allPastures, setAllPastures] = useState<Pasture[]>(() => getStored(PASTURES_KEY, []));
  const [allRotations, setAllRotations] = useState<RotationEntry[]>(() => getStored(ROTATIONS_KEY, []));

  useEffect(() => { localStorage.setItem(PASTURES_KEY, JSON.stringify(allPastures)); }, [allPastures]);
  useEffect(() => { localStorage.setItem(ROTATIONS_KEY, JSON.stringify(allRotations)); }, [allRotations]);

  const pastures = allPastures.filter((p) => p.farmId === farmId);
  const rotations = allRotations.filter((r) => r.farmId === farmId);

  const addPasture = useCallback((data: Omit<Pasture, "id" | "farmId">) => {
    setAllPastures((prev) => [...prev, { ...data, id: crypto.randomUUID(), farmId }]);
  }, [farmId]);

  const updatePasture = useCallback((id: string, data: Partial<Omit<Pasture, "id" | "farmId">>) => {
    setAllPastures((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }, []);

  const deletePasture = useCallback((id: string) => {
    setAllPastures((prev) => prev.filter((p) => p.id !== id));
    setAllRotations((prev) => prev.filter((r) => r.pastureId !== id));
  }, []);

  const addRotation = useCallback((data: Omit<RotationEntry, "id" | "farmId">) => {
    setAllRotations((prev) => [...prev, { ...data, id: crypto.randomUUID(), farmId }]);
  }, [farmId]);

  const deleteRotation = useCallback((id: string) => {
    setAllRotations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <PastureContext.Provider value={{ pastures, rotations, addPasture, updatePasture, deletePasture, addRotation, deleteRotation }}>
      {children}
    </PastureContext.Provider>
  );
}

export function usePastures() {
  const ctx = useContext(PastureContext);
  if (!ctx) throw new Error("usePastures must be used within PastureProvider");
  return ctx;
}
