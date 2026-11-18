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
  createdAt: string;
  updatedAt: string;
}

type SortField = "name" | "category" | "location" | "nightlyPrice" | "season";
type SortDir = "asc" | "desc";

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

// ─── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [sortField, setSortField] = useState<SortField>("season");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [uploadingImages, setUploadingImages] = useState(false);
  // pendingImages holds only server-side upload paths (non-http)
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  // imageUrlsText holds the raw textarea content for http:// image URLs
  const [imageUrlsText, setImageUrlsText] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ["admin-properties"],
    queryFn: fetchAdminProperties,
  });

  // ── Mutations ──
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

  // ── Sorting ──
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
      const aYear = a.pickYear ?? 0;
      const bYear = b.pickYear ?? 0;
      aVal = aYear * 10 + (SEASON_ORDER[aSeason] ?? 99);
      bVal = bYear * 10 + (SEASON_ORDER[bSeason] ?? 99);
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

  // ── Dialog open/close ──
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
    });
    // http:// URLs go into the textarea; server upload paths go into pendingImages
    const httpImages = (property.images ?? []).filter((u) => u.startsWith("http"));
    const uploadedImages = (property.images ?? []).filter((u) => !u.startsWith("http"));
    setImageUrlsText(httpImages.join("\n"));
    setPendingImages(uploadedImages);
    setDialogOpen(true);
  };

  // ── Image upload ──
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

  // ── Submit ──
  const handleSubmit = () => {
    // URL textarea → array of trimmed non-empty lines
    const urlImages = imageUrlsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    // Combine: URL images first (textarea order), then server-uploaded paths
    const images = [...urlImages, ...pendingImages];

    const parsedData = {
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
    };

    if (editingId !== null) {
      updateMutation.mutate({ id: editingId, data: parsedData as any });
    } else {
      createMutation.mutate(parsedData as any);
    }
  };

  // ── CSV download ──
  const handleDownloadCollectionCSV = () => {
    if (!properties) return;
    const headers = ["ID", "Name", "Category", "Location", "Nightly Price", "Guests", "Season", "Year", "Featured", "Website"];
    const rows = properties.map((p) => [
      p.id,
      p.name,
      p.category,
      p.location,
      p.nightlyPrice,
      p.guests,
      (p as any).pickSeason ?? "",
      p.pickYear ?? "",
      p.featured ? "Yes" : "No",
      p.websiteUrl ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wellnest-collection.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const saveError = (createMutation.error as Error)?.message ?? (updateMutation.error as Error)?.message ?? null;

  // ── Render ──
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12 max-w-7xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Admin</p>
            <h1 className="font-serif text-3xl">Manage seasonal property picks</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleDownloadCollectionCSV} className="gap-2 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              onClick={handleOpenCreate}
              size="sm"
              className="gap-2 text-xs rounded-none bg-foreground text-background hover:bg-foreground/85"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Property
            </Button>
          </div>
        </div>

        {/* Table */}
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
                    <th
                      key={field}
                      className="pb-3 pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      <button
                        onClick={() => handleSort(field)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {field === "nightlyPrice" ? "Price" : field.charAt(0).toUpperCase() + field.slice(1)}
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                  <th className="pb-3 pr-6 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Featured
                  </th>
                  <th className="pb-3 font-medium text-xs uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedProperties.map((property) => {
                  const pickSeason = (property as any).pickSeason as string | null;
                  return (
                    <tr
                      key={property.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 pr-6 font-medium">{property.name}</td>
                      <td className="py-4 pr-6 text-muted-foreground">{property.category}</td>
                      <td className="py-4 pr-6 text-muted-foreground">{property.location}</td>
                      <td className="py-4 pr-6">
                        {pickSeason && property.pickYear ? (
                          <span className="text-xs font-medium">
                            {pickSeason} {property.pickYear}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 pr-6 text-muted-foreground">£{property.nightlyPrice}/nt</td>
                      <td className="py-4 pr-6">
                        {property.featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(property)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete "${property.name}"?`)) {
                                deleteMutation.mutate(property.id);
                              }
                            }}
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
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Seasonal Assignment
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Season</Label>
                    <Select
                      value={form.pickSeason}
                      onValueChange={(v) => setForm((f) => ({ ...f, pickSeason: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select season" />
                      </SelectTrigger>
                      <SelectContent>
                        {SEASONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select
                      value={form.pickYear}
                      onValueChange={(v) => setForm((f) => ({ ...f, pickYear: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Property Name */}
              <div className="space-y-2">
                <Label>Property Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Heckfield Place"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Hook, Hampshire"
                />
              </div>

              {/* Price + Guests */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nightly Price (£)</Label>
                  <Input
                    type="number"
                    value={form.nightlyPrice}
                    onChange={(e) => setForm((f) => ({ ...f, nightlyPrice: e.target.value }))}
                    placeholder="e.g. 450"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Guests</Label>
                  <Input
                    type="number"
                    value={form.guests}
                    onChange={(e) => setForm((f) => ({ ...f, guests: e.target.value }))}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description of the property..."
                  rows={3}
                />
              </div>

              {/* Facilities */}
              <div className="space-y-2">
                <Label>
                  Facilities{" "}
                  <span className="text-muted-foreground font-normal">(comma-separated)</span>
                </Label>
                <Input
                  value={form.facilities}
                  onChange={(e) => setForm((f) => ({ ...f, facilities: e.target.value }))}
                  placeholder="e.g. Pool, Spa, Hot tub"
                />
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="e.g. hello@property.com"
                />
              </div>

              {/* Website + Instagram */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website URL</Label>
                  <Input
                    value={form.websiteUrl}
                    onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instagram Handle</Label>
                  <Input
                    value={form.instagramHandle}
                    onChange={(e) => setForm((f) => ({ ...f, instagramHandle: e.target.value }))}
                    placeholder="@handle"
                  />
                </div>
              </div>

              {/* Featured */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                  className="w-4 h-4"
                />
                <Label htmlFor="featured">Mark as featured</Label>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <Label>Images</Label>

                {/* URL textarea */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Image URLs — one per line, first line is the main image
                  </p>
                  <textarea
                    value={imageUrlsText}
                    onChange={(e) => setImageUrlsText(e.target.value)}
                    placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                    rows={4}
                    className="w-full border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>

                {/* Upload */}
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Or upload images directly</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleImageFiles(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImages ? "Uploading…" : "Upload Images"}
                  </Button>
                </div>

                {/* Uploaded file previews */}
                {pendingImages.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Uploaded images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {pendingImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-video bg-muted overflow-hidden">
                          <img
                            src={
                              url.startsWith("http")
                                ? url
                                : `${API_BASE}${url}`
                            }
                            alt=""
                            className="object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveUploadedImage(idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {saveError && (
                <p className="text-sm text-destructive border border-destructive/30 bg-destructive/5 px-3 py-2">
                  {saveError}
                </p>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="rounded-none bg-foreground text-background hover:bg-foreground/85"
                >
                  {isSaving ? "Saving…" : editingId ? "Save Changes" : "Add Property"}
                </Button>
              </div>

            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
