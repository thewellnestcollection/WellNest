import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PropertyCard } from "@/components/property/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Experience = "rest" | "adventure" | "romance" | "family" | "solo";
type Location = "countryside" | "coast" | "woodland" | "village" | "remote";
type Style = "rustic" | "modern" | "historic" | "eco";
type Budget = "under100" | "100to200" | "200to350" | "350plus";

interface Answers {
  experience: Experience | null;
  location: Location | null;
  style: Style | null;
  guests: number | null;
  budget: Budget | null;
  mustHaves: string[];
}

interface Property {
  id: number;
  name: string;
  category: string;
  location: string;
  nightlyPrice: number;
  guests: number;
  images: string[];
  description: string | null;
  pickMonth: number | null;
  pickYear: number | null;
  featured: boolean;
  websiteUrl: string | null;
  instagramHandle: string | null;
  contactEmail: string;
  facilities: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Quiz data ─────────────────────────────────────────────────────────────────

const MUST_HAVE_OPTIONS = [
  { id: "hot-tub", label: "Hot tub", icon: "♨" },
  { id: "dog-friendly", label: "Dog friendly", icon: "🐾" },
  { id: "open-fire", label: "Open fire", icon: "🔥" },
  { id: "off-grid", label: "Off-grid / no-wifi", icon: "📵" },
  { id: "garden", label: "Garden / outdoor space", icon: "🌿" },
  { id: "pool", label: "Pool / wild swimming", icon: "🏊" },
];

// ─── Matching logic ─────────────────────────────────────────────────────────────

function matchCategories(answers: Answers): string[] {
  const cats: string[] = [];

  // Farmstay → countryside, rustic, family/eco
  if (
    (answers.location === "countryside" || answers.location === "remote") &&
    (answers.style === "rustic" || answers.style === "eco") &&
    (answers.experience === "family" || answers.experience === "rest")
  ) {
    cats.push("Farmstay");
  }

  // Cabin/Hut → woodland, remote, solo/romance, rustic/eco
  if (
    (answers.location === "woodland" || answers.location === "remote") &&
    (answers.style === "rustic" || answers.style === "eco") &&
    (answers.experience === "solo" || answers.experience === "romance" || answers.experience === "rest")
  ) {
    cats.push("Cabin/hut");
  }

  // Unique Stay → adventure/solo, modern/eco
  if (
    answers.experience === "adventure" ||
    answers.style === "eco" ||
    answers.style === "modern"
  ) {
    cats.push("Unique Stay");
  }

  // Cottage → village/countryside, rest/family, rustic/historic
  if (
    (answers.location === "village" || answers.location === "countryside") &&
    (answers.experience === "rest" || answers.experience === "family")
  ) {
    cats.push("Cottage");
  }

  // Pub with Rooms → village, rest/solo, rustic/historic, budget-friendly
  if (
    answers.location === "village" &&
    (answers.style === "rustic" || answers.style === "historic") &&
    answers.budget !== "350plus"
  ) {
    cats.push("Pub with Rooms");
  }

  // Estate/Manor → romance/rest, historic/modern, luxury budget
  if (
    (answers.experience === "romance" || answers.experience === "rest") &&
    (answers.style === "historic" || answers.style === "modern") &&
    (answers.budget === "200to350" || answers.budget === "350plus")
  ) {
    cats.push("Estate/Manor");
  }

  // Always include Pick of the Month
  cats.push("Pick of the Month");

  return [...new Set(cats)];
}

function budgetToNumbers(budget: Budget): { min?: number; max?: number } {
  switch (budget) {
    case "under100": return { max: 100 };
    case "100to200": return { min: 100, max: 200 };
    case "200to350": return { min: 200, max: 350 };
    case "350plus": return { min: 350 };
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface OptionButtonProps {
  selected: boolean;
  onClick: () => void;
  icon?: string;
  label: string;
  description?: string;
}

function OptionButton({ selected, onClick, icon, label, description }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 text-left px-5 py-4 border transition-all duration-150 w-full",
        selected
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-foreground border-border hover:border-foreground/40"
      )}
    >
      {icon && <span className="text-xl mb-1">{icon}</span>}
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span className={cn("text-xs leading-snug", selected ? "text-background/70" : "text-muted-foreground")}>
          {description}
        </span>
      )}
    </button>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-1.5 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-0.5 flex-1 transition-all duration-300",
            i < step ? "bg-foreground" : "bg-border"
          )}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Step = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "email" | "results";
const STEPS: Step[] = ["q1", "q2", "q3", "q4", "q5", "q6", "email", "results"];
const QUIZ_STEPS = 6; // number of question steps (not counting email/results)

export function Finder() {
  const [step, setStep] = useState<Step>("q1");
  const [answers, setAnswers] = useState<Answers>({
    experience: null,
    location: null,
    style: null,
    guests: null,
    budget: null,
    mustHaves: [],
  });
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Property[]>([]);
  const [submitError, setSubmitError] = useState("");

  const stepIndex = STEPS.indexOf(step);
  const quizStepNumber = Math.min(stepIndex + 1, QUIZ_STEPS);

  // ── Navigation ──
  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  // ── Setters with auto-advance ──
  function pick<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
    setTimeout(goNext, 180); // small delay so button flash is visible
  }

  function toggleMustHave(id: string) {
    setAnswers((a) => ({
      ...a,
      mustHaves: a.mustHaves.includes(id)
        ? a.mustHaves.filter((x) => x !== id)
        : [...a.mustHaves, id],
    }));
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setSubmitError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    const matchedCategories = matchCategories(answers);
    const { min: budgetMin, max: budgetMax } = answers.budget ? budgetToNumbers(answers.budget) : {};

    setIsLoading(true);
    try {
      const res = await fetch("/api/finder/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          experience: answers.experience ?? "rest",
          location: answers.location ?? "countryside",
          style: answers.style ?? "rustic",
          guests: answers.guests ?? 2,
          budgetMin,
          budgetMax,
          mustHaves: answers.mustHaves,
          matchedCategories,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResults(data.properties ?? []);
      setStep("results");
    } catch (_e) {
      setSubmitError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 bg-[#f9f6f2] min-h-screen">
      {/* Header strip */}
      <div className="bg-white border-b border-border py-10 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">WellNest Finder</p>
        <h1 className="font-serif text-3xl md:text-4xl">Find your perfect stay</h1>
        <p className="text-muted-foreground font-light mt-2 text-sm">
          Answer a few questions and we'll show you exactly where to go.
        </p>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-2xl">

        {/* ── Q1: Experience ── */}
        {step === "q1" && (
          <div>
            <ProgressBar step={1} total={QUIZ_STEPS} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Question 1 of {QUIZ_STEPS}</p>
            <h2 className="font-serif text-2xl mb-8">What kind of experience are you looking for?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: "rest" as Experience, icon: "🌿", label: "Rest & relaxation", description: "Slow down, switch off, recover" },
                { value: "adventure" as Experience, icon: "🧗", label: "Adventure & activities", description: "Hiking, cycling, wild swimming" },
                { value: "romance" as Experience, icon: "🕯", label: "Romantic escape", description: "Just the two of you" },
                { value: "family" as Experience, icon: "👨‍👩‍👧", label: "Family getaway", description: "Space for everyone" },
                { value: "solo" as Experience, icon: "🧘", label: "Solo retreat", description: "Time for yourself" },
              ].map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={answers.experience === opt.value}
                  onClick={() => pick("experience", opt.value)}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Q2: Location ── */}
        {step === "q2" && (
          <div>
            <ProgressBar step={2} total={QUIZ_STEPS} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Question 2 of {QUIZ_STEPS}</p>
            <h2 className="font-serif text-2xl mb-8">Where do you prefer to be?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: "countryside" as Location, icon: "🌾", label: "Open countryside", description: "Rolling hills, farmland, open skies" },
                { value: "coast" as Location, icon: "🌊", label: "Coastal", description: "Sea views, cliffs, rock pools" },
                { value: "woodland" as Location, icon: "🌲", label: "Woodland / forest", description: "Trees, birdsong, dappled light" },
                { value: "village" as Location, icon: "🏡", label: "Village / town", description: "Local pubs, cafés, community feel" },
                { value: "remote" as Location, icon: "🏔", label: "Somewhere remote", description: "Off the grid, away from it all" },
              ].map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={answers.location === opt.value}
                  onClick={() => pick("location", opt.value)}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                />
              ))}
            </div>
            <button onClick={goBack} className="mt-6 text-xs text-muted-foreground underline underline-offset-2">← Back</button>
          </div>
        )}

        {/* ── Q3: Style ── */}
        {step === "q3" && (
          <div>
            <ProgressBar step={3} total={QUIZ_STEPS} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Question 3 of {QUIZ_STEPS}</p>
            <h2 className="font-serif text-2xl mb-8">What's your style?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: "rustic" as Style, icon: "🪵", label: "Rustic & cosy", description: "Exposed beams, log fires, worn-in charm" },
                { value: "modern" as Style, icon: "🏛", label: "Modern & minimal", description: "Clean lines, design-led, calm spaces" },
                { value: "historic" as Style, icon: "🏰", label: "Historic & characterful", description: "Old walls, rich history, period features" },
                { value: "eco" as Style, icon: "🌱", label: "Eco & sustainable", description: "Low impact, nature-first, off-grid options" },
              ].map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={answers.style === opt.value}
                  onClick={() => pick("style", opt.value)}
                  icon={opt.icon}
                  label={opt.label}
                  description={opt.description}
                />
              ))}
            </div>
            <button onClick={goBack} className="mt-6 text-xs text-muted-foreground underline underline-offset-2">← Back</button>
          </div>
        )}

        {/* ── Q4: Guests ── */}
        {step === "q4" && (
          <div>
            <ProgressBar step={4} total={QUIZ_STEPS} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Question 4 of {QUIZ_STEPS}</p>
            <h2 className="font-serif text-2xl mb-8">How many guests?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { value: 1, label: "Just me", icon: "👤" },
                { value: 2, label: "2 people", icon: "👥" },
                { value: 4, label: "3–4 people", icon: "👨‍👩‍👧" },
                { value: 6, label: "5+ people", icon: "🎉" },
              ].map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={answers.guests === opt.value}
                  onClick={() => pick("guests", opt.value)}
                  icon={opt.icon}
                  label={opt.label}
                />
              ))}
            </div>
            <button onClick={goBack} className="mt-6 text-xs text-muted-foreground underline underline-offset-2">← Back</button>
          </div>
        )}

        {/* ── Q5: Budget ── */}
        {step === "q5" && (
          <div>
            <ProgressBar step={5} total={QUIZ_STEPS} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Question 5 of {QUIZ_STEPS}</p>
            <h2 className="font-serif text-2xl mb-8">What's your budget per night?</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "under100" as Budget, label: "Under £100", description: "Great value finds" },
                { value: "100to200" as Budget, label: "£100 – £200", description: "Mid-range comfort" },
                { value: "200to350" as Budget, label: "£200 – £350", description: "Premium properties" },
                { value: "350plus" as Budget, label: "£350+", description: "Luxury & estate stays" },
              ].map((opt) => (
                <OptionButton
                  key={opt.value}
                  selected={answers.budget === opt.value}
                  onClick={() => pick("budget", opt.value)}
                  label={opt.label}
                  description={opt.description}
                />
              ))}
            </div>
            <button onClick={goBack} className="mt-6 text-xs text-muted-foreground underline underline-offset-2">← Back</button>
          </div>
        )}

        {/* ── Q6: Must-haves ── */}
        {step === "q6" && (
          <div>
            <ProgressBar step={6} total={QUIZ_STEPS} />
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Question 6 of {QUIZ_STEPS}</p>
            <h2 className="font-serif text-2xl mb-2">Any must-haves?</h2>
            <p className="text-sm text-muted-foreground mb-8">Select all that apply — or skip if you're flexible.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {MUST_HAVE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMustHave(opt.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-3.5 border text-sm transition-all duration-150",
                    answers.mustHaves.includes(opt.id)
                      ? "bg-foreground text-background border-foreground"
                      : "bg-transparent text-foreground border-border hover:border-foreground/40"
                  )}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                className="rounded-none border-border h-11"
              >
                ← Back
              </Button>
              <Button
                type="button"
                onClick={goNext}
                className="rounded-none bg-foreground text-background hover:bg-foreground/85 h-11 px-8 flex-1 uppercase text-xs tracking-widest font-medium"
              >
                {answers.mustHaves.length === 0 ? "Skip — show my results" : "See my matches →"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Email gate ── */}
        {step === "email" && (
          <div>
            <ProgressBar step={QUIZ_STEPS} total={QUIZ_STEPS} />
            <div className="text-center mb-10">
              <div className="text-4xl mb-4">✓</div>
              <h2 className="font-serif text-2xl mb-3">We've found your matches</h2>
              <p className="text-muted-foreground font-light text-sm leading-relaxed max-w-sm mx-auto">
                Enter your email to unlock your personalised results — we'll also send you the next seasonal collection when it's ready.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="First name (optional)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-none h-12 border-border bg-white"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your email address *"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                  className={cn("rounded-none h-12 bg-white", emailError ? "border-destructive" : "border-border")}
                  required
                />
                {emailError && <p className="text-destructive text-xs mt-1">{emailError}</p>}
              </div>

              {submitError && (
                <p className="text-destructive text-sm">{submitError}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-none bg-foreground text-background hover:bg-foreground/85 h-12 uppercase text-xs tracking-widest font-medium"
              >
                {isLoading ? "Finding your matches…" : "Unlock my results →"}
              </Button>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                No spam, ever. Unsubscribe at any time.{" "}
                <button
                  type="button"
                  onClick={goBack}
                  className="underline underline-offset-2"
                >
                  ← Go back
                </button>
              </p>
            </form>
          </div>
        )}

        {/* ── Results ── */}
        {step === "results" && (
          <div>
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Your WellNest matches</p>
              <h2 className="font-serif text-3xl mb-3">
                {firstName ? `${firstName}, here are your picks` : "Here are your picks"}
              </h2>
              <p className="text-muted-foreground font-light text-sm">
                Based on your answers, these are the properties in our current collection that suit you best.
              </p>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border">
                <p className="font-serif text-xl text-muted-foreground/60 mb-3">No exact matches right now</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Our collection is updated each season — check back soon for new properties.
                </p>
                <Link href="/collection">
                  <Button variant="outline" className="rounded-none">
                    Browse all properties
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
                  {results.map((property) => (
                    <PropertyCard key={property.id} property={property} showCategory />
                  ))}
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground">
                    Want to see everything?
                  </p>
                  <Link href="/collection">
                    <Button variant="outline" className="rounded-none border-border h-11 text-xs uppercase tracking-widest">
                      Browse full collection
                    </Button>
                  </Link>
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => {
                      setStep("q1");
                      setAnswers({ experience: null, location: null, style: null, guests: null, budget: null, mustHaves: [] });
                      setEmail("");
                      setFirstName("");
                      setResults([]);
                    }}
                    className="text-xs text-muted-foreground underline underline-offset-2"
                  >
                    Start over
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
