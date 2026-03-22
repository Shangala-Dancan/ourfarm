import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

export interface MilkRecord {
  id: string;
  farmId: string;
  animalId: string;
  date: string;
  session: "morning" | "evening";
  yieldLiters: number;
  butterfatPercent?: number;
  temperature?: number;
  qualityNotes?: string;
}

interface MilkContextType {
  records: MilkRecord[];
  fetchRecords: () => Promise<void>;
  addRecord: (data: Omit<MilkRecord, "id" | "farmId">) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
}

const MilkContext = createContext<MilkContextType | null>(null);

export function MilkProvider({ children }: { children: React.ReactNode }) {
  const { currentFarm } = useAuth();
  const farmId = currentFarm?.id;
  const [records, setRecords] = useState<MilkRecord[]>([]);

  // -------------------- FETCH RECORDS --------------------
  const fetchRecords = useCallback(async () => {
    if (!farmId) return;
    try {
      const res = await axios.get("https://dancan.alwaysdata.net/api/get_milk", {
        params: { farmId },
      });
      const normalized: MilkRecord[] = res.data.map((r: any) => ({
        ...r,
        id: String(r.id),
        animalId: String(r.animalId),
        farmId: String(r.farmId),
        yieldLiters: Number(r.yieldLiters || 0),
      }));
      setRecords(normalized);
    } catch (err) {
      console.error("Failed to fetch milk records:", err);
    }
  }, [farmId]);

  // Fetch when farmId changes
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // -------------------- ADD RECORD --------------------
  const addRecord = useCallback(
    async (data: Omit<MilkRecord, "id" | "farmId">) => {
      if (!farmId) return;
      try {
        const formData = new FormData();
        formData.append("animalId", data.animalId);
        formData.append("date", data.date);
        formData.append("session", data.session);
        formData.append("yieldLiters", String(data.yieldLiters));
        await axios.post("https://dancan.alwaysdata.net/api/add_milk", formData);
        await fetchRecords(); // Refresh after adding
      } catch (err) {
        console.error("Failed to add milk record:", err);
        throw err;
      }
    },
    [farmId, fetchRecords]
  );

  // -------------------- DELETE RECORD --------------------
  const deleteRecord = useCallback(
    async (id: string) => {
      try {
        await axios.delete(`https://dancan.alwaysdata.net/api/delete_milk/${id}`);
        setRecords((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        console.error("Failed to delete milk record:", err);
        throw err;
      }
    },
    []
  );

  return (
    <MilkContext.Provider value={{ records, fetchRecords, addRecord, deleteRecord }}>
      {children}
    </MilkContext.Provider>
  );
}

export function useMilk() {
  const ctx = useContext(MilkContext);
  if (!ctx) throw new Error("useMilk must be used within MilkProvider");
  return ctx;
}