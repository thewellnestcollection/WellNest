import { useGetFeaturedProperties, useGetPropertyCategories } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CategoryFilter } from "@/components/property/CategoryFilter";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Home() {
  const [, setLocation] = useLocation();
  const { data: featuredProperties, isLoading: isPropertiesLoading } = useGetFeaturedProperties();
  const { data: categories = [], isLoading: isCategoriesLoading } = useGetPropertyCategories();

  const handleCategorySelect = (category?: string) => {
    if (category) {
      setLocation(`/collection?category=${encodeURIComponent(category)}`);
    } else {
      setLocation('/collection');
    }
  };

  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/hero-bg.png" 
            alt="Misty landscape" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight drop-shadow-md">
            A curated collection of unique stays across the UK
          </h1>
          <p className="text-lg md:text-xl text-white/90 font-light max-w-2xl mx-auto drop-shadow">
            Discover spaces designed to restore, inspire, and reconnect you with the natural world.
          </p>
          <div className="pt-8">
            <Link href="/collection">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 rounded-none px-8 font-medium h-12 text-sm tracking-wider uppercase">
                Explore the Collection
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 md:py-24 container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12 space-y-4">
          <h2 className="text-3xl font-serif">Find your escape</h2>
          <p className="text-muted-foreground font-serif italic max-w-lg">
            Whether you seek the solitude of a treehouse or the warmth of a farmhouse, find exactly what you're looking for.
          </p>
        </div>
        {isCategoriesLoading ? (
          <div className="flex space-x-4 overflow-hidden py-4 justify-center">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-full" />
            ))}
          </div>
        ) : (
          <div className="flex justify-center">
            <CategoryFilter 
              categories={categories} 
              onSelectCategory={handleCategorySelect} 
            />
          </div>
        )}
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <h2 className="text-3xl font-serif">Featured Stays</h2>
              <p className="text-muted-foreground">Handpicked properties for your next adventure.</p>
            </div>
            <Link href="/collection" className="hidden md:inline-flex items-center text-sm font-medium hover:text-primary transition-colors">
              View all &rarr;
            </Link>
          </div>

          {isPropertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredProperties?.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground font-serif italic">
              No featured properties available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {featuredProperties?.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
          
          <div className="mt-12 text-center md:hidden">
            <Link href="/collection">
              <Button variant="outline" className="w-full">View all properties</Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Editorial Block */}
      <section className="py-24 container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative aspect-[3/4] md:aspect-square bg-muted">
            <img 
              src="/images/editorial-img.png" 
              alt="Cozy interior" 
              className="object-cover w-full h-full"
            />
          </div>
          <div className="order-1 md:order-2 space-y-6 md:pl-12 lg:pl-24">
            <h2 className="text-4xl lg:text-5xl font-serif leading-tight">The art of slowing down.</h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed">
              We believe that where you stay matters. It's not just a bed for the night, but the backdrop to your memories. The WellNest Collection is a labor of love, bringing together the most thoughtfully designed spaces across the United Kingdom.
            </p>
            <p className="text-lg text-muted-foreground font-light leading-relaxed pb-6">
              From rugged coastal retreats to hidden woodland treehouses, every property in our collection has been chosen for its unique character, incredible location, and unwavering commitment to hospitality.
            </p>
            <Link href="/collection">
              <Button variant="outline" className="rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background h-12 px-8 uppercase text-xs tracking-widest font-medium">
                Our Philosophy
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
