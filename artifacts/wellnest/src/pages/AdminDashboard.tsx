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
  "Country House",
  "Coastal Retreat",
  "Forest & Woodland",
  "Spa & Thermal",
  "Working Farm",
  "Estate & Manor",
  "Eco & Sustainable",
  "Pick of the Season",
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
  category: "Country House",
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

async function fetchAdminProperties(): Promise<Property[]> {
  const res = await fetch("/api/admin/properties", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch properties");
  return res.json();
}

async function createProperty(data: Record<string, unknown>): Promise<Property> {
  const res = await fetch("/api/admin/properties", {
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
  const res = await fetch(`/api/admin/properties/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
  
