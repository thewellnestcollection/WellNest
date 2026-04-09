import { Link } from "wouter";
import logoUrl from "@assets/logo_1775747549788.png";

export function Footer() {
  return (
    <footer className="border-t bg-white py-16 mt-24">
      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center space-y-8">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <img src={logoUrl} alt="The WellNest Collection" className="h-10 w-auto opacity-70 grayscale" />
        </Link>
        <p className="text-center text-sm text-muted-foreground max-w-md font-serif italic">
          A curated collection of unique stays across the UK. Discover spaces that restore and inspire.
        </p>
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <Link href="/collection" className="hover:text-primary transition-colors">All Properties</Link>
          <Link href="/admin" className="hover:text-primary transition-colors">Admin</Link>
        </div>
        <p className="text-xs text-muted-foreground/60 mt-8">
          &copy; {new Date().getFullYear()} The WellNest Collection. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
