import { useState } from "react";
import { useGetMonthlyPicks } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

interface MonthTab {
  month: number;
  year: number;
  label: string;
  shortLabel: string;
}

function generateMonthTabs(count = 18): MonthTab[] {
  const tabs: MonthTab[] = [];
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  for (let i = 0; i < count; i++) {
    tabs.push({
      month,
      year,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      shortLabel: `${MONTH_NAMES[month - 1].slice(0, 3)} ${year}`,
    });
    month--;
    if (month === 0) {
      month = 12;
      year--;
    }
  }
  return tabs;
}

const MONTH_TABS = generateMonthTabs(18);

export function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = MONTH_TABS[selectedIndex];

  const { data: monthlyPicks, isLoading } = useGetMonthlyPicks(
    { month: selected.month, year: selected.year },
    { query: { staleTime: 60_000 } }
  );

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[550px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.png"
            alt="UK countryside"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto space-y-6">
          <p className="text-white/75 uppercase tracking-[0.35em] text-xs font-medium">
            The WellNest Collection
          </p>
          <h1 className="text-5xl md:text-7xl font-serif text-white leading-tight drop-shadow-md">
            Property of<br />the Month
          </h1>
          <p className="text-lg md:text-xl text-white/85 font-light max-w-xl mx-auto drop-shadow">
            One handpicked stay per category — curated monthly across the UK.
          </p>
        </div>
      </section>

      {/* Monthly Picks Section */}
      <section className="py-16 md:py-24 container mx-auto px-4 md:px-6">

        {/* Header + arrows */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Monthly Selection
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">
              {selected.label}
            </h2>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-none w-9 h-9"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedIndex((i) => i - 1)}
              aria-label="Newer month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-none w-9 h-9"
              disabled={selectedIndex === MONTH_TABS.length - 1}
              onClick={() => setSelectedIndex((i) => i + 1)}
              aria-label="Older month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Month tab strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 mb-12 scrollbar-none">
          {MONTH_TABS.map((tab, i) => (
            <button
              key={`${tab.month}-${tab.year}`}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 px-4 py-1.5 text-xs font-medium border transition-all duration-150 ${
                i === selectedIndex
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {tab.shortLabel}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
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
        ) : !monthlyPicks || monthlyPicks.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-border">
            <p className="font-serif text-2xl text-muted-foreground/60 mb-3">
              Nothing curated yet
            </p>
            <p className="text-sm text-muted-foreground">
              No picks have been selected for {selected.label}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
            {monthlyPicks.map((property) => (
              <PropertyCard key={property.id} property={property} showCategory />
            ))}
          </div>
        )}
      </section>

      {/* Editorial / About strip */}
      <section className="py-24 bg-white border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-[3/4] md:aspect-square bg-muted overflow-hidden">
              <img
                src="/images/editorial-img.png"
                alt="A welcoming interior"
                className="object-cover w-full h-full"
              />
            </div>
            <div className="space-y-6 md:pl-12 lg:pl-24">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Our Curation</p>
              <h2 className="text-4xl lg:text-5xl font-serif leading-tight">
                The art of slowing down.
              </h2>
              <p className="text-lg text-muted-foreground font-light leading-relaxed">
                We believe that where you stay matters. It's not just a bed for the night, but the backdrop to your memories. The WellNest Collection brings together the most thoughtfully designed spaces across the United Kingdom.
              </p>
              <p className="text-base text-muted-foreground font-light leading-relaxed pb-2">
                Each month we select one standout property in each of our seven categories — from working farms to grand estate manors — so you always know where to go next.
              </p>
              <Link href="/collection">
                <Button
                  variant="outline"
                  className="rounded-none border-foreground text-foreground hover:bg-foreground hover:text-background h-12 px-8 uppercase text-xs tracking-widest font-medium"
                >
                  Browse All Stays
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
