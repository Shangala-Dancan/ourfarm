import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { HerdProvider } from "@/contexts/HerdContext";
import { MilkProvider } from "@/contexts/MilkContext";
import { PastureProvider } from "@/contexts/PastureContext";
import { MovementProvider } from "@/contexts/MovementContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Herd from "./pages/Herd";
import MilkProduction from "./pages/MilkProduction";
import Pastures from "./pages/Pastures";
import Movements from "./pages/Movements";
import Finances from "./pages/Finances";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <HerdProvider>
            <MilkProvider>
              <PastureProvider>
                <MovementProvider>
                  <FinanceProvider>
                    <Routes>
                      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                       
                      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                       <Route path="/" element={<Dashboard />} />
                        <Route path="/herd" element={<Herd />} />
                        <Route path="/milk" element={<MilkProduction />} />
                        <Route path="/pastures" element={<Pastures />} />
                        <Route path="/movements" element={<Movements />} />
                        <Route path="/finances" element={<Finances />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </FinanceProvider>
                </MovementProvider>
              </PastureProvider>
            </MilkProvider>
          </HerdProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
