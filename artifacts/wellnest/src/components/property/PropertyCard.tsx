import { Link } from "wouter";
import { MapPin, Users, Star } from "lucide-react";

interface Property {
  id: number;
  name: string;
  category: string;
  location: string;
  nightlyPrice: number;
  guests: number;
  facilities: string[];
  contactEmail: string;
  websiteUrl: string | null;
  instagramHandle: string | null;
  images: string[];
  description: string | null;
  featured: boolean;
  pickYear?: number | null;
  [key: string]: unknown;
}

interface PropertyCardProps {
  property: Property;
  showCategory?: boolean;
  showSeasonBadge?: boolean;
}

export function PropertyCard({ property, showCategory, showSeasonBadge }: PropertyCardProps) {
  const mainImage = property.images?.[0]
    ? property.images[0].startsWith("http")
      ? property.images[0]
      : `https://workspaceapi-server-production-3677.up.railway.app${property.images[0]}`
    : "/images/property-placeholder.png";

  const isPick =
    property.category === "Pick of the Season" ||
    property.category === "Pick of the Month";

  const pickSeason = property.pickSeason as string | null | undefined;
  const pickYear = property.pickYear as number | null | undefined;

  const seasonBadgeText =
    showSeasonBadge && pickSeason && pickYear
      ? `${pickSeason} ${pickYear}`
      : null;

  return (
    <Link href={`/properties/${property.id}`} className="group block h-full">
      <div className={`relative aspect-[4/3] overflow-hidden mb-4 bg-muted ${isPick ? "ring-2 ring-amber-700/35 ring-offset-2" : ""}`}>
        <img src={mainImage} alt={property.name} className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
        {isPick && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-900/90 backdrop-blur-sm px-3 py-2 text-[9px] font-semibold tracking-[0.18em] uppercase text-amber-100">
            <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
            Pick of the Season
          </div>
        )}
        {seasonBadgeText && (
          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium tracking-widest uppercase text-foreground">
            {seasonBadgeText}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        {showCategory && !isPick && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">{property.category}</p>
        )}
        {showCategory && isPick && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-semibold">Pick of the Season</p>
        )}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-xl font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">{property.name}</h3>
          <div className="text-right whitespace-nowrap shrink-0">
            <div className="text-xs text-muted-foreground font-normal">From</div>
            <div className="font-sans text-sm font-medium">&pound;{property.nightlyPrice} <span className="text-muted-foreground font-normal">/nt</span></div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Users className="w-3.5 h-3.5" />
            <span>Up to {property.guests}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
