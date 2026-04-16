import { useState, useEffect, useCallback } from "react";
import { useParams } from "wouter";
import { useGetProperty } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Mail, Check, ChevronLeft, ChevronRight, Calendar, Globe, Instagram, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function PropertyDetails() {
  const params = useParams<{ id: string }>();
  const propertyId = parseInt(params.id || "0", 10);

  const { data: property, isLoading, error } = useGetProperty(propertyId, {
    query: { enabled: !!propertyId }
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const allImages: string[] = (property?.images ?? []).filter(Boolean) as string[];

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === 0 ? allImages.length - 1 : i - 1));
  }, [allImages.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === allImages.length - 1 ? 0 : i + 1));
  }, [allImages.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prev, next]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <Skeleton className="w-full h-[60vh] md:h-[70vh]" />
        <div className="container mx-auto px-4 md:px-6 mt-12 max-w-4xl space-y-8">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid md:grid-cols-3 gap-12 mt-16">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-3xl font-serif mb-4">Property not found</h1>
        <p className="text-muted-foreground mb-8">We couldn't find the property you're looking for.</p>
        <Link href="/collection">
          <Button variant="outline">Return to Collection</Button>
        </Link>
      </div>
    );
  }

  const mainImage = allImages[0] || "/images/property-placeholder.png";
  const galleryImages = allImages.length > 1 ? allImages.slice(1) : [];

  return (
    <article className="min-h-screen bg-background pb-24">
      {/* Back Link */}
      <div className="fixed top-44 left-4 md:left-8 z-20">
        <Link href="/collection" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-foreground transition-colors shadow-sm">
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Hero Image — clickable */}
      <div
        className="w-full h-[60vh] md:h-[75vh] relative bg-muted cursor-zoom-in group"
        onClick={() => openLightbox(0)}
      >
        <img
          src={mainImage}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.01]"
        />
        {allImages.length > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5" />
            View all {allImages.length} photos
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-5xl -mt-24 relative z-10">
        {/* Header Card */}
        <div className="bg-white p-8 md:p-12 shadow-xl mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/collection?category=${encodeURIComponent(property.category)}`}
                  className="inline-block px-3 py-1 bg-muted text-muted-foreground text-xs uppercase tracking-widest font-medium hover:bg-muted/70 hover:text-foreground transition-colors"
                >
                  {property.category}
                </Link>
                {property.pickMonth && property.pickYear && (
                  <Link
                    href={`/?year=${property.pickYear}&month=${property.pickMonth}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs uppercase tracking-widest font-medium border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    <Calendar className="w-3 h-3" />
                    {MONTH_NAMES[(property.pickMonth as number) - 1]} {property.pickYear} Pick
                  </Link>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight">{property.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-light pt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 opacity-70" />
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 opacity-70" />
                  <span>Sleeps up to {property.guests}</span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right shrink-0 border-t md:border-t-0 pt-6 md:pt-0 border-border">
              <div className="text-3xl md:text-4xl font-serif">&pound;{property.nightlyPrice}</div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider mt-1">Price from / nt</div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-16">
            <section className="space-y-6">
              <h2 className="text-2xl font-serif">About this stay</h2>
              <div className="prose prose-stone max-w-none font-light leading-relaxed text-foreground/80">
                <p>
                  Experience the perfect blend of comfort and nature at {property.name}.
                  Located in the beautiful surroundings of {property.location}, this {property.category.toLowerCase()} offers an unforgettable escape for up to {property.guests} guests.
                </p>
                {property.description ? (
                  <p>{property.description}</p>
                ) : (
                  <p>
                    Every detail has been carefully considered to ensure a restful stay. Whether you're looking for a peaceful retreat or a base to explore the local area, this property provides the ideal setting for your next getaway.
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-serif">Amenities</h2>
              <ul className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                {property.facilities?.map((facility, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="font-light">{facility}</span>
                  </li>
                ))}
                {(!property.facilities || property.facilities.length === 0) && (
                  <li className="text-muted-foreground italic font-serif">No specific amenities listed.</li>
                )}
              </ul>
            </section>

            {galleryImages.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-2xl font-serif">Gallery</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="aspect-[4/3] bg-muted relative overflow-hidden cursor-zoom-in group"
                      onClick={() => openLightbox(idx + 1)}
                    >
                      <img
                        src={img}
                        alt={`${property.name} - View ${idx + 2}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-muted/50 p-8 sticky top-44">
              <h3 className="text-xl font-serif mb-6">Ready to book?</h3>
              <p className="text-muted-foreground font-light mb-8 text-sm leading-relaxed">
                Contact the property manager directly to check availability and arrange your stay at {property.name}.
              </p>
              <a
                href={`mailto:${property.contactEmail}?subject=Enquiry regarding ${encodeURIComponent(property.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-medium tracking-wide uppercase text-sm transition-colors"
              >
                <Mail className="w-4 h-4" />
                Contact Host
              </a>
              <div className="mt-6 text-center text-xs text-muted-foreground/80">
                Responds usually within 24 hours
              </div>

              {(property.websiteUrl || property.instagramHandle || property.contactEmail) && (
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  {property.websiteUrl && (
                    <a
                      href={property.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <Globe className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" />
                      <span className="truncate">Visit Website</span>
                    </a>
                  )}
                  {property.instagramHandle && (
                    <a
                      href={`https://www.instagram.com/${property.instagramHandle.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <Instagram className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" />
                      <span className="truncate">{property.instagramHandle.startsWith("@") ? property.instagramHandle : `@${property.instagramHandle}`}</span>
                    </a>
                  )}
                  {property.contactEmail && (
                    <a
                      href={`mailto:${property.contactEmail}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      <Mail className="w-4 h-4 shrink-0 group-hover:text-primary transition-colors" />
                      <span className="truncate">{property.contactEmail}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2 z-10"
            onClick={closeLightbox}
          >
            <X className="w-7 h-7" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tracking-widest">
            {lightboxIndex + 1} / {allImages.length}
          </div>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white transition-colors p-3 z-10"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-[90vw] max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              key={lightboxIndex}
              src={allImages[lightboxIndex]}
              alt={`${property.name} photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>

          {/* Next */}
          {allImages.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white transition-colors p-3 z-10"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-14 h-10 overflow-hidden border-2 transition-all ${
                    i === lightboxIndex ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
