import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Lock, User, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Usuario requerido"),
  password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const { toast } = useToast();
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/admin/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido al panel de administrador",
      });
      window.location.href = "/admin";
    },
    onError: (error: any) => {
      if (error.message.includes("Admin already exists")) {
        setIsInitialSetup(true);
      }
      toast({
        title: "Error de inicio de sesión",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiRequest("POST", "/api/admin/setup", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Administrador creado",
        description: "Ahora puedes iniciar sesión",
      });
      setIsInitialSetup(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error en configuración",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if (isInitialSetup) {
      setupMutation.mutate(data);
    } else {
      loginMutation.mutate(data);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy to-forest flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-montserrat text-navy">
            {isInitialSetup ? "Configuración Inicial" : "Panel de Administrador"}
          </CardTitle>
          <p className="text-charcoal/70">
            {isInitialSetup 
              ? "Crear cuenta de administrador" 
              : "Montesereno Glamping - Ingreso Administrativo"
            }
          </p>

        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-charcoal/50" />
                        <Input {...field} className="pl-10" placeholder="Nombre de usuario" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-charcoal/50" />
                        <Input 
                          {...field} 
                          type={showPassword ? "text" : "password"}
                          className="pl-10 pr-10" 
                          placeholder="Contraseña" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 h-4 w-4 text-charcoal/50 hover:text-charcoal"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-navy hover:bg-navy/90 text-white py-3 font-montserrat font-semibold"
                disabled={loginMutation.isPending || setupMutation.isPending}
              >
                {loginMutation.isPending || setupMutation.isPending 
                  ? "Procesando..." 
                  : isInitialSetup 
                    ? "Crear Administrador" 
                    : "Iniciar Sesión"
                }
              </Button>
            </form>
          </Form>

          {!isInitialSetup && (
            <div className="mt-4 text-center">
              <Button 
                variant="ghost" 
                onClick={() => setIsInitialSetup(true)}
                className="text-sm text-charcoal/70 hover:text-navy"
              >
                ¿Primera vez? Configurar administrador
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}