import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Edit3, Plus, Waves, Utensils, Upload, X, Car } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface Activity {
  id: number;
  name: string;
  description: string;
  shortDescription: string;
  price: number;
  duration: string;
  location: string;
  includes: string; // JSON string
  images: string; // JSON string de URLs de imágenes
  isActive: boolean;
  iconType: string;
  createdAt: string;
  updatedAt: string;
}

const activitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  shortDescription: z.string().min(1, "La descripción corta es requerida"),
  price: z.number().min(0, "El precio debe ser positivo"),
  duration: z.string().min(1, "La duración es requerida"),
  location: z.string().min(1, "La ubicación es requerida"),
  includes: z.string().min(1, "Los incluidos son requeridos"),
  iconType: z.string().min(1, "El tipo de icono es requerido"),
  isActive: z.boolean(),
});

export default function AdminActivities() {
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    duration: "",
    location: "",
    includes: "",
    iconType: "paddle",
    isActive: true,
  });
  const [includesItems, setIncludesItems] = useState<string[]>([""]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/admin/activities"],
  });

  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      console.log('Enviando al backend:', activityData);
      return apiRequest("POST", "/api/admin/activities", activityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsAddingActivity(false);
      setNewActivity({
        name: "",
        description: "",
        shortDescription: "",
        price: 0,
        duration: "",
        location: "",
        includes: "",
        iconType: "paddle",
        isActive: true,
      });
      setIncludesItems([""]);
      toast({
        title: "Actividad creada",
        description: "La actividad ha sido creada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al crear la actividad: " + error.message,
        variant: "destructive",
      });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/admin/activities/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setEditingActivity(null);
      toast({
        title: "Actividad actualizada",
        description: "La actividad ha sido actualizada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al actualizar la actividad: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Actividad eliminada",
        description: "La actividad ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error al eliminar la actividad: " + error.message,
        variant: "destructive",
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ activityId, file }: { activityId: number; file: File }) => {
      console.log(`Iniciando subida de imagen para actividad ${activityId}:`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
      
      // Verificar tamaño del archivo
      if (file.size > 15 * 1024 * 1024) { // 15MB
        throw new Error('El archivo es muy grande. Máximo 15MB permitido.');
      }
      
      // Verificar autenticación antes de subir
      const authResponse = await fetch('/api/admin/auth', {
        credentials: 'include'
      });
      
      if (!authResponse.ok) {
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
      }
      
      const authData = await authResponse.json();
      if (!authData.authenticated) {
        throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
      }
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`/api/admin/activities/${activityId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      console.log('Respuesta del servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('Error en la respuesta:', response.status, response.statusText, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Imagen subida exitosamente:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Imagen subida con éxito:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Imagen subida",
        description: "La imagen ha sido subida exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error al subir imagen:', error);
      toast({
        title: "Error",
        description: "Error al subir la imagen: " + error.message,
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async ({ activityId, imageUrl }: { activityId: number; imageUrl: string }) => {
      console.log('Intentando eliminar imagen:', { activityId, imageUrl });
      
      const response = await fetch(`/api/admin/activities/${activityId}/images`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageUrl }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error al eliminar la imagen');
      }
      
      const result = await response.json();
      console.log('Imagen eliminada exitosamente:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('Imagen eliminada con éxito:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      toast({
        title: "Imagen eliminada",
        description: "La imagen ha sido eliminada exitosamente.",
      });
    },
    onError: (error) => {
      console.error('Error al eliminar imagen:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la imagen: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddIncludesItem = () => {
    setIncludesItems([...includesItems, ""]);
  };

  const handleRemoveIncludesItem = (index: number) => {
    if (includesItems.length > 1) {
      setIncludesItems(includesItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateIncludesItem = (index: number, value: string) => {
    const updated = [...includesItems];
    updated[index] = value;
    setIncludesItems(updated);
  };

  const handleSubmitActivity = () => {
    const includesJson = JSON.stringify(includesItems.filter(item => item.trim()));
    const activityData = {
      ...newActivity,
      includes: includesJson,
    };

    console.log('Enviando datos de actividad:', activityData);
    createActivityMutation.mutate(activityData);
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    
    // Manejar el campo includes que puede ser JSON o string simple
    let includesArray: string[] = [];
    try {
      if (activity.includes && activity.includes.startsWith('[')) {
        includesArray = JSON.parse(activity.includes);
      } else if (activity.includes) {
        // Si es un string simple, dividirlo por comas
        includesArray = activity.includes.split(',').map(item => item.trim());
      }
    } catch (error) {
      // Si falla el parse, usar como string individual
      if (activity.includes) {
        includesArray = [activity.includes];
      }
    }
    
    setIncludesItems(includesArray.length > 0 ? includesArray : [""]);
    setNewActivity({
      name: activity.name,
      description: activity.description,
      shortDescription: activity.shortDescription,
      price: activity.price,
      duration: activity.duration,
      location: activity.location,
      includes: activity.includes,
      iconType: activity.iconType,
      isActive: activity.isActive,
    });
  };

  const handleUpdateActivity = () => {
    if (!editingActivity) return;

    const includesJson = JSON.stringify(includesItems.filter(item => item.trim()));
    const updates = {
      ...newActivity,
      includes: includesJson,
    };

    updateActivityMutation.mutate({ id: editingActivity.id, updates });
  };

  const handleDeleteActivity = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta actividad?")) {
      deleteActivityMutation.mutate(id);
    }
  };

  const handleImageUpload = async (activityId: number, file: File) => {
    try {
      await uploadImageMutation.mutateAsync({ activityId, file });
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      throw error;
    }
  };

  const handleImageDelete = (activityId: number, imageUrl: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta imagen?")) {
      deleteImageMutation.mutate({ activityId, imageUrl });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getActivityIcon = (iconType: string) => {
    switch (iconType) {
      case 'paddle':
        return <Waves className="w-5 h-5" />;
      case 'dinner':
        return <Utensils className="w-5 h-5" />;
      case 'transport':
        return <Car className="w-5 h-5" />;
      default:
        return <Waves className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Error al cargar actividades</h2>
          <p className="text-earth-umber mb-4">
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <Button onClick={() => window.location.reload()} className="bg-green-700 hover:bg-green-800">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Actividades</h1>
          <p className="text-white">Administra las actividades especiales de Montesereno Glamping</p>
        </div>
        <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
          <DialogTrigger asChild>
            <Button className="bg-green-700 hover:bg-green-800">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingActivity ? "Editar Actividad" : "Agregar Nueva Actividad"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre de la Actividad</Label>
                  <Input
                    id="name"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                    placeholder="Ej: Clases de Paddle Surf"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Precio (COP)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newActivity.price}
                    onChange={(e) => setNewActivity({ ...newActivity, price: Number(e.target.value) })}
                    placeholder="150000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Descripción Corta</Label>
                <Input
                  id="shortDescription"
                  value={newActivity.shortDescription}
                  onChange={(e) => setNewActivity({ ...newActivity, shortDescription: e.target.value })}
                  placeholder="Breve descripción para mostrar en la tarjeta"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción Completa</Label>
                <Textarea
                  id="description"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  placeholder="Descripción detallada de la actividad"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duración</Label>
                  <Input
                    id="duration"
                    value={newActivity.duration}
                    onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                    placeholder="Ej: 2 horas"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Ubicación</Label>
                  <Input
                    id="location"
                    value={newActivity.location}
                    onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                    placeholder="Ej: Montesereno Glamping - Montaña"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="iconType">Tipo de Icono</Label>
                <Select value={newActivity.iconType} onValueChange={(value) => setNewActivity({ ...newActivity, iconType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paddle">Paddle Surf</SelectItem>
                    <SelectItem value="dinner">Cena</SelectItem>
                    <SelectItem value="transport">Transporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Incluye</Label>
                <div className="space-y-2">
                  {includesItems.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateIncludesItem(index, e.target.value)}
                        placeholder="Ej: Tabla de paddle surf"
                      />
                      {includesItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveIncludesItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIncludesItem}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Item
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newActivity.isActive}
                  onCheckedChange={(checked) => setNewActivity({ ...newActivity, isActive: checked })}
                />
                <Label htmlFor="isActive">Actividad Activa</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingActivity(false);
                    setEditingActivity(null);
                    setNewActivity({
                      name: "",
                      description: "",
                      shortDescription: "",
                      price: 0,
                      duration: "",
                      location: "",
                      includes: "",
                      iconType: "paddle",
                      isActive: true,
                    });
                    setIncludesItems([""]);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingActivity ? handleUpdateActivity : handleSubmitActivity}
                  disabled={createActivityMutation.isPending || updateActivityMutation.isPending}
                >
                  {editingActivity ? "Actualizar" : "Crear"} Actividad
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {activities?.map((activity) => (
          <Card key={activity.id} className="border-l-4 border-l-green-600">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.iconType)}
                  <div>
                    <CardTitle className="text-xl">{activity.name}</CardTitle>
                    <CardDescription>{activity.shortDescription}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={activity.isActive ? "default" : "secondary"}>
                    {activity.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                  <span className="text-lg font-semibold text-green-700">
                    {formatPrice(activity.price)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-earth-text">{activity.description}</p>
                
                {(activity.duration || activity.location) && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {activity.duration && (
                      <div>
                        <strong>Duración:</strong> {activity.duration}
                      </div>
                    )}
                    {activity.location && (
                      <div>
                        <strong>Ubicación:</strong> {activity.location}
                      </div>
                    )}
                  </div>
                )}

                {(() => {
                  // Solo mostrar la sección "Incluye" si hay contenido
                  try {
                    const includes = JSON.parse(activity.includes);
                    if (includes && includes.length > 0 && includes.some((item: string) => item.trim())) {
                      return (
                        <div>
                          <strong>Incluye:</strong>
                          <ul className="list-disc list-inside mt-1 text-sm text-earth-umber">
                            {includes.map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                  } catch (error) {
                    // Si no es JSON válido, mostrar como texto plano solo si tiene contenido
                    if (activity.includes && activity.includes.trim()) {
                      return (
                        <div>
                          <strong>Incluye:</strong>
                          <ul className="list-disc list-inside mt-1 text-sm text-earth-umber">
                            <li>{activity.includes}</li>
                          </ul>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {/* Sección de Imágenes */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <strong>Imágenes:</strong>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          console.log(`Subiendo ${files.length} imágenes para actividad ${activity.id}`);
                          files.forEach(async (file) => {
                            try {
                              await handleImageUpload(activity.id, file);
                            } catch (error) {
                              console.error('Error uploading file:', error);
                            }
                          });
                          e.target.value = '';
                        }}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploadImageMutation.isPending}>
                        <span>
                          {uploadImageMutation.isPending ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Subir Imagen(es)
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                  
                  {(() => {
                    try {
                      let images: string[] = [];
                      
                      if (activity.images) {
                        if (activity.images.startsWith('[')) {
                          // Es un JSON array
                          images = JSON.parse(activity.images);
                        } else {
                          // Es una URL individual
                          images = [activity.images];
                        }
                      }
                      
                      console.log(`Imágenes para actividad ${activity.id}:`, images);
                      
                      if (images.length > 0) {
                        return (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {images.map((imageUrl: string, index: number) => (
                              <div key={index} className="relative group">
                                <img
                                  src={imageUrl}
                                  alt={`Imagen ${index + 1} de ${activity.name}`}
                                  className="w-full h-24 object-cover rounded-lg border"
                                  onError={(e) => {
                                    console.error(`Error cargando imagen: ${imageUrl}`);
                                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                                  }}
                                  onLoad={() => {
                                    console.log(`Imagen cargada exitosamente: ${imageUrl}`);
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    console.log('Botón eliminar clickeado:', { activityId: activity.id, imageUrl });
                                    handleImageDelete(activity.id, imageUrl);
                                  }}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                  disabled={deleteImageMutation.isPending}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return <p className="text-sm text-earth-clay">No hay imágenes subidas</p>;
                      }
                    } catch (error) {
                      console.error('Error parsing images JSON:', error, 'Raw images data:', activity.images);
                      return <p className="text-sm text-red-500">Error al cargar imágenes</p>;
                    }
                  })()}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleEditActivity(activity);
                      setIsAddingActivity(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    disabled={deleteActivityMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}