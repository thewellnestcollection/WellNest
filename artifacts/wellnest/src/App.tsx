import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Home } from "@/pages/Home";
import { Collection } from "@/pages/Collection";
import { PropertyDetails } from "@/pages/PropertyDetails";
import { AdminLogin } from "@/pages/AdminLogin";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { Finder } from "@/pages/Finder";
import { useAdminMe } from "@workspace/api-client-react";

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: adminSession, isLoading } = useAdminMe();

  useEffect(() => {
    if (!isLoading && !adminSession?.authenticated) {
      setLocation("/admin");
    }
  }, [isLoading, adminSession, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminSession?.authenticated) {
    return null;
  }

  return <>{children}</>;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

const queryClient = new QueryClient();

function LayoutWrapper({ children, hideHeaderFooter = false }: { children: React.ReactNode, hideHeaderFooter?: boolean }) {
  return (
    <div className="min-h-[100dvh] flex flex-col font-sans">
      {!hideHeaderFooter && <Navbar />}
      <div className="flex-1 flex flex-col">{children}</div>
      {!hideHeaderFooter && <Footer />}
    </div>
  );
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Switch>
      <Route path="/">
        <LayoutWrapper><Home /></LayoutWrapper>
      </Route>
      <Route path="/collection">
        <LayoutWrapper><Collection /></LayoutWrapper>
      </Route>
      <Route path="/finder">
        <LayoutWrapper><Finder /></LayoutWrapper>
      </Route>
      <Route path="/properties/:id">
        <LayoutWrapper><PropertyDetails /></LayoutWrapper>
      </Route>
      <Route path="/admin">
        <LayoutWrapper hideHeaderFooter><AdminLogin /></LayoutWrapper>
      </Route>
      <Route path="/admin/dashboard">
        <LayoutWrapper>
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        </LayoutWrapper>
      </Route>
      <Route>
        <LayoutWrapper><NotFound /></LayoutWrapper>
      </Route>
    </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="">
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
