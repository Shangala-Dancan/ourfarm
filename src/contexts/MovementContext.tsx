import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export type MovementType = "entry" | "exit" | "transfer";

export interface MovementRecord {
  id: string;
  farmId: string;
  animalId: string;
  type: MovementType;
  date: string;
  reason: string;
  destination: string;
  source: string;
  notes: string;
}

interface MovementContextType {
  movements: MovementRecord[];
  addMovement: (data: Omit<MovementRecord, "id" | "farmId">) => void;
  deleteMovement: (id: string) => void;
}

const MovementContext = createContext<MovementContextType | null>(null);
const MOVEMENTS_KEY = "lms_movements";

function getStored<T>(key: string, fb: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; } catch { return fb; }
}

export function MovementProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id || "";
  const [allMovements, setAllMovements] = useState<MovementRecord[]>(() => getStored(MOVEMENTS_KEY, []));

  useEffect(() => { localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(allMovements)); }, [allMovements]);

  const movements = allMovements.filter((m) => m.farmId === farmId);

  const addMovement = useCallback((data: Omit<MovementRecord, "id" | "farmId">) => {
    setAllMovements((prev) => [...prev, { ...data, id: crypto.randomUUID(), farmId }]);
  }, [farmId]);

  const deleteMovement = useCallback((id: string) => {
    setAllMovements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  return <MovementContext.Provider value={{ movements, addMovement, deleteMovement }}>{children}</MovementContext.Provider>;
}

export function useMovements() {
  const ctx = useContext(MovementContext);
  if (!ctx) throw new Error("useMovements must be used within MovementProvider");
  return ctx;
}
