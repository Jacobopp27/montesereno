import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Image, Edit, Trash2, Upload, Eye, ArrowUp, ArrowDown } from "lucide-react";

interface HeroBanner {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminBanners() {
  const [isAddingBanner, setIsAddingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [newBanner, setNewBanner] = useState({
    title: "",
    description: "",
    imageUrl: "",
    buttonText: "",
    buttonUrl: "",
    displayOrder: 0,
    isActive: true,
  });
  const [newBannerImage, setNewBannerImage] = useState<File | null>(null);
  const [editBannerImage, setEditBannerImage] = useState<File | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: banners, isLoading } = useQuery({
    queryKey: ["/api/admin/hero-banners"],
    retry: false,
  });

  const createBannerMutation = useMutation({
    mutationFn: (bannerData: any) => apiRequest("POST", "/api/admin/hero-banners", bannerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
      setIsAddingBanner(false);
      setNewBanner({
        title: "",
        description: "",
        imageUrl: "",
        buttonText: "",
        buttonUrl: "",
        displayOrder: 0,
        isActive: true,
      });
      toast({
        title: "Éxito",
        description: "Banner creado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el banner",
        variant: "destructive",
      });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      apiRequest("PATCH", `/api/admin/hero-banners/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
      setEditingBanner(null);
      toast({
        title: "Éxito",
        description: "Banner actualizado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el banner",
        variant: "destructive",
      });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/hero-banners/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
      toast({
        title: "Éxito",
        description: "Banner eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el banner",
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      console.log(`[BANNER UPLOAD] Iniciando subida para banner ${id}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/admin/hero-banners/${id}/image`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      console.log(`[BANNER UPLOAD] Respuesta del servidor:`, response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error(`[BANNER UPLOAD] Error:`, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`[BANNER UPLOAD] Imagen subida exitosamente:`, result);
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
      toast({
        title: "Éxito",
        description: "Imagen subida exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    },
  });

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que hay al menos una imagen (archivo o URL)
    if (!newBannerImage && !newBanner.imageUrl) {
      toast({
        title: "Error",
        description: "Debes subir una imagen o proporcionar una URL",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("[BANNER UPLOAD] Iniciando subida para banner", newBanner.title, ":", {
        fileName: newBannerImage?.name,
        fileSize: newBannerImage?.size,
        fileType: newBannerImage?.type,
      });
      
      const formData = new FormData();
      formData.append('title', newBanner.title);
      formData.append('description', newBanner.description);
      formData.append('imageUrl', newBanner.imageUrl);
      formData.append('buttonText', newBanner.buttonText);
      formData.append('buttonUrl', newBanner.buttonUrl);
      formData.append('displayOrder', newBanner.displayOrder.toString());
      formData.append('isActive', newBanner.isActive.toString());
      
      // Si hay archivo, agregarlo
      if (newBannerImage) {
        formData.append('image', newBannerImage);
      }
      
      const response = await fetch('/api/admin/hero-banners', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Error creating banner');
      }
      
      const result = await response.json();
      
      // Actualizar cache y cerrar modal
      queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
      setIsAddingBanner(false);
      setNewBanner({
        title: "",
        description: "",
        imageUrl: "",
        buttonText: "",
        buttonUrl: "",
        displayOrder: 0,
        isActive: true,
      });
      setNewBannerImage(null);
      
      toast({
        title: "Éxito",
        description: "Banner creado exitosamente",
      });
    } catch (error) {
      console.error("Error creating banner:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el banner",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      try {
        console.log("[BANNER UPDATE] Iniciando actualización para banner", editingBanner.id, ":", {
          fileName: editBannerImage?.name,
          fileSize: editBannerImage?.size,
          fileType: editBannerImage?.type,
        });
        
        const formData = new FormData();
        formData.append('title', editingBanner.title);
        formData.append('description', editingBanner.description);
        formData.append('imageUrl', editingBanner.imageUrl);
        formData.append('buttonText', editingBanner.buttonText);
        formData.append('buttonUrl', editingBanner.buttonUrl);
        formData.append('displayOrder', editingBanner.displayOrder.toString());
        formData.append('isActive', editingBanner.isActive.toString());
        
        // Si hay archivo, agregarlo
        if (editBannerImage) {
          formData.append('image', editBannerImage);
        }
        
        const response = await fetch(`/api/admin/hero-banners/${editingBanner.id}`, {
          method: 'PATCH',
          body: formData,
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Error updating banner');
        }
        
        const result = await response.json();
        
        // Actualizar cache y cerrar modal
        queryClient.invalidateQueries({ queryKey: ["/api/admin/hero-banners"] });
        queryClient.invalidateQueries({ queryKey: ["/api/hero-banners"] });
        setEditingBanner(null);
        setEditBannerImage(null);
        
        toast({
          title: "Éxito",
          description: "Banner actualizado exitosamente",
        });
      } catch (error) {
        console.error("Error updating banner:", error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el banner",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteBanner = (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este banner?")) {
      deleteBannerMutation.mutate(id);
    }
  };

  const handleToggleActive = (banner: HeroBanner) => {
    updateBannerMutation.mutate({
      id: banner.id,
      updates: { isActive: !banner.isActive },
    });
  };

  const handleImageUpload = (bannerId: number, file: File) => {
    uploadImageMutation.mutate({ id: bannerId, file });
  };

  const handleMoveUp = (banner: HeroBanner) => {
    const currentIndex = banners?.findIndex((b: HeroBanner) => b.id === banner.id);
    if (currentIndex > 0) {
      updateBannerMutation.mutate({
        id: banner.id,
        updates: { displayOrder: banner.displayOrder - 1 },
      });
    }
  };

  const handleMoveDown = (banner: HeroBanner) => {
    const currentIndex = banners?.findIndex((b: HeroBanner) => b.id === banner.id);
    if (currentIndex < banners?.length - 1) {
      updateBannerMutation.mutate({
        id: banner.id,
        updates: { displayOrder: banner.displayOrder + 1 },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Cargando banners...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Banners</h1>
            <p className="text-gray-600 mt-2">Administra los banners del carrusel principal</p>
          </div>
          <Dialog open={isAddingBanner} onOpenChange={(open) => {
            setIsAddingBanner(open);
            if (!open) {
              // Limpiar estados cuando se cierre el diálogo
              setNewBanner({
                title: "",
                description: "",
                imageUrl: "",
                buttonText: "",
                buttonUrl: "",
                displayOrder: 0,
                isActive: true,
              });
              setNewBannerImage(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#7A946E] hover:bg-[#6a8460] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Banner</DialogTitle>
                <DialogDescription>
                  Completa el formulario para crear un nuevo banner
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateBanner} className="space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label htmlFor="title" className="text-sm">Título</Label>
                  <Input
                    id="title"
                    value={newBanner.title}
                    onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="description" className="text-sm">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newBanner.description}
                    onChange={(e) => setNewBanner({ ...newBanner, description: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="imageFile" className="text-sm">Subir Imagen</Label>
                  <div className="space-y-1">
                    <input
                      id="imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewBannerImage(file);
                          setNewBanner({ ...newBanner, imageUrl: "" }); // Limpiar URL cuando se selecciona archivo
                        }
                      }}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                    />
                    {newBannerImage && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <Upload className="w-3 h-3" />
                        <span>{newBannerImage.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 my-1">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-500">O</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  <div>
                    <Label htmlFor="imageUrl" className="text-sm">URL de Imagen</Label>
                    <Input
                      id="imageUrl"
                      value={newBanner.imageUrl}
                      onChange={(e) => {
                        setNewBanner({ ...newBanner, imageUrl: e.target.value });
                        if (e.target.value) {
                          setNewBannerImage(null); // Limpiar archivo cuando se ingresa URL
                        }
                      }}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      disabled={!!newBannerImage}
                      className="text-sm h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="buttonText" className="text-sm">Texto del Botón</Label>
                    <Input
                      id="buttonText"
                      value={newBanner.buttonText}
                      onChange={(e) => setNewBanner({ ...newBanner, buttonText: e.target.value })}
                      placeholder="Reservar Ahora"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayOrder" className="text-sm">Orden</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={newBanner.displayOrder}
                      onChange={(e) => setNewBanner({ ...newBanner, displayOrder: parseInt(e.target.value) })}
                      min="0"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="buttonUrl" className="text-sm">URL del Botón</Label>
                  <Input
                    id="buttonUrl"
                    value={newBanner.buttonUrl}
                    onChange={(e) => setNewBanner({ ...newBanner, buttonUrl: e.target.value })}
                    placeholder="#reservar"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isActive"
                      checked={newBanner.isActive}
                      onCheckedChange={(checked) => setNewBanner({ ...newBanner, isActive: checked })}
                    />
                    <Label htmlFor="isActive" className="text-sm">Activo</Label>
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-[#7A946E] hover:bg-[#6a8460] text-white text-sm px-4 py-2 h-8"
                    disabled={createBannerMutation.isPending}
                  >
                    {createBannerMutation.isPending ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {banners?.map((banner: HeroBanner) => (
            <Card key={banner.id} className="border-l-4 border-l-[#7A946E]">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <Image className="w-5 h-5 text-[#7A946E]" />
                    <div>
                      <CardTitle className="text-xl">{banner.title}</CardTitle>
                      <p className="text-gray-600">{banner.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={banner.isActive ? "default" : "secondary"}>
                      {banner.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      Orden: {banner.displayOrder}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Imagen actual */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <strong>Imagen:</strong>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(banner.id, file);
                            }
                          }}
                        />
                        <Button variant="outline" size="sm" className="ml-2">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Nueva
                        </Button>
                      </label>
                    </div>
                    {banner.imageUrl && (
                      <div className="relative">
                        <img 
                          src={banner.imageUrl} 
                          alt={banner.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                          onClick={() => window.open(banner.imageUrl, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Información del botón */}
                  {banner.buttonText && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Texto del Botón:</strong>
                        <p className="text-gray-600">{banner.buttonText}</p>
                      </div>
                      <div>
                        <strong>URL del Botón:</strong>
                        <p className="text-gray-600">{banner.buttonUrl}</p>
                      </div>
                    </div>
                  )}

                  {/* Controles */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveUp(banner)}
                        disabled={banners?.findIndex((b: HeroBanner) => b.id === banner.id) === 0}
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveDown(banner)}
                        disabled={banners?.findIndex((b: HeroBanner) => b.id === banner.id) === banners?.length - 1}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(banner)}
                        className={banner.isActive ? "border-orange-500 text-orange-600" : "border-green-500 text-green-600"}
                      >
                        {banner.isActive ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingBanner(banner)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        {editingBanner && (
          <Dialog open={!!editingBanner} onOpenChange={(open) => {
            if (!open) {
              setEditingBanner(null);
              setEditBannerImage(null);
            }
          }}>
            <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Banner</DialogTitle>
                <DialogDescription>
                  Modifica los datos del banner existente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateBanner} className="space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <Label htmlFor="edit-title" className="text-sm">Título</Label>
                  <Input
                    id="edit-title"
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-sm">Descripción</Label>
                  <Textarea
                    id="edit-description"
                    value={editingBanner.description}
                    onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-imageFile" className="text-sm">Subir Nueva Imagen</Label>
                  <div className="space-y-1">
                    <input
                      id="edit-imageFile"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setEditBannerImage(file);
                        }
                      }}
                      className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                    />
                    {editBannerImage && (
                      <div className="flex items-center space-x-1 text-xs text-green-600">
                        <Upload className="w-3 h-3" />
                        <span>{editBannerImage.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 my-1">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-xs text-gray-500">O</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>
                  
                  <div>
                    <Label htmlFor="edit-imageUrl" className="text-sm">URL de Imagen</Label>
                    <Input
                      id="edit-imageUrl"
                      value={editingBanner.imageUrl}
                      onChange={(e) => setEditingBanner({ ...editingBanner, imageUrl: e.target.value })}
                      placeholder="URL actual de la imagen"
                      disabled={!!editBannerImage}
                      className="text-sm h-8"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-buttonText" className="text-sm">Texto del Botón</Label>
                    <Input
                      id="edit-buttonText"
                      value={editingBanner.buttonText}
                      onChange={(e) => setEditingBanner({ ...editingBanner, buttonText: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-displayOrder" className="text-sm">Orden</Label>
                    <Input
                      id="edit-displayOrder"
                      type="number"
                      value={editingBanner.displayOrder}
                      onChange={(e) => setEditingBanner({ ...editingBanner, displayOrder: parseInt(e.target.value) })}
                      min="0"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-buttonUrl" className="text-sm">URL del Botón</Label>
                  <Input
                    id="edit-buttonUrl"
                    value={editingBanner.buttonUrl}
                    onChange={(e) => setEditingBanner({ ...editingBanner, buttonUrl: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-isActive"
                      checked={editingBanner.isActive}
                      onCheckedChange={(checked) => setEditingBanner({ ...editingBanner, isActive: checked })}
                    />
                    <Label htmlFor="edit-isActive" className="text-sm">Activo</Label>
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-[#7A946E] hover:bg-[#6a8460] text-white text-sm px-4 py-2 h-8"
                    disabled={updateBannerMutation.isPending}
                  >
                    {updateBannerMutation.isPending ? "Actualizando..." : "Actualizar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}