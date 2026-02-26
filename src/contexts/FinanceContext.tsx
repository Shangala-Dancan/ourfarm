import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type FinanceCategory =
  | "feed" | "veterinary" | "labor" | "equipment" | "maintenance" | "other_expense"
  | "milk_sales" | "animal_sales" | "other_income";

export type FinanceType = "expense" | "income";

export interface FinanceRecord {
  id: string;
  farmId: string;
  type: FinanceType;
  category: FinanceCategory;
  amount: number;
  date: string;
  description: string;
  notes: string;
}

interface FinanceContextType {
  records: FinanceRecord[];
  addRecord: (data: Omit<FinanceRecord, "id" | "farmId">) => void;
  deleteRecord: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | null>(null);
const FINANCE_KEY = "lms_finance_records";

function getStored<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id || "";
  const [allRecords, setAllRecords] = useState<FinanceRecord[]>(() => getStored(FINANCE_KEY, []));

  useEffect(() => { localStorage.setItem(FINANCE_KEY, JSON.stringify(allRecords)); }, [allRecords]);

  const records = allRecords.filter((r) => r.farmId === farmId);

  const addRecord = useCallback((data: Omit<FinanceRecord, "id" | "farmId">) => {
    setAllRecords((prev) => [...prev, { ...data, id: crypto.randomUUID(), farmId }]);
  }, [farmId]);

  const deleteRecord = useCallback((id: string) => {
    setAllRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return <FinanceContext.Provider value={{ records, addRecord, deleteRecord }}>{children}</FinanceContext.Provider>;
}

export function useFinances() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinances must be used within FinanceProvider");
  return ctx;
}
