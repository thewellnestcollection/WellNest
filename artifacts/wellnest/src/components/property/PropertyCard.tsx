import { Property } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { MapPin, Users, Star } from "lucide-react";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface PropertyCardProps {
  property: Property;
  showCategory?: boolean;
  showMonthBadge?: boolean;
}

export function PropertyCard({ property, showCategory, showMonthBadge }: PropertyCardProps) {
  const mainImage = property.images?.[0] 
  ? `${import.meta.env.VITE_API_URL}${property.images[0]}`
  : "/images/property-placeholder.png";
  const isPick = property.category === "Pick of the Month";

  const monthBadgeText =
    showMonthBadge && property.pickMonth && property.pickYear
      ? `${MONTH_SHORT[(property.pickMonth as number) - 1]} ${property.pickYear}`
      : null;

  return (
    <Link href={`/properties/${property.id}`} className="group block h-full">
      <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-muted">
        <img
          src={mainImage}
          alt={property.name}
          className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />

        {isPick && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-900/90 backdrop-blur-sm px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.18em] uppercase text-amber-100">
            <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
            Pick of the Month
          </div>
        )}

        {monthBadgeText && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium tracking-widest uppercase text-foreground">
            {monthBadgeText}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        {showCategory && !isPick && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
            {property.category}
          </p>
        )}
        {showCategory && isPick && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-700 font-semibold">
            Pick of the Month
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-xl font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {property.name}
          </h3>
          <div className="text-right whitespace-nowrap shrink-0">
            <div className="text-xs text-muted-foreground font-normal">From</div>
            <div className="font-sans text-sm font-medium">&pound;{property.nightlyPrice}{" "}<span className="text-muted-foreground font-normal">/nt</span></div>
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
