// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";

export type UserRole = "owner" | "manager" | "worker";

export interface User {
  id: number | string;
  email: string;
  name?: string;
  role?: UserRole;
  token: string;
  currentFarmId?: string | null;
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

const USER_KEY = "user";
const TOKEN_KEY = "token";
const FARMS_KEY = "lms_farms";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // -------------------- Load from localStorage on mount --------------------
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    const storedFarms = localStorage.getItem(FARMS_KEY);

    if (token) {
      (async () => {
        try {
          // Fetch latest user from backend
          const res = await axios.get("https://dancan.alwaysdata.net/api/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const freshUser: User = { ...res.data, token };
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        } catch {
          logout(); // token invalid, logout
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      if (storedUser) setUser(JSON.parse(storedUser));
      setIsLoading(false);
    }

    if (storedFarms) setFarms(JSON.parse(storedFarms));
  }, []);

  // -------------------- Login --------------------
  const login = useCallback(async (email: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      // Sign in
      const res = await axios.post("https://dancan.alwaysdata.net/api/signin", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { token } = res.data;

      // Fetch full user
      const userRes = await axios.get("https://dancan.alwaysdata.net/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullUser: User = { ...userRes.data, token };

      setUser(fullUser);
      localStorage.setItem(USER_KEY, JSON.stringify(fullUser));
      localStorage.setItem(TOKEN_KEY, token);

      // Fetch farms
      try {
        const farmsRes = await axios.get("https://dancan.alwaysdata.net/api/farms", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedFarms: Farm[] = farmsRes.data || [];
        setFarms(fetchedFarms);
        localStorage.setItem(FARMS_KEY, JSON.stringify(fetchedFarms));
      } catch {
        setFarms([]);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Login failed";
      throw new Error(message);
    }
  }, []);

  // -------------------- Signup --------------------
  const signup = useCallback(
    async (email: string, password: string, name: string, role: UserRole) => {
      try {
        const res = await axios.post("https://dancan.alwaysdata.net/api/signup", {
          email,
          password,
          name,
          role,
        });

        const { token } = res.data;

        // Fetch full user after signup
        const userRes = await axios.get("https://dancan.alwaysdata.net/api/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newUser: User = { ...userRes.data, token };

        setUser(newUser);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        localStorage.setItem(TOKEN_KEY, token);

        setFarms([]);
        localStorage.removeItem(FARMS_KEY);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || "Signup failed";
        throw new Error(message);
      }
    },
    []
  );

  // -------------------- Logout --------------------
  const logout = useCallback(() => {
    setUser(null);
    setFarms([]);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(FARMS_KEY);
  }, []);

  // -------------------- Set Current Farm --------------------
  const setCurrentFarm = useCallback(
    (farmId: string) => {
      if (!user) return;
      const updatedUser = { ...user, currentFarmId: farmId };
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    },
    [user]
  );

  // -------------------- Add Farm --------------------
  const addFarm = useCallback(
    async (name: string, location: string): Promise<Farm> => {
      if (!user) throw new Error("Not authenticated");

      const res = await axios.post(
        "https://dancan.alwaysdata.net/api/farms",
        { name, location },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      const newFarm: Farm = res.data;
      setFarms((prev) => {
        const updated = [...prev, newFarm];
        localStorage.setItem(FARMS_KEY, JSON.stringify(updated));
        return updated;
      });

      return newFarm;
    },
    [user]
  );

  // -------------------- Current Farm --------------------
  const currentFarm = useMemo(() => {
    if (!user) return null;

    // Try to find farm by currentFarmId
    let farm = farms.find((f) => f.id === user.currentFarmId);

    // If none selected, default to first farm
    if (!farm && farms.length > 0) {
      farm = farms[0];
      setCurrentFarm(farm.id); // persist choice
    }

    return farm || null;
  }, [farms, user, setCurrentFarm]);

  return (
    <AuthContext.Provider
      value={{
        user,
        farms,
        currentFarm,
        isLoading,
        login,
        signup,
        logout,
        setCurrentFarm,
        addFarm,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// -------------------- Hook --------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}