# Prompt para Duplicar Sistema de Reservas de Villa al Cielo

## Pasos Previos para Duplicación

### 1. Crear Nuevo Proyecto
**Opción A - Nuevo Repl (Recomendada):**
1. Crear nuevo Repl en tu cuenta de Replit
2. Seleccionar "Node.js" como template
3. Nombrar el proyecto con el nombre del nuevo hotel
4. Copiar todos los archivos del proyecto Villa al Cielo al nuevo Repl

**Opción B - Fork:**
1. Hacer Fork de este Repl usando el botón "Fork"
2. Renombrar el proyecto forked
3. Aplicar las configuraciones específicas

### 2. Configurar Nuevo Proyecto
Una vez creado el nuevo proyecto, usar el siguiente prompt para configurarlo:

---

## Información del Nuevo Hotel

Por favor proporciona la siguiente información para configurar el nuevo sistema:

### 1. Información Básica del Hotel
- **Nombre del Hotel:** [Ejemplo: "Casa del Bosque"]
- **Slogan:** [Ejemplo: "Naturaleza y Descanso"]
- **Ubicación:** [Ejemplo: "Guatapé, Antioquia, Colombia"]
- **Descripción:** [Breve descripción del concepto y experiencia]

### 2. Configuración de Cabañas
- **Número de cabañas:** [Ejemplo: 3]
- **Nombres de las cabañas:** [Ejemplo: "Serenidad", "Armonía", "Tranquilidad"]
- **Descripción de cada cabaña:** [Breve descripción de cada una]
- **Capacidad máxima:** [Ejemplo: 2 personas por cabaña]

### 3. Estructura de Precios (en COP)
- **Precio entre semana (Dom-Jue):** [Ejemplo: $180,000]
- **Precio fin de semana (Vie-Sab):** [Ejemplo: $350,000]
- **Precio festivos:** [Ejemplo: $350,000]
- **Extras incluidos entre semana:** [Ejemplo: "Desayuno"]
- **Extras incluidos fin de semana:** [Ejemplo: "Desayuno + Kit BBQ"]
- **Precio kit BBQ adicional:** [Ejemplo: $45,000]

### 4. Configuración de Colores y Branding
- **Color principal:** [Ejemplo: "#2D5016" (verde bosque)]
- **Color secundario:** [Ejemplo: "#D4A574" (dorado claro)]
- **Color de acento:** [Ejemplo: "#8B4513" (marrón)]
- **Color de fondo:** [Ejemplo: "#F0F8E8" (verde muy claro)]
- **Logo:** [Subir archivo o proporcionar URL]

### 5. Configuración de Correos
- **Email del propietario:** [Ejemplo: "admin@casadelbosque.com"]
- **Email de respaldo:** [Ejemplo: "propietario@gmail.com"]
- **Datos bancarios para pagos:**
  - Banco: [Ejemplo: "Bancolombia"]
  - Tipo de cuenta: [Ejemplo: "Ahorros"]
  - Número de cuenta: [Ejemplo: "12345678901"]
  - Titular: [Ejemplo: "Juan Pérez"]
  - Cédula: [Ejemplo: "12.345.678"]
- **WhatsApp para pagos:** [Ejemplo: "+573001234567"]

### 6. Configuración de Disponibilidad
- **Días bloqueados permanentemente:** [Ejemplo: "Lunes" o "Ninguno"]
- **Fechas específicas bloqueadas:** [Ejemplo: "2025-03-15 a 2025-03-20"]
- **Días de la semana con restricciones:** [Ejemplo: "Domingos solo para estancias mínimas de 2 noches"]

### 7. Galería de Imágenes
- **Imágenes principales:** [Subir 8-12 imágenes del hotel]
- **Títulos de las imágenes:** [Descripción de cada imagen]
- **Orden de visualización:** [Especificar orden preferido]

### 8. Configuración de Administración
- **Usuario administrador:** [Ejemplo: "adminbosque"]
- **Contraseña administrador:** [Ejemplo: "bosque2025"]
- **Usuarios adicionales:** [Si necesitas más administradores]

### 9. Configuración de Reseñas Iniciales
- **Reseñas de muestra:** [3-5 reseñas iniciales con nombres, calificaciones y comentarios]

### 10. Configuración Técnica
- **Dominio:** [Ejemplo: "casadelbosque.com"]
- **Subdominios:** [Si aplica]
- **Integración con Google Calendar:** [Sí/No]
- **API Keys necesarias:**
  - SendGrid API Key: [Proporcionar]
  - Google Calendar API (opcional): [Proporcionar si aplica]

## Tareas de Implementación

Una vez que proporciones toda la información, el sistema realizará automáticamente:

### 1. Configuración del Backend
- ✅ Actualizar configuración de cabañas en `server/storage.ts`
- ✅ Modificar estructura de precios en `server/routes.ts`
- ✅ Configurar emails en `server/email.ts`
- ✅ Actualizar credenciales de administrador
- ✅ Configurar días bloqueados y disponibilidad

### 2. Configuración del Frontend
- ✅ Actualizar colores en `client/src/index.css`
- ✅ Cambiar textos y branding en todos los componentes
- ✅ Actualizar información de contacto y ubicación
- ✅ Configurar nueva galería de imágenes
- ✅ Actualizar formularios de reserva

### 3. Configuración de Datos
- ✅ Inicializar nuevas cabañas en la base de datos
- ✅ Cargar galería de imágenes
- ✅ Configurar reseñas iniciales
- ✅ Establecer configuración de festivos según ubicación

### 4. Configuración de Comunicaciones
- ✅ Plantillas de email personalizadas
- ✅ Configuración de SendGrid con nuevo dominio
- ✅ Instrucciones de pago actualizadas
- ✅ Enlaces de WhatsApp personalizados

### 5. Configuración de Estilos
- ✅ Aplicar nueva paleta de colores
- ✅ Actualizar logo y elementos visuales
- ✅ Adaptar diseño según la temática del hotel
- ✅ Configurar PWA con nuevos íconos

## Ejemplo de Configuración Completa

```json
{
  "hotel": {
    "name": "Casa del Bosque",
    "slogan": "Naturaleza y Descanso",
    "location": "Guatapé, Antioquia, Colombia",
    "description": "Experiencia única en medio del bosque con vistas al embalse"
  },
  "cabins": [
    {
      "name": "Serenidad",
      "description": "Cabaña con vista al bosque y ambiente relajante",
      "capacity": 2
    },
    {
      "name": "Armonía", 
      "description": "Cabaña familiar con terraza panorámica",
      "capacity": 2
    },
    {
      "name": "Tranquilidad",
      "description": "Cabaña romántica con jacuzzi privado",
      "capacity": 2
    }
  ],
  "pricing": {
    "weekday": 180000,
    "weekend": 350000,
    "holiday": 350000,
    "bbq_kit": 45000
  },
  "colors": {
    "primary": "#2D5016",
    "secondary": "#D4A574",
    "accent": "#8B4513",
    "background": "#F0F8E8"
  },
  "contact": {
    "email": "admin@casadelbosque.com",
    "whatsapp": "+573001234567",
    "bank_account": {
      "bank": "Bancolombia",
      "account": "12345678901",
      "holder": "Juan Pérez"
    }
  },
  "admin": {
    "username": "adminbosque",
    "password": "bosque2025"
  }
}
```

## Instrucciones de Uso

1. **Completa toda la información** en las secciones anteriores
2. **Sube las imágenes** necesarias para la galería
3. **Proporciona las API keys** requeridas
4. **Especifica cualquier personalización** adicional
5. **Confirma la configuración** antes de proceder

## Configuración del Nuevo Proyecto

Una vez que hayas creado el nuevo proyecto y copiado los archivos, usa este prompt completo:

---

**"Hola, he creado un nuevo proyecto de Replit copiando el sistema de Villa al Cielo. Necesito configurar este sistema para un nuevo hotel con las siguientes especificaciones:**

[Aquí pegar toda la información del hotel que completaste arriba]

**Por favor, configura automáticamente todos los archivos necesarios para que este sistema funcione con la nueva información del hotel, manteniendo toda la funcionalidad existente pero adaptada a la nueva configuración."**

---

## Archivos que Necesitan Modificación

El sistema automáticamente actualizará:

### Backend
- `server/storage.ts` - Configuración de cabañas y datos iniciales
- `server/routes.ts` - Precios y disponibilidad
- `server/email.ts` - Configuración de correos
- `shared/schema.ts` - Si hay cambios en estructura

### Frontend
- `client/src/index.css` - Paleta de colores
- `client/src/components/hero-section.tsx` - Textos principales
- `client/src/components/navigation.tsx` - Branding
- `client/src/components/booking-widget.tsx` - Configuración de reservas
- `client/src/components/contact-section.tsx` - Información de contacto
- `client/src/components/footer.tsx` - Enlaces y datos
- `client/src/pages/home.tsx` - Contenido principal
- `client/src/pages/admin-dashboard.tsx` - Credenciales admin

### Configuración
- `replit.md` - Documentación del nuevo proyecto
- `package.json` - Nombre del proyecto
- `attached_assets/` - Nuevas imágenes

### Datos Iniciales
- Cabañas con nombres y descripciones
- Galería de imágenes
- Reseñas iniciales
- Configuración de administrador

## Ventajas de la Duplicación

✅ **Proyectos Independientes** - Cada hotel tiene su propio sistema
✅ **Dominios Separados** - Cada uno con su propia URL
✅ **Configuraciones Únicas** - Precios, colores, contenido personalizado
✅ **Mantenimiento Individual** - Actualizaciones sin afectar otros proyectos
✅ **Bases de Datos Separadas** - Reservas y datos completamente independientes

Una vez que hayas creado el nuevo proyecto y copiado los archivos, proporciona la información del nuevo hotel y el sistema será configurado automáticamente.