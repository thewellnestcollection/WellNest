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

const SEASON_ORDER: Record<string, number> = { Winter: 0, Spring: 1, Summer: 2, Autumn: 3 };

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

type SortField = "category" | "season" | "price" | null;
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
  pickSeason: string;
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
  pickSeason: "Winter",
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
      } else if (sortField === "season") {
        const aSeason = (a as any).pickSeason as string | null;
        const bSeason = (b as any).pickSeason as string | null;
        const aVal = (a.pickYear ?? 0) * 10 + (SEASON_ORDER[aSeason ?? ""] ?? 0);
        const bVal = (b.pickYear ?? 0) * 10 + (SEASON_ORDER[bSeason ?? ""] ?? 0);
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
    queryClient.invalidateQueries({ queryKey: getGetPropertyCategoriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: ["available-seasons"] });
    queryClient.invalidateQueries({ queryKey: ["seasonal-picks"] });
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
      pickSeason: (property as any).pickSeason ?? "Winter",
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
    const parsedData = {
      ...formData,
      facilities: facilitiesText.split("\n").map(s => s.trim()).filter(Boolean),
      images: imagesText.split("\n").map(s => s.trim()).filter(Boolean),
    } as any;

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
      createProp.mutate({ data: parsedData as CreatePropertyBody }, {
        onSuccess: () => {
          invalidateCaches();
          setIsFormOpen(false);
          toast({ title: "Property created successfully" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Failed to create
