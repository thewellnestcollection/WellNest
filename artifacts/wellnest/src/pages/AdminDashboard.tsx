import { useState } from "react";
import { useLocation } from "wouter";
import { 
  useAdminMe, 
  useAdminListProperties, 
  useCreateProperty, 
  useUpdateProperty, 
  useDeleteProperty,
  getAdminListPropertiesQueryKey,
  getListPropertiesQueryKey,
  getGetFeaturedPropertiesQueryKey,
  getGetPropertyCategoriesQueryKey
} from "@workspace/api-client-react";
import type { Property, CreatePropertyBody, UpdatePropertyBody } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Edit2, Trash2, ExternalLink, Loader2 } from "lucide-react";

const CATEGORIES = [
  "Farmhouse stays", 
  "Wild swimming spots with somewhere to stay", 
  "Treehouses", 
  "Shepherd huts / glamping", 
  "Scottish Highlands stays", 
  "Coastal retreats", 
  "Unique spots", 
  "Hidden Gems"
];

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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<CreatePropertyBody>({
    name: "",
    category: "",
    location: "",
    nightlyPrice: 0,
    guests: 2,
    facilities: [],
    contactEmail: "",
    images: [],
    featured: false
  });
  
  const [facilitiesText, setFacilitiesText] = useState("");
  const [imagesText, setImagesText] = useState("");

  // Redirect if not authenticated
  if (!sessionLoading && !adminSession?.authenticated) {
    setLocation("/admin");
    return null;
  }

  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListPropertiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetFeaturedPropertiesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPropertyCategoriesQueryKey() });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: "",
      category: "",
      location: "",
      nightlyPrice: 0,
      guests: 2,
      facilities: [],
      contactEmail: "",
      images: [],
      featured: false
    });
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
      images: property.images || [],
      featured: property.featured
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
    
    // Parse textareas back to arrays
    const parsedData = {
      ...formData,
      facilities: facilitiesText.split("\n").map(s => s.trim()).filter(Boolean),
      images: imagesText.split("\n").map(s => s.trim()).filter(Boolean)
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

  if (sessionLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif tracking-wide mb-2">Collection Management</h1>
            <p className="text-muted-foreground font-light">Manage your properties, pricing, and availability.</p>
          </div>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} className="rounded-none bg-foreground text-background hover:bg-foreground/90 uppercase text-xs tracking-widest font-medium">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{editingId ? "Edit Property" : "Add New Property"}</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Property Name</Label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
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
                    <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Cornwall, England" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input type="email" required value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Nightly Price (£)</Label>
                    <Input type="number" required min="0" value={formData.nightlyPrice} onChange={e => setFormData({...formData, nightlyPrice: Number(e.target.value)})} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Max Guests</Label>
                    <Input type="number" required min="1" value={formData.guests} onChange={e => setFormData({...formData, guests: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Facilities (One per line)</Label>
                  <Textarea 
                    rows={4} 
                    value={facilitiesText} 
                    onChange={e => setFacilitiesText(e.target.value)} 
                    placeholder="Hot tub&#10;Wood burner&#10;WiFi"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image URLs (One per line, first is main image)</Label>
                  <Textarea 
                    rows={4} 
                    value={imagesText} 
                    onChange={e => setImagesText(e.target.value)} 
                    placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  />
                </div>

                <div className="flex items-center space-x-2 border p-4">
                  <Switch 
                    id="featured" 
                    checked={formData.featured} 
                    onCheckedChange={v => setFormData({...formData, featured: v})} 
                  />
                  <Label htmlFor="featured" className="cursor-pointer">Featured Property (Shows on homepage)</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-none">Cancel</Button>
                  <Button type="submit" disabled={createProp.isPending || updateProp.isPending} className="rounded-none bg-primary text-primary-foreground hover:bg-primary/90">
                    {(createProp.isPending || updateProp.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingId ? "Save Changes" : "Create Property"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white border shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-serif">Property</TableHead>
                <TableHead className="font-serif">Category</TableHead>
                <TableHead className="font-serif text-right">Price</TableHead>
                <TableHead className="font-serif text-center">Featured</TableHead>
                <TableHead className="font-serif text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propertiesLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : properties?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-light">
                    No properties added yet.
                  </TableCell>
                </TableRow>
              ) : (
                properties?.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{property.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        {property.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {property.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      £{property.nightlyPrice}
                    </TableCell>
                    <TableCell className="text-center">
                      {property.featured ? (
                        <span className="inline-flex w-2 h-2 rounded-full bg-primary" title="Featured" />
                      ) : (
                        <span className="inline-flex w-2 h-2 rounded-full bg-border" title="Not featured" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.open(`/properties/${property.id}`, '_blank')} title="View Live">
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
      </div>
    </div>
  );
}
