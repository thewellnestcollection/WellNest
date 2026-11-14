import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { NewsletterModal } from "@/components/NewsletterModal";

type SeasonName = "winter" | "spring" | "summer" | "autumn";

interface SeasonOption {
  season: SeasonName;
  year: number;
  label: string;
  sortKey: number;
}

interface AvailableSeasonsResponse {
  seasons: SeasonOption[];
}

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
  pickSeason: string | null;
  pickYear: number | null;
  createdAt: string;
  updatedAt: string;
}

const SEASON_ICONS: Record<SeasonName, string> = {
  winter: "❄",
  spring: "✿",
  summer: "☀",
  autumn: "🍂",
};

async function fetchAvailableSeasons(): Promise<AvailableSeasonsResponse> {
  const res = await fetch("/api/properties/available-seasons");
  if (!res.ok) throw new Error("Failed to load seasons");
  return res.json();
}

async function fetchSeasonalPicks(season: SeasonName, year: number): Promise<Property[]> {
  const res = await fetch(`/api/properties/seasonal?season=${season}&year=${year}`);
  if (!res.ok) throw new Error("Failed to load picks");
  return res.json();
}

function getCurrentSeason(): { season: SeasonName; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month >= 3 && month <= 5) return { season: "spring", year };
  if (month >= 6 && month <= 8) return { season: "summer", year };
  if (month >= 9 && month <= 11) return { season: "autumn", year };
  return { season: "winter", year: month === 12 ? year + 1 : year };
}

export function Home() {
  const picksRef = useRef<HTMLElement>(null);
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  const { data: seasonsData, isLoading: seasonsLoading } = useQuery({
    queryKey: ["available-seasons"],
    queryFn: fetchAvailableSeasons,
    staleTime: 5 * 60_000,
  });

  const seasons = seasonsData?.seasons ?? [];

  const fallback = getCurrentSeason();
  const [selectedSeason, setSelectedSeason] = useState<SeasonName>(fallback.season);
  const [selectedYear, setSelectedYear] = useState<number>(fallback.year);

  useEffect(() => {
    if (seasons.length === 0) return;
    const match = seasons.find(
      (s) => s.season === selectedSeason && s.year === selectedYear
    );
    if (!match) {
      const last = seasons[seasons.length - 1];
      setSelectedSeason(last.season as SeasonName);
      setSelectedYear(last.year);
    }
  }, [seasons.map((s) => s.season + s.year).join(",")]);

  const { data: picks, isLoading: picksLoading } = useQuery({
    queryKey: ["seasonal-picks", selectedSeason, selectedYear],
    queryFn: () => fetchSeasonalPicks(selectedSeason, selectedYear),
    staleTime: 60_000,
    enabled: !!selectedSeason && !!selectedYear,
  });

  const selectedLabel =
    seasons.find((s) => s.season === selectedSeason && s.year === selectedYear)?.label ??
    `${selectedSeason.charAt(0).toUpperCase() + selectedSeason.slice(1)} ${selectedYear}`;

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[580px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-bg.png" alt="UK countryside" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-7">
          <p className="text-white/70 uppercase tracking-[0.4em] text-xs font-medium">
            The WellNest Collection
          </p>
          <h1 className="text-5xl md:text-[4.5rem] font-serif text-white leading-[1.1] drop-shadow-md">
            Handpicked wellness stays across the UK
          </h1>
          <p className="text-lg md:text-xl text-white/80 font-light max-w-xl mx-auto leading-relaxed">
            Each season we curate one extraordinary retreat per category — chosen for those who value rest and renewal.
          </p>
          <div className="pt-2 flex flex-col items-center gap-2">
            <button
              onClick={() => setNewsletterOpen(true)}
              className="bg-white text-foreground hover:bg-white/90 transition-colors px-10 py-3 text-xs tracking-widest uppercase font-medium"
            >
              Join The WellNest Collection
            </button>
            <p className="text-white/65 text-xs font-bold tracking-wide">
              Subscribe to our free seasonal newsletter
            </p>
          </div>
        </div>
      </section>

      {/* Seasonal Picks */}
      <section ref={picksRef} className="py-16 md:py-24 container mx-auto px-4 md:px-6">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Seasonal Selection</p>
          <h2 className="text-3xl md:text-4xl font-serif">{selectedLabel}</h2>
        </div>

        {seasonsLoading ? (
          <div className="flex gap-2 mb-12">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-28" />)}
          </div>
        ) : (
          <div className="flex gap-1.5 flex-wrap mb-12">
            {seasons.map((s) => {
              const isActive = s.season === selectedSeason && s.year === selectedYear;
              return (
                <button
                  key={`${s.season}-${s.year}`}
                  onClick={() => {
                    setSelectedSeason(s.season as SeasonName);
                    setSelectedYear(s.year);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 text-xs font-medium border transition-all duration-150 ${
                    isActive
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  <span
                    className="text-sm leading-none"
                    style={s.season === "autumn" ? { filter: "grayscale(1) opacity(0.65)" } : undefined}
                  >
                    {SEASON_ICONS[s.season as SeasonName]}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {picksLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[4/3] w-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !picks || picks.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border">
            <p className="font-serif text-2xl text-muted-foreground/60 mb-3">Nothing curated yet</p>
            <p className="text-sm text-muted-foreground">No picks have been selected for {selectedLabel}.</p>
          </div>
        ) : (
          <>
            {groupBySeason(picks).map(({ label: groupLabel, properties }, groupIndex, arr) => (
              <div key={groupLabel || "season"} className="mb-16">
                {groupLabel && (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6 pb-2 border-b border-border/50">
                    {groupLabel}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                  {[...properties]
                    .sort((a, b) =>
                      a.category === "Pick of the Season" || a.category === "Pick of the Month" ? -1
                      : b.category === "Pick of the Season" || b.category === "Pick of the Month" ? 1
                      : 0
                    )
                    .map((property) => (
                      <PropertyCard key={property.id} property={property} showCategory showSeasonBadge />
                    ))}
                  {groupIndex === arr.length - 1 && (
                    <button
                      onClick={() => setNewsletterOpen(true)}
                      className="group text-left flex flex-col justify-between bg-[#7a7060] text-white rounded-none p-8 min-h-[280px] hover:bg-[#857a6a] transition-colors"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4">The WellNest Collection</p>
                        <h3 className="font-serif text-2xl leading-snug mb-3">Be first to discover next season's pick</h3>
                        <p className="text-sm text-white/65 font-light leading-relaxed">
                          Join our free seasonal newsletter and we'll deliver the new collection straight to your inbox.
                        </p>
                      </div>
                      <span className="mt-6 inline-block text-xs uppercase tracking-widest border-b border-white/40 pb-0.5 group-hover:border-white transition-colors">
                        Subscribe free →
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </section>

      {/* Finder CTA */}
      <section className="py-20 bg-[#f5f0eb] border-t border-border">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">WellNest Finder</p>
          <h2 className="font-serif text-3xl md:text-4xl mb-4">Not sure where to start?</h2>
          <p className="text-muted-foreground font-light leading-relaxed mb-8">
            Answer five quick questions and we'll match you with the properties in our collection that fit your style, setting and budget.
          </p>
          <Link href="/finder">
            <Button className="rounded-none bg-foreground text-background hover:bg-foreground/85 h-12 px-8 uppercase text-xs tracking-widest font-medium">
              Find my perfect stay →
            </Button>
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="py-24 bg-white border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[3/4] md:aspect-square bg-muted overflow-hidden">
              <img src="/images/editorial-img.png" alt="A welcoming interior" className="object-cover w-full h-full" />
            </div>
            <div className="space-y-6 md:pl-12 lg:pl-20">
              <div className="space-y-1 pb-4 border-b border-border">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-serif text-2xl font-medium">WellNest</span>
                  <span className="text-sm text-muted-foreground font-light">(noun)</span>
                </div>
                <p className="text-sm text-muted-foreground font-light italic tracking-wide">/ˈwɛlnəst/</p>
                <p className="text-lg text-foreground font-light leading-relaxed pt-2">Wellness stays, redefined. A place to pause.</p>
              </div>
              <p className="text-base text-muted-foreground font-light leading-relaxed">
                We believe that where you stay matters. It's not just a bed for the night — it's the backdrop to your memories. The WellNest Collection brings together the most thoughtfully designed spaces across the United Kingdom.
              </p>
              <p className="text-base text-muted-foreground font-light leading-relaxed">
                Each season we select one standout property in each of our seven categories — from working farms to grand estate manors — so you always know where to go next.
              </p>
              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => setNewsletterOpen(true)}
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 uppercase text-xs tracking-widest font-medium"
                >
                  Join The WellNest Collection
                </Button>
                <p className="text-xs text-muted-foreground font-bold">Subscribe to our free seasonal newsletter</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </main>
  );
}

function groupBySeason(properties: Property[]): Array<{ label: string; properties: Property[] }> {
  if (properties.length === 0) return [];
  return [{ label: "", properties }];
}
