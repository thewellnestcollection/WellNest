import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListProperties, useGetPropertyCategories } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CategoryFilter } from "@/components/property/CategoryFilter";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";

export function Collection() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category") || undefined;
  
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
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
    // Update URL without full navigation if possible, or just push state
    const url = new URL(window.location.href);
    if (newCategory) {
      url.searchParams.set("category", newCategory);
    } else {
      url.searchParams.delete("category");
    }
    window.history.pushState({}, "", url.toString());
  };

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

      {/* Filters & Search */}
      <div className="sticky top-24 z-40 bg-background/95 backdrop-blur-sm border-b py-4 shadow-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-auto overflow-hidden">
              <CategoryFilter 
                categories={categories} 
                activeCategory={category} 
                onSelectCategory={handleCategoryChange} 
              />
            </div>
            
            <div className="relative w-full md:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or location..."
                className="pl-9 bg-white border-muted-foreground/20 rounded-none focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
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
            <div className="mb-8 text-sm text-muted-foreground uppercase tracking-wider font-medium">
              Showing {properties?.length} {properties?.length === 1 ? 'property' : 'properties'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {properties?.map((property) => (
                <PropertyCard key={property.id} property={property} showCategory showMonthBadge />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
