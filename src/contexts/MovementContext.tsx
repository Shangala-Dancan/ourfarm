"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export type MovementType = "entry" | "exit" | "transfer";

export interface MovementRecord {
  id: string;
  farmId: string;
  animalId: string;
  type: MovementType;
  date: string;
  reason?: string;
  destination?: string;
  source?: string;
  notes?: string;
}

interface MovementContextType {
  movements: MovementRecord[];
  loading: boolean;
  fetchMovements: () => Promise<void>;
  addMovement: (data: Omit<MovementRecord, "id" | "farmId">) => Promise<void>;
  deleteMovement: (id: string) => Promise<void>;
}

const MovementContext = createContext<MovementContextType | null>(null);

export function MovementProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id;
  const [movements, setMovements] = useState<MovementRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovements = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const res = await axios.get("https://dancan.alwaysdata.net/api/get_move", {
        params: { farmId },
      });
      setMovements(res.data);
    } catch (err) {
      console.error("Failed to fetch movements", err);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  const addMovement = useCallback(
    async (data: Omit<MovementRecord, "id" | "farmId">) => {
      if (!farmId) return;
      const formData = new URLSearchParams({ ...data, farmId } as Record<string, string>);
      const res = await axios.post("https://dancan.alwaysdata.net/api/add_move", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setMovements((prev) => [...prev, { ...data, id: res.data.id, farmId }]);
    },
    [farmId]
  );

  const deleteMovement = useCallback(async (id: string) => {
    await axios.delete(`https://dancan.alwaysdata.net/api/delete_move/${id}`);
    setMovements((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <MovementContext.Provider value={{ movements, loading, fetchMovements, addMovement, deleteMovement }}>
      {children}
    </MovementContext.Provider>
  );
}

export function useMovements() {
  const ctx = useContext(MovementContext);
  if (!ctx) throw new Error("useMovements must be used within MovementProvider");
  return ctx;
}