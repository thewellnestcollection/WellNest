import { Link, useLocation } from "wouter";
import logoUrl from "@assets/logo_transparent.png";
import { useAdminMe, useAdminLogout } from "@workspace/api-client-react";
import { getAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();
  const { data: adminSession } = useAdminMe();
  const logout = useAdminLogout();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() });
      }
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <img src={logoUrl} alt="The WellNest Collection" className="h-16 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          <Link href="/" className={`transition-colors hover:text-primary ${location === '/' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Home
          </Link>
          <Link href="/collection" className={`transition-colors hover:text-primary ${location === '/collection' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Collection
          </Link>
          {adminSession?.authenticated && (
            <Link href="/admin/dashboard" className={`transition-colors hover:text-primary ${location.startsWith('/admin') ? 'text-foreground' : 'text-muted-foreground'}`}>
              Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {adminSession?.authenticated ? (
             <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex font-serif italic text-muted-foreground hover:text-foreground">
               Sign Out
             </Button>
          ) : (
            <Link href="/collection" className="hidden md:flex text-sm font-serif italic text-muted-foreground hover:text-primary transition-colors">
              Find your escape &rarr;
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
