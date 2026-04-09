import { CategoryStat } from "@workspace/api-client-react/src/generated/api.schemas";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface CategoryFilterProps {
  categories: CategoryStat[];
  activeCategory?: string;
  onSelectCategory: (category?: string) => void;
}

export function CategoryFilter({ categories, activeCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap pb-4">
      <div className="flex w-max space-x-2 p-1">
        <Button
          variant={!activeCategory ? "default" : "outline"}
          className={`rounded-full px-6 font-normal ${!activeCategory ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-transparent border-border hover:border-primary hover:text-primary'}`}
          onClick={() => onSelectCategory(undefined)}
        >
          All Stays
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.category}
            variant={activeCategory === cat.category ? "default" : "outline"}
            className={`rounded-full px-6 font-normal ${
              activeCategory === cat.category 
                ? 'bg-foreground text-background hover:bg-foreground/90' 
                : 'bg-transparent border-border hover:border-primary hover:text-primary'
            }`}
            onClick={() => onSelectCategory(cat.category)}
          >
            {cat.category}
            <span className="ml-2 text-xs opacity-60">({cat.count})</span>
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" className="invisible" />
    </ScrollArea>
  );
}
