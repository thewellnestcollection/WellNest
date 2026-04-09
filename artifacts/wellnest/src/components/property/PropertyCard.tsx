import { Property } from "@workspace/api-client-react/src/generated/api.schemas";
import { Link } from "wouter";
import { MapPin, Users } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  showCategory?: boolean;
}

export function PropertyCard({ property, showCategory }: PropertyCardProps) {
  const mainImage = property.images?.[0] || "/images/property-placeholder.png";

  return (
    <Link href={`/properties/${property.id}`} className="group block h-full">
      <div className="relative aspect-[4/3] overflow-hidden mb-4 bg-muted">
        <img
          src={mainImage}
          alt={property.name}
          className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/10 transition-opacity duration-300 group-hover:opacity-0" />
      </div>
      <div className="space-y-1.5">
        {showCategory && (
          <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-medium">
            {property.category}
          </p>
        )}
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-serif text-xl font-medium leading-snug group-hover:text-primary transition-colors line-clamp-1">
            {property.name}
          </h3>
          <p className="font-sans text-sm font-medium whitespace-nowrap">
            &pound;{property.nightlyPrice}{" "}
            <span className="text-muted-foreground font-normal">/nt</span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{property.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Up to {property.guests}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
