import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useListProperties, useGetPropertyCategories } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CategoryFilter } from "@/components/property/CategoryFilter";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Map } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "default" | "category-asc" | "season-desc" | "season-asc" | "price-asc" | "price-desc";
type ViewMode = "grid" | "map";

const SEASON_ORDER: Record<string, number> = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Autumn: 3,
};

export function Collection() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || undefined;

  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Sync URL params to state on mount/location change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get("category") || undefined);
  }, [location]);

  const { data: categories = [] } = useGetPropertyCategories();

  // Pin "Pick of the Season" immediately after "All Stays"
  const orderedCategories = useMemo(() => {
    const picks = categories.filter((c) => c === "Pick of the Season");
    const rest = categories.filter((c) => c !== "Pick of the Season");
    return [...picks, ...rest];
  }, [categories]);

  const { data: properties, isLoading } = useListProperties({
    category,
    search: debouncedSearch || undefined,
  });

  const handleCategoryChange = (newCategory?: string) => {
    setCategory(newCategory);
    const url = new URL(window.location.href);
    if (newCategory) {
      url.searchParams.set("category", newCategory);
    } else {
      url.searchParams.delete("category");
    }
    window.history.pushState({}, "", url.toString());
  };

  const sortedProperties = useMemo(() => {
    if (!properties) return [];
    const arr = [...properties];
    switch (sortOption) {
      case "category-asc":
        return arr.sort((a, b) => a.category.localeCompare(b.category));
      case "season-desc":
        return arr.sort((a, b) => {
          const aSeason = (a as any).pickSeason ?? "";
          const bSeason = (b as any).pickSeason ?? "";
          const aVal = (a.pickYear ?? 0) * 10 + (SEASON_ORDER[aSeason] ?? 99);
          const bVal = (b.pickYear ?? 0) * 10 + (SEASON_ORDER[bSeason] ?? 99);
          return bVal - aVal;
        });
      case "season-asc":
        return arr.sort((a, b) => {
          const aSeason = (a as any).pickSeason ?? "";
          const bSeason = (b as any).pickSeason ?? "";
          const aVal = (a.pickYear ?? 0) * 10 + (SEASON_ORDER[aSeason] ?? 99);
          const bVal = (b.pickYear ?? 0) * 10 + (SEASON_ORDER[bSeason] ?? 99);
          return aVal - bVal;
        });
      case "price-asc":
        return arr.sort((a, b) => Number(a.nightlyPrice) - Number(b.nightlyPrice));
      case "price-desc":
        return arr.sort((a, b) => Number(b.nightlyPrice) - Number(a.nightlyPrice));
      default:
        return arr;
    }
  }, [properties, sortOption]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-white border-b py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif">The Collection</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-light">
            Browse our complete portfolio of distinctive stays. Use the filters below to find exactly what you're looking for.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-40 z-40 bg-background/95 backdrop-blur-sm border-b py-4 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <CategoryFilter
            categories={orderedCategories}
            activeCategory={category}
            onSelectCategory={handleCategoryChange}
          />
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : properties?.length === 0 ? (
          <div className="text-center py-32 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-serif">No properties found</h3>
            <p className="text-muted-foreground font-light max-w-md mx-auto">
              We couldn't find any stays matching your current filters. Try adjusting your search or clearing the category filter.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground uppercase tracking-wider font-medium shrink-0">
                Showing {sortedProperties.length} {sortedProperties.length === 1 ? "property" : "properties"}
              </span>
              <div className="flex items-center gap-3">
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by name or location..."
                    className="pl-9 bg-white border-muted-foreground/20 rounded-none focus-visible:ring-primary h-9 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {!category && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground uppercase tracking-widest whitespace-nowrap hidden sm:block">Sort by</span>
                    <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                      <SelectTrigger className="w-48 rounded-none border-muted-foreground/20 bg-white text-sm h-9">
                        <SelectValue placeholder="Default" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="category-asc">Category (A–Z)</SelectItem>
                        <SelectItem value="season-desc">Season (Newest first)</SelectItem>
                        <SelectItem value="season-asc">Season (Oldest first)</SelectItem>
                        <SelectItem value="price-asc">Price (Low to high)</SelectItem>
                        <SelectItem value="price-desc">Price (High to low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Grid / Map toggle */}
                <div className="flex border border-border shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                    className={`flex items-center px-3 h-9 transition-colors ${
                      viewMode === "grid"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    title="Map view"
                    className={`flex items-center px-3 h-9 transition-colors ${
                      viewMode === "map"
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                {sortedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} showCategory showSeasonBadge />
                ))}
              </div>
            ) : (
              <MapView properties={sortedProperties as any[]} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Map View ─────────────────────────────────────────────────────────────────

interface MapProperty {
  id: number;
  name: string;
  category: string;
  location: string;
  nightlyPrice: number;
  images?: string[];
  websiteUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

function MapView({ properties }: { properties: MapProperty[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const [selectedProperty, setSelectedProperty] = useState<MapProperty | null>(null);

  const mappable = properties.filter(
    (p) => p.latitude != null && p.longitude != null
  );

  const propertyKey = properties.map((p) => p.id).join(",");

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamically import Leaflet to avoid SSR/vite icon issues
    import("leaflet").then((L) => {
      // Leaflet CSS must be loaded too
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      if (!document.head.querySelector('link[href*="leaflet"]')) {
        document.head.appendChild(link);
      }

      // Destroy existing map before re-mounting
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapRef.current!, {
        center: [54.0, -2.5],
        zoom: 6,
      });
      leafletMapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Brand-coloured custom pin (no broken image issue)
      const pinIcon = L.divIcon({
        className: "",
        html: `<div style="width:14px;height:14px;background:#2d5a27;border:2.5px solid #fff;border-radius:50%;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const latlngs: [number, number][] = [];

      mappable.forEach((p) => {
        const lat = typeof p.latitude === "string" ? parseFloat(p.latitude) : (p.latitude as number);
        const lng = typeof p.longitude === "string" ? parseFloat(p.longitude) : (p.longitude as number);
        if (isNaN(lat) || isNaN(lng)) return;

        latlngs.push([lat, lng]);
        const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        marker.on("click", () => setSelectedProperty(p));
      });

      if (latlngs.length > 0) {
        map.fitBounds(latlngs, { padding: [40, 40], maxZoom: 12 });
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyKey]);

  const unmapped = properties.length - mappable.length;

  return (
    <div className="space-y-3">
      {unmapped > 0 && (
        <p className="text-xs text-muted-foreground">
          {mappable.length} of {properties.length} properties have map coordinates.{" "}
          <span className="italic">Add coordinates via the admin dashboard to show the rest.</span>
        </p>
      )}

      <div className="relative">
        <div ref={mapRef} className="w-full rounded-none border border-border" style={{ height: 580 }} />

        {/* Property popup */}
        {selectedProperty && (
          <div className="absolute bottom-4 left-4 w-72 bg-white border border-border shadow-xl z-[1000]">
            <button
              className="absolute top-2 right-2.5 text-muted-foreground hover:text-foreground text-xl leading-none z-10"
              onClick={() => setSelectedProperty(null)}
              aria-label="Close"
            >
              ×
            </button>
            {selectedProperty.images?.[0] && (
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
                {selectedProperty.category}
              </p>
              <h3 className="font-serif text-lg leading-tight mb-1">
                {selectedProperty.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedProperty.location}
              </p>
              <p className="text-sm font-medium">
                From £{Number(selectedProperty.nightlyPrice).toLocaleString()}
                <span className="text-muted-foreground font-normal">/night</span>
              </p>
              {selectedProperty.websiteUrl && (
                <a
                  href={selectedProperty.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs uppercase tracking-widest border-b border-foreground hover:border-foreground/50 transition-colors"
                >
                  Visit website →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
