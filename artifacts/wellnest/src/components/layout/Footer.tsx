import { Link } from "wouter";
import logoUrl from "@assets/logo_transparent.png";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-white py-16 mt-24">
      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center justify-center space-y-8">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <img src={logoUrl} alt="The WellNest Collection" className="h-32 w-auto opacity-90" />
        </Link>
        <p className="text-center text-sm text-muted-foreground max-w-md font-serif italic">
          A curated collection of unique stays across the UK. Discover spaces that restore and inspire.
        </p>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/thewellnestcollection"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          aria-label="Follow us on Instagram"
        >
          <InstagramIcon className="w-5 h-5" />
          <span className="text-sm tracking-wide">@thewellnestcollection</span>
        </a>

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
