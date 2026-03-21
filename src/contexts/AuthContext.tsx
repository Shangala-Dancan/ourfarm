// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export type UserRole = "owner" | "manager" | "worker";

export interface User {
  id: number | string;
  email: string;
  name?: string;
  role?: UserRole;
  token: string;
  [key: string]: any;
}

export interface Farm {
  id: string;
  name: string;
  location: string;
  ownerId: string;
}

interface AuthContextType {
  user: User | null;
  farms: Farm[];
  currentFarm: Farm | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  setCurrentFarm: (farmId: string) => void;
  addFarm: (name: string, location: string) => Promise<Farm>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const FARMS_KEY = "lms_farms"; // optional caching for farms

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  // ✅ Login using your external API
  const login = useCallback(async (email: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const res = await axios.post("https://dancan.alwaysdata.net/api/signin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { user: apiUser, token } = res.data;

      const loggedInUser: User = {
        ...apiUser,
        token,
      };

      setUser(loggedInUser);
      localStorage.setItem("user", JSON.stringify(loggedInUser));
      localStorage.setItem("token", token);

      // Optionally fetch farms from your API if available
      const farmsRes = await axios.get("https://dancan.alwaysdata.net/api/farms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFarms(farmsRes.data || []);
      localStorage.setItem(FARMS_KEY, JSON.stringify(farmsRes.data || []));
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "Login failed");
    }
  }, []);

  // ✅ Signup using your external API
  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const res = await axios.post("https://dancan.alwaysdata.net/api/signup", {
        email,
        password,
        name,
        role,
      });

      const { user: apiUser, token } = res.data;

      const newUser: User = {
        ...apiUser,
        token,
      };

      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("token", token);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "Signup failed");
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setFarms([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem(FARMS_KEY);
  }, []);

  const setCurrentFarm = useCallback((farmId: string) => {
    if (!user) return;
    const updated = { ...user, currentFarmId: farmId };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  }, [user]);

  const addFarm = useCallback(async (name: string, location: string): Promise<Farm> => {
    if (!user) throw new Error("Not authenticated");
    const token = user.token;

    const res = await axios.post(
      "https://dancan.alwaysdata.net/api/farms",
      { name, location },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const newFarm: Farm = res.data;
    setFarms((prev) => [...prev, newFarm]);
    localStorage.setItem(FARMS_KEY, JSON.stringify([...farms, newFarm]));
    return newFarm;
  }, [user, farms]);

  const currentFarm = farms.find((f) => f.id === user?.currentFarmId) || farms[0] || null;

  return (
    <AuthContext.Provider value={{ user, farms, currentFarm, isLoading, login, signup, logout, setCurrentFarm, addFarm }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}