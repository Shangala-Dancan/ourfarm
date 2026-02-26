import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface MilkRecord {
  id: string;
  farmId: string;
  animalId: string;
  date: string;
  session: "morning" | "evening";
  yieldLiters: number;
  butterfatPercent: number;
  temperature: number;
  qualityNotes: string;
}

interface MilkContextType {
  records: MilkRecord[];
  addRecord: (data: Omit<MilkRecord, "id" | "farmId">) => void;
  deleteRecord: (id: string) => void;
}

const MilkContext = createContext<MilkContextType | null>(null);
const MILK_KEY = "lms_milk_records";

function getStored<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}

export function MilkProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id || "";
  const [allRecords, setAllRecords] = useState<MilkRecord[]>(() => getStored(MILK_KEY, []));

  useEffect(() => { localStorage.setItem(MILK_KEY, JSON.stringify(allRecords)); }, [allRecords]);

  const records = allRecords.filter((r) => r.farmId === farmId);

  const addRecord = useCallback((data: Omit<MilkRecord, "id" | "farmId">) => {
    setAllRecords((prev) => [...prev, { ...data, id: crypto.randomUUID(), farmId }]);
  }, [farmId]);

  const deleteRecord = useCallback((id: string) => {
    setAllRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return <MilkContext.Provider value={{ records, addRecord, deleteRecord }}>{children}</MilkContext.Provider>;
}

export function useMilk() {
  const ctx = useContext(MilkContext);
  if (!ctx) throw new Error("useMilk must be used within MilkProvider");
  return ctx;
}
