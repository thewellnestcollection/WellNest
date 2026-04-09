import { useState } from "react";
import { useLocation } from "wouter";
import { useAdminLogin, useAdminMe } from "@workspace/api-client-react";
import { getAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@assets/logo_transparent.png";
import { Loader2 } from "lucide-react";

export function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [password, setPassword] = useState("");
  
  const { data: adminSession, isLoading: sessionLoading } = useAdminMe();
  const login = useAdminLogin();

  // Redirect if already authenticated
  if (adminSession?.authenticated && !sessionLoading) {
    setLocation("/admin/dashboard");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    login.mutate({ data: { password } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() });
        toast({
          title: "Welcome back",
          description: "You have successfully logged in to the admin panel.",
        });
        setLocation("/admin/dashboard");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Invalid password. Please try again.",
        });
        setPassword("");
      }
    });
  };

  if (sessionLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 shadow-xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <img src={logoUrl} alt="The WellNest Collection" className="h-16 w-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-serif tracking-wide">Admin Portal</h1>
            <p className="text-muted-foreground text-sm font-light">Enter your password to manage the collection.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-3">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 border-muted-foreground/30 focus-visible:ring-primary rounded-none"
              placeholder="••••••••"
              disabled={login.isPending}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none uppercase tracking-widest text-xs font-medium"
            disabled={login.isPending || !password}
          >
            {login.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
