"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
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
  notes?: string;
}

interface PastureContextType {
  pastures: Pasture[];
  loading: boolean;
  fetchPastures: () => Promise<void>;
  addPasture: (formData: FormData) => Promise<void>;
  deletePasture: (id: string) => Promise<void>;
}

const PastureContext = createContext<PastureContextType | null>(null);

export function PastureProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id;
  const [pastures, setPastures] = useState<Pasture[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPastures = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const res = await axios.get("https://dancan.alwaysdata.net/api/get_pasture", { params: { farmId } });
      setPastures(res.data);
    } catch (err) {
      console.error("Failed to fetch pastures", err);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  const addPasture = useCallback(async (formData: FormData) => {
    if (!farmId) return;
    try {
      const res = await axios.post("https://dancan.alwaysdata.net/api/add_pasture", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPastures((prev) => [...prev, res.data]); // assuming API returns created pasture
    } catch (err) {
      console.error("Failed to add pasture", err);
      throw err;
    }
  }, [farmId]);

  const deletePasture = useCallback(async (id: string) => {
    try {
      await axios.delete(`https://dancan.alwaysdata.net/api/delete_pasture/${id}`);
      setPastures((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete pasture", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPastures();
  }, [fetchPastures]);

  return (
    <PastureContext.Provider value={{ pastures, loading, fetchPastures, addPasture, deletePasture }}>
      {children}
    </PastureContext.Provider>
  );
}

export function usePastures() {
  const ctx = useContext(PastureContext);
  if (!ctx) throw new Error("usePastures must be used within PastureProvider");
  return ctx;
}