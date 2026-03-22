"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import axios from "axios";
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
  notes?: string;
}

interface FinanceContextType {
  records: FinanceRecord[];
  loading: boolean;
  fetchRecords: () => Promise<void>;
  addRecord: (data: Omit<FinanceRecord, "id" | "farmId">) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id;
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!farmId) return;
    setLoading(true);
    try {
      const res = await axios.get("https://dancan.alwaysdata.net/api/get_finance", {
        params: { farmId },
      });
      setRecords(res.data);
    } catch (err) {
      console.error("Failed to fetch finance records:", err);
    } finally {
      setLoading(false);
    }
  }, [farmId]);

  const addRecord = useCallback(
    async (data: Omit<FinanceRecord, "id" | "farmId">) => {
      if (!farmId) return;
      try {
        const formData = new FormData();
        formData.append("farmId", farmId);
        formData.append("type", data.type);
        formData.append("category", data.category);
        formData.append("amount", data.amount.toString());
        formData.append("date", data.date);
        formData.append("description", data.description);
        formData.append("notes", data.notes || "");

        const res = await axios.post("https://dancan.alwaysdata.net/api/add_finance", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Add record locally
        setRecords((prev) => [...prev, { ...data, id: res.data.id, farmId }]);
      } catch (err) {
        console.error("Failed to add finance record:", err);
        throw err;
      }
    },
    [farmId]
  );

  const deleteRecord = useCallback(async (id: string) => {
    try {
      await axios.delete(`https://dancan.alwaysdata.net/api/finance/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete finance record:", err);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (farmId) fetchRecords();
  }, [farmId, fetchRecords]);

  return (
    <FinanceContext.Provider value={{ records, loading, fetchRecords, addRecord, deleteRecord }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinances() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinances must be used within FinanceProvider");
  return ctx;
}