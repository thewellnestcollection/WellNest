import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Upload, X, ArrowUpDown, Download } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

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
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsletterSubscriber {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface FinderSubmission {
  id: number;
  email: string;
  firstName: string | null;
  experience: string | null;
  location: string | null;
  style: string | null;
  guests: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  mustHaves: string[];
  matchedCategories: string[];
  consentGiven: boolean;
  createdAt: string | null;
}

type SortField = "name" | "category" | "location" | "nightlyPrice" | "season";
type SortDir = "asc" | "desc";
type TabKey = "collection" | "newsletter" | "finder";

interface FormData {
  name: string;
  category: string;
  location: string;
  nightlyPrice: string;
  guests: string;
  facilities: string;
  contactEmail: string;
  websiteUrl: string;
  instagramHandle: string;
  description: string;
  featured: boolean;
  pickSeason: string;
  pickYear: string;
  latitude: string;
  longitude: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  "Pick of the Season",
  "Farmstay",
  "Unique Stay",
  "Cabin/hut",
  "Cottage",
  "Pub with Rooms",
  "Estate/Manor",
];

const SEASONS = [
  { value: "Winter", label: "Winter" },
  { value: "Spring", label: "Spring" },
  { value: "Summer", label: "Summer" },
  { value: "Autumn", label: "Autumn" },
];

const SEASON_ORDER: Record<string, number> = {
  Winter: 0,
  Spring: 1,
  Summer: 2,
  Autumn: 3,
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 1 + i);

const defaultForm: FormData = {
  name: "",
  category: "Farmstay",
  location: "",
  nightlyPrice: "",
  guests: "",
  facilities: "",
  contactEmail: "",
  websiteUrl: "",
  instagramHandle: "",
  description: "",
  featured: false,
  pickSeason: "Winter",
  pickYear: String(CURRENT_YEAR),
  latitude: "",
  longitude: "",
};

// ─── API helpers ───────────────────────────────────────────────────────────────

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

async function fetchAdminProperties(): Promise<Property[]> {
  const res = await fetch(`${API_BASE}/api/admin/properties`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

async function createProperty(data: Record<string, unknown>): Promise<Property> {
  const res = await fetch(`${API_BASE}/api/admin/properties`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to create property");
  }
  return res.json();
}

async function updateProperty(id: number, data: Record<string, unknown>): Promise<Property> {
  const res = await fetch(`${API_BASE}/api/admin/properties/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? "Failed to update property");
  }
  return res.json();
}

async function deleteProperty(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/properties/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete property");
}

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch(`${API_BASE}/api/admin/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload image");
  const data = await res.json();
  return data.url;
}

async function fetchNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  const res = await fetch(`${API_BASE}/api/admin/newsletter-subscribers`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch subscribers");
  return res.json();
}

async function fetchFinderSubmissions(): Promise<FinderSubmission[]> {
  const res = await fetch(`${API_BASE}/api/admin/finder-submissions`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch finder submissions");
  return res.json();
}

// ─── CSV helper ────────────────────────────────────────────────────────────────

function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]) {
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("collection");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Admin</p>
          <h1 className="font-serif text-3xl">WellNest Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-8">
          {(["collection", "newsletter", "finder"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-xs uppercase tracking-widest font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "collection" ? "Collection" : tab === "newsletter" ? "Newsletter Signups" : "Finder Requests"}
            </button>
          ))}
        </div>

        {activeTab === "collection" && <CollectionTab />}
        {activeTab === "newsletter" && <NewsletterTab />}
        {activeTab === "finder" && <FinderTab />}
      </div>
    </div>
  );
}

// ─── Collection Tab ────────────────────────────────────────────────────────────

function CollectionTab() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [sortField, setSortField] = useState<SortField>("season");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [imageUrlsText, setImageUrlsText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: fetchAdminProperties,
  });

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
    queryClient.invalidateQueries({ queryKey: ["available-seasons"] });
    queryClient.invalidateQueries({ queryKey: ["seasonal-picks"] });
  };

  const createMutation = useMutation({
    mutationFn: createProperty,
    onSuccess: () => { invalidateCaches(); setDialogOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      updateProperty(id, data),
    onSuccess: () => { invalidateCaches(); setDialogOpen(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onSuccess: invalidateCaches,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortedProperties = [...(properties ?? [])].sort((a, b) => {
    let aVal: string | number = "";
    let bVal: string | number = "";

    if (sortField === "season") {
      const aSeason = (a as any).pickSeason ?? "";
      const bSeason = (b as any).pickSeason ?? "";
      aVal = (a.pickYear ?? 0) * 10 + (SEASON_ORDER[aSeason] ?? 99);
      bVal = (b.pickYear ?? 0) * 10 + (SEASON_ORDER[bSeason] ?? 99);
    } else if (sortField === "nightlyPrice") {
      aVal = a.nightlyPrice;
      bVal = b.nightlyPrice;
    } else {
      aVal = (a[sortField] as string) ?? "";
      bVal = (b[sortField] as string) ?? "";
    }

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setPendingImages([]);
    setImageUrlsText("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (property: Property) => {
    setEditingId(property.id);
    setForm({
      name: property.name,
      category: property.category,
      location: property.location,
      nightlyPrice: String(property.nightlyPrice),
      guests: String(property.guests),
      facilities: property.facilities.join(", "),
      contactEmail: property.contactEmail,
      websiteUrl: property.websiteUrl ?? "",
      instagramHandle: property.instagramHandle ?? "",
      description: property.description ?? "",
      featured: property.featured,
      pickSeason: (property as any).pickSeason ?? "Winter",
      pickYear: String(property.pickYear ?? CURRENT_YEAR),
      latitude: property.latitude != null ? String(property.latitude) : "",
      longitude: property.longitude != null ? String(property.longitude) : "",
    });
    const httpImages = (property.images ?? []).filter((u) => u.startsWith("http"));
    const uploadedImages = (property.images ?? []).filter((u) => !u.startsWith("http"));
    setImageUrlsText(httpImages.join("\n"));
    setPendingImages(uploadedImages);
    setDialogOpen(true);
  };

  const handleImageFiles = async (files: FileList) => {
    setUploadingImages(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        urls.push(url);
      }
      setPendingImages((prev) => [...prev, ...urls]);
    } catch {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleRemoveUploadedImage = (idx: number) => {
    setPendingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const urlImages = imageUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const images = [...urlImages, ...pendingImages];

    const parsedData: Record<string, unknown> = {
      name: form.name,
      category: form.category,
      location: form.location,
      nightlyPrice: parseFloat(form.nightlyPrice),
      guests: parseInt(form.guests, 10),
      facilities: form.facilities.split(",").map((s) => s.trim()).filter(Boolean),
      contactEmail: form.contactEmail,
      websiteUrl: form.websiteUrl || null,
      instagramHandle: form.instagramHandle || null,
      description: form.description || null,
      featured: form.featured,
      pickSeason: form.pickSeason || null,
      pickYear: form.pickYear ? parseInt(form.pickYear, 10) : null,
      images,
      latitude: form.latitude ? parseFloat(form.latitude) : null,
      longitude: form.longitude ? parseFloat(form.longitude) : null,
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: parsedData });
    } else {
      createMutation.mutate(parsedData);
    }
  };

  const handleDownloadCSV = () => {
    if (!properties) return;
    downloadCsv(
      "wellnest-collection.csv",
      ["ID", "Name", "Category", "Location", "Nightly Price", "Guests", "Season", "Year", "Featured", "Website", "Latitude", "Longitude"],
      properties.map((p) => [
        p.id, p.name, p.category, p.location, p.nightlyPrice, p.guests,
        (p as any).pickSeason ?? "", p.pickYear ?? "", p.featured ? "Yes" : "No",
        p.websiteUrl ?? "", p.latitude ?? "", p.longitude ?? "",
      ])
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = (createMutation.error as Error)?.message ?? (updateMutation.error as Error)?.message ?? null;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          {properties?.length ?? 0} properties
        </span>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleDownloadCSV} className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="gap-2 text-xs rounded-none bg-foreground text-background hover:bg-foreground/85"
          >
            <Plus className="w-3.5 h-3.5" /> Add Property
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">Failed to load properties.</div>
      ) : !properties || properties.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-border">
          <p className="font-serif text-2xl text-muted-foreground/60 mb-3">No properties added yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Property" to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {(["name", "category", "location", "season", "nightlyPrice"] as SortField[]).map((field) => (
                  <th key={field} className="pb-3 pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    <button
                      onClick={() => handleSort(field)}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {field === "nightlyPrice" ? "Price" : field.charAt(0).toUpperCase() + field.slice(1)}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                ))}
                <th className="pb-3 pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">Map Pin</th>
                <th className="pb-3 pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">Featured</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProperties.map((property) => {
                const pickSeason = (property as any).pickSeason as string | null;
                const hasCoords = property.latitude != null && property.longitude != null;
                return (
                  <tr key={property.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-4 pr-6 font-medium">{property.name}</td>
                    <td className="py-4 pr-6 text-muted-foreground">{property.category}</td>
                    <td className="py-4 pr-6 text-muted-foreground">{property.location}</td>
                    <td className="py-4 pr-6">
                      {pickSeason && property.pickYear ? (
                        <span className="text-xs font-medium">{pickSeason} {property.pickYear}</span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 pr-6 text-muted-foreground">£{property.nightlyPrice}/nt</td>
                    <td className="py-4 pr-6">
                      {hasCoords ? (
                        <span className="text-xs text-emerald-600 font-medium">✓ Set</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="py-4 pr-6">
                      {property.featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(property)} className="h-8 w-8 p-0">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => { if (confirm(`Delete "${property.name}"?`)) deleteMutation.mutate(property.id); }}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editingId ? "Edit Property" : "Add Property"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">

            {/* Seasonal Assignment */}
            <div className="p-5 border border-border/60 bg-muted/20 space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Seasonal Assignment</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Season</Label>
                  <Select value={form.pickSeason} onValueChange={(v) => setForm((f) => ({ ...f, pickSeason: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
                    <SelectContent>
                      {SEASONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={form.pickYear} onValueChange={(v) => setForm((f) => ({ ...f, pickYear: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Property Name */}
            <div className="space-y-2">
              <Label>Property Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Heckfield Place" />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Hook, Hampshire" />
            </div>

            {/* Price + Guests */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nightly Price (£)</Label>
                <Input type="number" value={form.nightlyPrice} onChange={(e) => setForm((f) => ({ ...f, nightlyPrice: e.target.value }))} placeholder="e.g. 450" />
              </div>
              <div className="space-y-2">
                <Label>Max Guests</Label>
                <Input type="number" value={form.guests} onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))} placeholder="e.g. 10" />
              </div>
            </div>

            {/* Map Coordinates */}
            <div className="p-5 border border-border/60 bg-muted/20 space-y-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Map Pin Location</p>
                <p className="text-xs text-muted-foreground mt-1">Optional — needed for map view on Collection page. Find coordinates at <a href="https://www.latlong.net" target="_blank" rel="noopener noreferrer" className="underline">latlong.net</a></p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))} placeholder="e.g. 51.1234" />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))} placeholder="e.g. -1.5678" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description of the property..." rows={3} />
            </div>

            {/* Facilities */}
            <div className="space-y-2">
              <Label>Facilities <span className="text-muted-foreground font-normal">(comma-separated)</span></Label>
              <Input value={form.facilities} onChange={(e) => setForm((f) => ({ ...f, facilities: e.target.value }))} placeholder="e.g. Pool, Spa, Hot tub" />
            </div>

            {/* Contact */}
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} placeholder="e.g. hello@property.com" />
            </div>

            {/* Website + Instagram */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={form.websiteUrl} onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Instagram Handle</Label>
                <Input value={form.instagramHandle} onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))} placeholder="@handle" />
              </div>
            </div>

            {/* Featured */}
            <div className="flex items-center gap-3">
              <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} className="w-4 h-4" />
              <Label htmlFor="featured">Mark as featured</Label>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <Label>Images</Label>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Image URLs — one per line, first line is the main image</p>
                <textarea
                  value={imageUrlsText}
                  onChange={(e) => setImageUrlsText(e.target.value)}
                  placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                  rows={4}
                  className="w-full border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Or upload images directly</p>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleImageFiles(e.target.files)} />
                <Button type="button" variant="outline" size="sm" disabled={uploadingImages} onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingImages ? "Uploading…" : "Upload Images"}
                </Button>
              </div>
              {pendingImages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Uploaded images</p>
                  <div className="grid grid-cols-3 gap-2">
                    {pendingImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-video bg-muted overflow-hidden">
                        <img src={url.startsWith("http") ? url : `${API_BASE}${url}`} alt="" className="object-cover w-full h-full" />
                        <button type="button" onClick={() => handleRemoveUploadedImage(idx)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {saveError && (
              <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2">{saveError}</p>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSaving} className="rounded-none bg-foreground text-background hover:bg-foreground/85">
                {isSaving ? "Saving…" : editingId ? "Save Changes" : "Add Property"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Newsletter Tab ────────────────────────────────────────────────────────────

function NewsletterTab() {
  const { data: subscribers, isLoading, error } = useQuery({
    queryKey: ["admin-newsletter-subscribers"],
    queryFn: fetchNewsletterSubscribers,
  });

  const handleDownloadCSV = () => {
    if (!subscribers) return;
    downloadCsv(
      "wellnest-newsletter-subscribers.csv",
      ["ID", "First Name", "Last Name", "Email", "Signed Up"],
      subscribers.map((s) => [s.id, s.firstName, s.lastName, s.email, s.createdAt])
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          {subscribers?.length ?? 0} subscriber{subscribers?.length !== 1 ? "s" : ""}
        </span>
        <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!subscribers?.length} className="gap-2 text-xs">
          <Download className="w-3.5 h-3.5" /> Download CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">Failed to load subscribers.</div>
      ) : !subscribers || subscribers.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-border">
          <p className="font-serif text-2xl text-muted-foreground/60 mb-3">No subscribers yet</p>
          <p className="text-sm text-muted-foreground">Signups will appear here once people subscribe.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Name", "Email", "Date Signed Up"].map((h) => (
                  <th key={h} className="pb-3 pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subscribers.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 pr-6 font-medium">{s.firstName} {s.lastName}</td>
                  <td className="py-4 pr-6 text-muted-foreground">{s.email}</td>
                  <td className="py-4 pr-6 text-muted-foreground">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// ─── Finder Requests Tab ───────────────────────────────────────────────────────

function FinderTab() {
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ["admin-finder-submissions"],
    queryFn: fetchFinderSubmissions,
  });

  const handleDownloadCSV = () => {
    if (!submissions) return;
    downloadCsv(
      "wellnest-finder-requests.csv",
      ["ID", "Name", "Email", "Experience", "Location", "Style", "Guests", "Budget Min", "Budget Max", "Must Haves", "Matched Categories", "Date"],
      submissions.map((s) => [
        s.id,
        s.firstName ?? "",
        s.email,
        s.experience ?? "",
        s.location ?? "",
        s.style ?? "",
        s.guests ?? "",
        s.budgetMin ?? "",
        s.budgetMax ?? "",
        (s.mustHaves ?? []).join("; "),
        (s.matchedCategories ?? []).join("; "),
        s.createdAt ?? "",
      ])
    );
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-muted-foreground">
          {submissions?.length ?? 0} request{submissions?.length !== 1 ? "s" : ""}
        </span>
        <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={!submissions?.length} className="gap-2 text-xs">
          <Download className="w-3.5 h-3.5" /> Download CSV
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <div className="text-center py-20 text-destructive">Failed to load finder requests.</div>
      ) : !submissions || submissions.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-border">
          <p className="font-serif text-2xl text-muted-foreground/60 mb-3">No finder requests yet</p>
          <p className="text-sm text-muted-foreground">Requests submitted via the Finder will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Date", "Name", "Email", "Location", "Experience", "Style", "Guests", "Budget", "Matched"].map((h) => (
                  <th key={h} className="pb-3 pr-4 font-medium text-xs uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors align-top">
                  <td className="py-4 pr-4 text-muted-foreground whitespace-nowrap">
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="py-4 pr-4 font-medium whitespace-nowrap">{s.firstName ?? "—"}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{s.email}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{s.location ?? "—"}</td>
                  <td className="py-4 pr-4 text-muted-foreground capitalize">{s.experience ?? "—"}</td>
                  <td className="py-4 pr-4 text-muted-foreground capitalize">{s.style ?? "—"}</td>
                  <td className="py-4 pr-4 text-muted-foreground">{s.guests ?? "—"}</td>
                  <td className="py-4 pr-4 text-muted-foreground whitespace-nowrap">
                    {s.budgetMin != null || s.budgetMax != null
                      ? `£${s.budgetMin ?? "?"} – £${s.budgetMax ?? "?"}`
                      : "—"}
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex flex-wrap gap-1">
                      {(s.matchedCategories ?? []).map((cat) => (
                        <span key={cat} className="inline-block text-xs bg-muted px-1.5 py-0.5 rounded whitespace-nowrap">{cat}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
