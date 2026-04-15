import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useAdminMe, 
  useAdminListProperties, 
  useAdminListNewsletterSubscribers,
  useCreateProperty, 
  useUpdateProperty, 
  useDeleteProperty,
  getAdminListPropertiesQueryKey,
  getListPropertiesQueryKey,
  getGetMonthlyPicksQueryKey,
  getGetPropertyCategoriesQueryKey
} from "@workspace/api-client-react";
import type { Property, CreatePropertyBody, UpdatePropertyBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit2, Trash2, ExternalLink, Loader2, Mail, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

const CATEGORIES = [
  "Pick of the Month",
  "Farmstay",
  "Unique Stay",
  "Cabin/hut",
  "Cottage",
  "Pub with Rooms",
  "Estate/Manor",
];

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

type SortField = "category" | "month" | "price" | null;
type SortDir = "asc" | "desc";

interface FormData {
  name: string;
  category: string;
  location: string;
  nightlyPrice: number;
  guests: number;
  facilities: string[];
  contactEmail: string;
  websiteUrl: string;
  instagramHandle: string;
  images: string[];
  description: string;
  featured: boolean;
  pickMonth: number;
  pickYear: number;
}

const defaultForm: FormData = {
  name: "",
  category: "",
  location: "",
  nightlyPrice: 0,
  guests: 2,
  facilities: [],
  contactEmail: "",
  websiteUrl: "",
  instagramHandle: "",
  images: [],
  description: "",
  featured: false,
  pickMonth: new Date().getMonth() + 1,
  pickYear: new Date().getFullYear(),
};

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csvContent = [
    headers.map(escape).join(","),
    ...rows.map(row => row.map(escape).join(","))
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: adminSession, isLoading: sessionLoading } = useAdminMe();
  const { data: properties, isLoading: propertiesLoading } = useAdminListProperties({
    query: { enabled: !!adminSession?.authenticated }
  });

  const createProp = useCreateProperty();
  const updateProp = useUpdateProperty();
  const deleteProp = useDeleteProperty();

  const [activeTab, setActiveTab] = useState<"collection" | "newsletter">("collection");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [facilitiesText, setFacilitiesText] = useState("");
  const [imagesText, setImagesText] = useState("");

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const { data: subscribers, isLoading: subscribersLoading } = useAdminListNewsletterSubscribers({
    query: { enabled: !!adminSession?.authenticated && activeTab === "newsletter" }
  });

  const sortedProperties = useMemo(() => {
    if (!properties || !sortField) return properties ?? [];
    return [...properties].sort((a, b) => {
      let cmp = 0;
      if (sortField === "category") {
        cmp = a.category.localeCompare(b.category);
      } else if (sortField === "month") {
        const aVal = (a.pickYear ?? 0) * 12 + (a.pickMonth ?? 0);
        const bVal = (b.pickYear ?? 0) * 12 + (b.pickMonth ?? 0);
        cmp = aVal - bVal;
      } else if (sortField === "price") {
        cmp = Number(a.nightlyPrice) - Number(b.nightlyPrice);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [properties, sortField, sortDir]);

  useEffect(() => {
    if (!sessionLoading && !adminSession?.authenticated) {
      setLocation("/admin");
    }
  }, [sessionLoading, adminSession?.authenticated]);

  if (!sessionLoading && !adminSession?.authenticated) {
    return null;
  }

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListPropertiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMonthlyPicksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPropertyCategoriesQueryKey() });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1 text-primary" />;
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setFacilitiesText("");
    setImagesText("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (property: Property) => {
    setEditingId(property.id);
    setFormData({
      name: property.name,
      category: property.category,
      location: property.location,
      nightlyPrice: property.nightlyPrice,
      guests: property.guests,
      facilities: property.facilities || [],
      contactEmail: property.contactEmail,
      websiteUrl: property.websiteUrl || "",
      instagramHandle: property.instagramHandle || "",
      images: property.images || [],
      description: property.description || "",
      featured: property.featured,
      pickMonth: property.pickMonth ?? new Date().getMonth() + 1,
      pickYear: property.pickYear ?? new Date().getFullYear(),
    });
    setFacilitiesText(property.facilities?.join("\n") || "");
    setImagesText(property.images?.join("\n") || "");
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this property? This cannot be undone.")) {
      deleteProp.mutate({ id }, {
        onSuccess: () => {
          invalidateCaches();
          toast({ title: "Property deleted" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error deleting property" });
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedData: CreatePropertyBody = {
      ...formData,
      facilities: facilitiesText.split("\n").map(s => s.trim()).filter(Boolean),
      images: imagesText.split("\n").map(s => s.trim()).filter(Boolean),
    };

    if (editingId) {
      updateProp.mutate({ id: editingId, data: parsedData as UpdatePropertyBody }, {
        onSuccess: () => {
          invalidateCaches();
          setIsFormOpen(false);
          toast({ title: "Property updated successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to update property" });
        }
      });
    } else {
      createProp.mutate({ data: parsedData }, {
        onSuccess: () => {
          invalidateCaches();
          setIsFormOpen(false);
          toast({ title: "Property created successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create property" });
        }
      });
    }
  };

  const handleDownloadCollectionCSV = () => {
    if (!properties) return;
    downloadCSV("wellnest-collection.csv",
      ["Name", "Category", "Location", "Month", "Year", "Price (£/night)", "Guests", "Contact Email", "Website"],
      sortedProperties.map(p => [
        p.name,
        p.category,
        p.location,
        p.pickMonth ? MONTH_NAMES[(p.pickMonth) - 1] : "",
        p.pickYear ? String(p.pickYear) : "",
        String(p.nightlyPrice),
        String(p.guests),
        p.contactEmail,
        p.websiteUrl || "",
      ])
    );
  };

  const handleDownloadNewsletterCSV = () => {
    if (!subscribers) return;
    downloadCSV("wellnest-newsletter-signups.csv",
      ["First Name", "Last Name", "Email", "Signed Up"],
      subscribers.map(s => [
        s.firstName,
        s.lastName,
        s.email,
        new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      ])
    );
  };

  const fixedPrefix = formData.name || formData.location || formData.category || formData.guests
    ? `Experience the perfect blend of comfort and nature at ${formData.name || "[property name]"}. Located in the beautiful surroundings of ${formData.location || "[location]"}, this ${formData.category ? formData.category.toLowerCase() : "[category]"} offers an unforgettable escape for up to ${formData.guests || "[guests]"} guests.`
    : `Experience the perfect blend of comfort and nature at [property name]. Located in the beautiful surroundings of [location], this [category] offers an unforgettable escape for up to [guests] guests.`;

  if (sessionLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-serif tracking-wide mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground font-light">
            Manage your collection and newsletter subscribers.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          <button
            onClick={() => setActiveTab("collection")}
            className={`px-6 py-3 text-sm font-medium tracking-wide border-b-2 transition-colors -mb-px ${
              activeTab === "collection"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Collection
          </button>
          <button
            onClick={() => setActiveTab("newsletter")}
            className={`px-6 py-3 text-sm font-medium tracking-wide border-b-2 transition-colors -mb-px flex items-center gap-2 ${
              activeTab === "newsletter"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Newsletter Signups
            {subscribers && subscribers.length > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                {subscribers.length}
              </span>
            )}
          </button>
        </div>

        {/* Collection tab */}
        {activeTab === "collection" && (
        <>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-muted-foreground font-light text-sm">
              Manage monthly property picks across all categories.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadCollectionCSV}
              disabled={!properties || properties.length === 0}
              className="rounded-none text-xs tracking-widest uppercase font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleOpenCreate}
                  className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-widest font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pick
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">
                    {editingId ? "Edit Property" : "Add Monthly Pick"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                  {/* Monthly assignment */}
                  <div className="border border-primary/30 bg-primary/5 p-4 space-y-4">
                    <p className="text-xs uppercase tracking-widest text-primary font-medium">
                      Monthly Assignment
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Month</Label>
                        <Select
                          value={String(formData.pickMonth)}
                          onValueChange={v => setFormData({ ...formData, pickMonth: Number(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map(m => (
                              <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Year</Label>
                        <Select
                          value={String(formData.pickYear)}
                          onValueChange={v => setFormData({ ...formData, pickYear: Number(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map(y => (
                              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Property Name</Label>
                      <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Lake District, Cumbria" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Contact Email</Label>
                      <Input type="email" required value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} />
                    </div>

                    <div className="space-y-2">
                      <Label>Website URL</Label>
                      <Input type="url" value={formData.websiteUrl} onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })} placeholder="https://example.com" />
                    </div>

                    <div className="space-y-2">
                      <Label>Instagram Handle</Label>
                      <Input value={formData.instagramHandle} onChange={e => setFormData({ ...formData, instagramHandle: e.target.value })} placeholder="@propertyhandle" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nightly Price (£)</Label>
                      <Input type="number" required min="0" value={formData.nightlyPrice} onChange={e => setFormData({ ...formData, nightlyPrice: Number(e.target.value) })} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Max Guests</Label>
                      <Input type="number" required min="1" value={formData.guests} onChange={e => setFormData({ ...formData, guests: Number(e.target.value) })} />
                    </div>
                  </div>

                  {/* About this stay */}
                  <div className="space-y-3 border border-border p-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">About this stay</p>
                    <div className="bg-muted/50 rounded px-3 py-2 text-sm text-muted-foreground italic leading-relaxed select-none">
                      {fixedPrefix}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Additional description (editable)</Label>
                      <Textarea
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Add more details about this property — what makes it special, nearby attractions, ideal guests..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Facilities (One per line)</Label>
                    <Textarea rows={4} value={facilitiesText} onChange={e => setFacilitiesText(e.target.value)} placeholder={"Hot tub\nWood burner\nWiFi"} />
                  </div>

                  <div className="space-y-2">
                    <Label>Image URLs (One per line, first is main image)</Label>
                    <Textarea rows={4} value={imagesText} onChange={e => setImagesText(e.target.value)} placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"} />
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-none">Cancel</Button>
                    <Button type="submit" disabled={createProp.isPending || updateProp.isPending} className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
                      {(createProp.isPending || updateProp.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editingId ? "Save Changes" : "Create Pick"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-card border shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-serif">Property</TableHead>
                <TableHead className="font-serif">
                  <button
                    onClick={() => handleSort("category")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Category {sortIcon("category")}
                  </button>
                </TableHead>
                <TableHead className="font-serif">
                  <button
                    onClick={() => handleSort("month")}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Month {sortIcon("month")}
                  </button>
                </TableHead>
                <TableHead className="font-serif text-right">
                  <button
                    onClick={() => handleSort("price")}
                    className="flex items-center ml-auto hover:text-foreground transition-colors"
                  >
                    Price {sortIcon("price")}
                  </button>
                </TableHead>
                <TableHead className="font-serif text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertiesLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : sortedProperties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-light">
                    No properties added yet.
                  </TableCell>
                </TableRow>
              ) : (
                sortedProperties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{property.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{property.location}</div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                        {property.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {property.pickMonth && property.pickYear ? (
                        <span className="text-sm text-foreground">
                          {MONTH_NAMES[(property.pickMonth ?? 1) - 1]} {property.pickYear}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      £{property.nightlyPrice}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/properties/${property.id}`, '_blank')} title="View">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(property)} title="Edit">
                          <Edit2 className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(property.id)} disabled={deleteProp.isPending} title="Delete">
                          {deleteProp.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        </>) } {/* end collection tab */}

        {/* Newsletter tab */}
        {activeTab === "newsletter" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-light">
                {subscribers?.length ?? 0} subscriber{(subscribers?.length ?? 0) !== 1 ? "s" : ""} signed up
              </p>
              <Button
                variant="outline"
                onClick={handleDownloadNewsletterCSV}
                disabled={!subscribers || subscribers.length === 0}
                className="rounded-none text-xs tracking-widest uppercase font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
            <div className="bg-card border shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-serif">Name</TableHead>
                    <TableHead className="font-serif">Email</TableHead>
                    <TableHead className="font-serif">Signed Up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribersLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      </TableRow>
                    ))
                  ) : subscribers?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-32 text-center text-muted-foreground font-light">
                        No newsletter signups yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers?.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.firstName} {sub.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <a href={`mailto:${sub.email}`} className="hover:text-foreground transition-colors">
                            {sub.email}
                          </a>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )} {/* end newsletter tab */}

      </div>
    </div>
  );
}
