import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type UserRole = "owner" | "manager" | "worker";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  currentFarmId: string | null;
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
  addFarm: (name: string, location: string) => Farm;
}

const AuthContext = createContext<AuthContextType | null>(null);

const USERS_KEY = "lms_users";
const SESSION_KEY = "lms_session";
const FARMS_KEY = "lms_farms";
const FARM_MEMBERS_KEY = "lms_farm_members";

function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return crypto.randomUUID();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getStored<User | null>(SESSION_KEY, null);
    if (session) {
      setUser(session);
      const allFarms = getStored<Farm[]>(FARMS_KEY, []);
      const members = getStored<{ userId: string; farmId: string }[]>(FARM_MEMBERS_KEY, []);
      const userFarmIds = members.filter((m) => m.userId === session.id).map((m) => m.farmId);
      setFarms(allFarms.filter((f) => userFarmIds.includes(f.id)));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const users = getStored<(User & { password: string })[]>(USERS_KEY, []);
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) throw new Error("Invalid email or password");
    const { password: _, ...userData } = found;
    setUser(userData);
    setStored(SESSION_KEY, userData);

    const allFarms = getStored<Farm[]>(FARMS_KEY, []);
    const members = getStored<{ userId: string; farmId: string }[]>(FARM_MEMBERS_KEY, []);
    const userFarmIds = members.filter((m) => m.userId === userData.id).map((m) => m.farmId);
    setFarms(allFarms.filter((f) => userFarmIds.includes(f.id)));
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    const users = getStored<(User & { password: string })[]>(USERS_KEY, []);
    if (users.some((u) => u.email === email)) throw new Error("Email already exists");

    const id = generateId();
    const newUser = { id, email, name, role, currentFarmId: null, password };
    users.push(newUser);
    setStored(USERS_KEY, users);

    if (role === "owner") {
      const farm: Farm = { id: generateId(), name: `${name}'s Farm`, location: "", ownerId: id };
      const allFarms = getStored<Farm[]>(FARMS_KEY, []);
      allFarms.push(farm);
      setStored(FARMS_KEY, allFarms);

      const members = getStored<{ userId: string; farmId: string }[]>(FARM_MEMBERS_KEY, []);
      members.push({ userId: id, farmId: farm.id });
      setStored(FARM_MEMBERS_KEY, members);

      const userData: User = { id, email, name, role, currentFarmId: farm.id };
      setUser(userData);
      setStored(SESSION_KEY, userData);
      setFarms([farm]);
    } else {
      const userData: User = { id, email, name, role, currentFarmId: null };
      setUser(userData);
      setStored(SESSION_KEY, userData);
      setFarms([]);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setFarms([]);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const setCurrentFarm = useCallback((farmId: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, currentFarmId: farmId };
      setStored(SESSION_KEY, updated);
      return updated;
    });
  }, []);

  const addFarm = useCallback((name: string, location: string): Farm => {
    if (!user) throw new Error("Not authenticated");
    const farm: Farm = { id: generateId(), name, location, ownerId: user.id };
    const allFarms = getStored<Farm[]>(FARMS_KEY, []);
    allFarms.push(farm);
    setStored(FARMS_KEY, allFarms);

    const members = getStored<{ userId: string; farmId: string }[]>(FARM_MEMBERS_KEY, []);
    members.push({ userId: user.id, farmId: farm.id });
    setStored(FARM_MEMBERS_KEY, members);

    setFarms((prev) => [...prev, farm]);
    return farm;
  }, [user]);

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
