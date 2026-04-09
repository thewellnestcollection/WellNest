import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Home } from "@/pages/Home";
import { Collection } from "@/pages/Collection";
import { PropertyDetails } from "@/pages/PropertyDetails";
import { AdminLogin } from "@/pages/AdminLogin";
import { AdminDashboard } from "@/pages/AdminDashboard";

const queryClient = new QueryClient();

// Wrapper to hide Navbar/Footer on certain routes
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
    <Switch>
      <Route path="/">
        <LayoutWrapper><Home /></LayoutWrapper>
      </Route>
      <Route path="/collection">
        <LayoutWrapper><Collection /></LayoutWrapper>
      </Route>
      <Route path="/properties/:id">
        <LayoutWrapper><PropertyDetails /></LayoutWrapper>
      </Route>
      <Route path="/admin">
        <LayoutWrapper hideHeaderFooter><AdminLogin /></LayoutWrapper>
      </Route>
      <Route path="/admin/dashboard">
        <LayoutWrapper><AdminDashboard /></LayoutWrapper>
      </Route>
      <Route>
        <LayoutWrapper><NotFound /></LayoutWrapper>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
