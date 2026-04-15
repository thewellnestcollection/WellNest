import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useListProperties, useGetPropertyCategories } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CategoryFilter } from "@/components/property/CategoryFilter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SortOption = "default" | "category-asc" | "month-desc" | "month-asc" | "price-asc" | "price-desc";

export function Collection() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || undefined;
  
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Sync URL params to state on mount/location change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCategory(params.get("category") || undefined);
  }, [location]);

  const { data: categories = [] } = useGetPropertyCategories();
  
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
      case "month-desc":
        return arr.sort((a, b) => {
          const aVal = (a.pickYear ?? 0) * 12 + (a.pickMonth ?? 0);
          const bVal = (b.pickYear ?? 0) * 12 + (b.pickMonth ?? 0);
          return bVal - aVal;
        });
      case "month-asc":
        return arr.sort((a, b) => {
          const aVal = (a.pickYear ?? 0) * 12 + (a.pickMonth ?? 0);
          const bVal = (b.pickYear ?? 0) * 12 + (b.pickMonth ?? 0);
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
            Monthly handpicked wellness stays across the UK
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-40 z-40 bg-background/95 backdrop-blur-sm border-b py-4 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <CategoryFilter 
            categories={categories} 
            activeCategory={category} 
            onSelectCategory={handleCategoryChange} 
          />
        </div>
      </div>

      {/* Grid */}
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
                Showing {sortedProperties.length} {sortedProperties.length === 1 ? 'property' : 'properties'}
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
                        <SelectItem value="month-desc">Month (Newest first)</SelectItem>
                        <SelectItem value="month-asc">Month (Oldest first)</SelectItem>
                        <SelectItem value="price-asc">Price (Low to high)</SelectItem>
                        <SelectItem value="price-desc">Price (High to low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {sortedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} showCategory showMonthBadge />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
