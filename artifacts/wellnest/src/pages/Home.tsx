import { useState, useRef, useEffect } from "react";
import { useGetMonthlyPicks, useGetAvailableMonths } from "@workspace/api-client-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewsletterModal } from "@/components/NewsletterModal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const CURRENT_MONTH = NOW.getMonth() + 1;
const LAUNCH_YEAR = 2024;

const AVAILABLE_YEARS = Array.from(
  { length: CURRENT_YEAR - LAUNCH_YEAR + 1 },
  (_, i) => CURRENT_YEAR - i
);

export function Home() {
  const picksRef = useRef<HTMLElement>(null);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  const { data: availableData } = useGetAvailableMonths(
    { year: selectedYear },
    { query: { staleTime: 60_000 } }
  );

  // Months that have at least one pick, sorted descending (most recent first)
  const months: number[] = availableData?.months
    ? [...availableData.months].sort((a, b) => b - a)
    : [];

  // When the available months change (e.g. year switch), default to most recent
  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months[0]);
    }
  }, [months.join(",")]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    // selectedMonth will be corrected by the useEffect above once new months load
  };

  const { data: monthlyPicks, isLoading } = useGetMonthlyPicks(
    { month: selectedMonth, year: selectedYear },
    { query: { staleTime: 60_000 } }
  );

  const scrollToPicks = () => {
    picksRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative h-[80vh] min-h-[580px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.png"
            alt="UK countryside"
            className="w-full h-full object-cover"
          />
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
            Follow our monthly curation — one extraordinary retreat per category, chosen for those who value rest and renewal.
          </p>
          <div className="pt-2 flex flex-col items-center gap-2">
            <button
              onClick={() => setNewsletterOpen(true)}
              className="bg-white text-foreground hover:bg-white/90 transition-colors px-10 py-3 text-xs tracking-widest uppercase font-medium"
            >
              Join The WellNest Collection
            </button>
            <p className="text-white/65 text-xs font-light tracking-wide">
              Subscribe to our free monthly newsletter
            </p>
          </div>
        </div>
      </section>

      {/* Monthly Picks Section */}
      <section ref={picksRef} className="py-16 md:py-24 container mx-auto px-4 md:px-6">

        {/* Header: year on left, year dropdown on right */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Monthly Selection
            </p>
            <h2 className="text-3xl md:text-4xl font-serif">
              {selectedYear}
            </h2>
          </div>
          <div className="mt-2">
            <Select
              value={String(selectedYear)}
              onValueChange={(v) => handleYearChange(Number(v))}
            >
              <SelectTrigger className="w-28 rounded-none border-border bg-transparent text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Month tab strip — only months for the selected year */}
        <div className="flex gap-1.5 flex-wrap mb-12">
          {months.map((month) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`px-5 py-2 text-xs font-medium border transition-all duration-150 ${
                month === selectedMonth
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
              }`}
            >
              {MONTH_SHORT[month - 1]}
            </button>
          ))}
        </div>

        {/* Current selection label */}
        <p className="text-sm text-muted-foreground mb-8">
          {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
        </p>

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
              No picks have been selected for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
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

      {/* Definition / About section */}
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
            <div className="space-y-6 md:pl-12 lg:pl-20">

              {/* Dictionary-style definition */}
              <div className="space-y-1 pb-4 border-b border-border">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-serif text-2xl font-medium">WellNest</span>
                  <span className="text-sm text-muted-foreground font-light">(noun)</span>
                </div>
                <p className="text-sm text-muted-foreground font-light italic tracking-wide">/ˈwɛlnəst/</p>
                <p className="text-lg text-foreground font-light leading-relaxed pt-2">
                  Wellness stays, redefined. A place to pause.
                </p>
              </div>

              <p className="text-base text-muted-foreground font-light leading-relaxed">
                We believe that where you stay matters. It's not just a bed for the night — it's the backdrop to your memories. The WellNest Collection brings together the most thoughtfully designed spaces across the United Kingdom.
              </p>
              <p className="text-base text-muted-foreground font-light leading-relaxed">
                Each month we select one standout property in each of our seven categories — from working farms to grand estate manors — so you always know where to go next.
              </p>

              <div className="pt-2 space-y-2">
                <Button
                  onClick={() => setNewsletterOpen(true)}
                  className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 uppercase text-xs tracking-widest font-medium"
                >
                  Join The WellNest Collection
                </Button>
                <p className="text-xs text-muted-foreground font-light">
                  Subscribe to our free monthly newsletter
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NewsletterModal open={newsletterOpen} onOpenChange={setNewsletterOpen} />
    </main>
  );
}
