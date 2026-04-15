import { useState } from "react";
import { Link, useLocation } from "wouter";
import logoUrl from "@assets/logo_transparent.png";
import { useAdminMe, useAdminLogout } from "@workspace/api-client-react";
import { getAdminMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { NewsletterModal } from "@/components/NewsletterModal";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { data: adminSession } = useAdminMe();
  const logout = useAdminLogout();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getAdminMeQueryKey() });
      }
    });
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background">
        <div className="container mx-auto px-4 md:px-6 h-40 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <img src={logoUrl} alt="The WellNest Collection" className="h-36 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
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
            {/* Desktop right side */}
            {adminSession?.authenticated ? (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden md:flex font-serif italic text-muted-foreground hover:text-foreground">
                Sign Out
              </Button>
            ) : (
              <Link href="/collection" className="hidden md:flex text-sm font-serif italic text-muted-foreground hover:text-primary transition-colors">
                Find your escape &rarr;
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/40 bg-background">
            <nav className="flex flex-col divide-y divide-border/30">
              <Link
                href="/"
                onClick={closeMobile}
                className={`px-6 py-4 text-sm font-medium tracking-wide transition-colors hover:text-primary ${location === '/' ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Home
              </Link>
              <Link
                href="/collection"
                onClick={closeMobile}
                className={`px-6 py-4 text-sm font-medium tracking-wide transition-colors hover:text-primary ${location === '/collection' ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                Collection
              </Link>
              <button
                onClick={() => { closeMobile(); setNewsletterOpen(true); }}
                className="px-6 py-4 text-sm font-medium tracking-wide text-left text-muted-foreground hover:text-primary transition-colors"
              >
                Newsletter
              </button>
              {adminSession?.authenticated && (
                <Link
                  href="/admin/dashboard"
                  onClick={closeMobile}
                  className={`px-6 py-4 text-sm font-medium tracking-wide transition-colors hover:text-primary ${location.startsWith('/admin') ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </>
  );
}
