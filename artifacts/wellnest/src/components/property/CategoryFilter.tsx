import { CategoryStat } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Star } from "lucide-react";

interface CategoryFilterProps {
  categories: CategoryStat[];
  activeCategory?: string;
  onSelectCategory: (category?: string) => void;
}

const CATEGORY_ORDER = [
  "Pick of the Month",
  "Farmstay",
  "Unique Stay",
  "Cabin/hut",
  "Cottage",
  "Pub with Rooms",
  "Estate/Manor",
];

export function CategoryFilter({ categories, activeCategory, onSelectCategory }: CategoryFilterProps) {
  const sorted = [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.category);
    const bi = CATEGORY_ORDER.indexOf(b.category);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max space-x-2 p-1 items-center">
        <Button
          variant={!activeCategory ? "default" : "outline"}
          className={`rounded-full px-6 font-normal ${!activeCategory ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-transparent border-border hover:border-primary hover:text-primary'}`}
          onClick={() => onSelectCategory(undefined)}
        >
          All Stays
        </Button>
        {sorted.map((cat) => {
          const isPick = cat.category === "Pick of the Month";
          const isActive = activeCategory === cat.category;
          return (
            <Button
              key={cat.category}
              variant={isActive ? "default" : "outline"}
              className={`rounded-full px-6 font-normal gap-1.5 ${
                isActive
                  ? isPick
                    ? 'bg-amber-900 text-amber-100 hover:bg-amber-900/90 border-amber-900'
                    : 'bg-foreground text-background hover:bg-foreground/90'
                  : isPick
                    ? 'bg-transparent border-amber-800/50 text-amber-800 hover:border-amber-700 hover:bg-amber-50'
                    : 'bg-transparent border-border hover:border-primary hover:text-primary'
              }`}
              onClick={() => onSelectCategory(cat.category)}
            >
              {isPick && <Star className={`w-3 h-3 ${isActive ? 'fill-amber-300 text-amber-300' : 'fill-amber-700 text-amber-700'}`} />}
              {cat.category}
              <span className="ml-1 text-xs opacity-60">({cat.count})</span>
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
