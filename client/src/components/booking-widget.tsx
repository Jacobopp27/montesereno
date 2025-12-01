import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import ReservationSuccessModal from "./reservation-success-modal";

const bookingSchema = z.object({
  cabinId: z.number().min(1, "Debe seleccionar una cabaña"),
  guestName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  guestEmail: z.string().email("Por favor ingrese un email válido"),
  countryCode: z.string().min(1, "Debe seleccionar un código de país"),
  guestPhone: z.string().min(7, "Número de teléfono válido requerido").regex(/^[\d\s()-]+$/, "Solo números y espacios permitidos"),
  checkIn: z.string().min(1, "La fecha de entrada es requerida"),
  checkOut: z.string().min(1, "La fecha de salida es requerida"),
  guests: z.number().min(1, "Mínimo 1 huésped requerido").max(6, "Máximo 6 huéspedes permitidos"),
  totalPrice: z.number().min(0, "El precio total debe ser positivo"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

// Lista de códigos de país más comunes para América Latina
const countryCodes = [
  { code: "+57", country: "Colombia", flag: "🇨🇴", id: "CO" },
  { code: "+1", country: "Estados Unidos/Canadá", flag: "🇺🇸", id: "USCA" },
  { code: "+52", country: "México", flag: "🇲🇽", id: "MX" },
  { code: "+54", country: "Argentina", flag: "🇦🇷", id: "AR" },
  { code: "+55", country: "Brasil", flag: "🇧🇷", id: "BR" },
  { code: "+56", country: "Chile", flag: "🇨🇱", id: "CL" },
  { code: "+51", country: "Perú", flag: "🇵🇪", id: "PE" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪", id: "VE" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨", id: "EC" },
  { code: "+507", country: "Panamá", flag: "🇵🇦", id: "PA" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷", id: "CR" },
  { code: "+34", country: "España", flag: "🇪🇸", id: "ES" },
  { code: "+33", country: "Francia", flag: "🇫🇷", id: "FR" },
  { code: "+49", country: "Alemania", flag: "🇩🇪", id: "DE" },
  { code: "+44", country: "Reino Unido", flag: "🇬🇧", id: "GB" },
];

// Floating Reserve Button Component
function FloatingReserveButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show floating button when scrolled past the hero section
      const heroHeight = window.innerHeight;
      setIsVisible(window.scrollY > heroHeight - 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`fixed right-6 bottom-6 z-50 transition-all duration-500 ease-out ${
        isVisible 
          ? 'transform translate-y-0 opacity-100 scale-100' 
          : 'transform translate-y-8 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <button
        onClick={() => {
          const bookingSection = document.querySelector('[data-booking-widget]');
          if (bookingSection) {
            bookingSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        className="group bg-[#E0CBAD] hover:bg-[#d4be9a] text-[#33443C] px-8 py-4 rounded-full shadow-2xl hover:shadow-elegant-lg font-playfair font-bold text-lg transition-all duration-300 transform hover:scale-105 border-2 border-[#33443C]/20"
        data-testid="floating-reservar-button"
      >
        <span className="flex items-center gap-2">
          Reservar Ahora
          <svg 
            className="w-5 h-5 transition-transform group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </button>
    </div>
  );
}

export default function BookingWidget() {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedCabin, setSelectedCabin] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [reservationData, setReservationData] = useState<{ email: string; confirmationCode: string } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      cabinId: 0,
      guestName: "",
      guestEmail: "",
      countryCode: "+57",
      guestPhone: "",
      checkIn: "",
      checkOut: "",
      guests: 2,
      totalPrice: 0,
    },
  });

  // Fetch Colombian holidays for current year
  const currentYear = new Date().getFullYear();
  const { data: holidaysData } = useQuery({
    queryKey: ['/api/holidays', currentYear],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/holidays/${currentYear}`);
      return response.json();
    },
  });

  // Fetch cabin availability data
  const { data: cabinAvailability, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['/api/cabins/availability', dateRange.from?.toISOString().split('T')[0], dateRange.to?.toISOString().split('T')[0], form.watch('guests')],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return null;
      const startDate = dateRange.from.toISOString().split('T')[0];
      const endDate = dateRange.to.toISOString().split('T')[0];
      const guests = form.watch('guests');
      const response = await apiRequest("GET", `/api/cabins/availability?startDate=${startDate}&endDate=${endDate}&guests=${guests}`);
      return response.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const availabilityData = cabinAvailability as Array<{
    cabin: { id: number; name: string; weekdayPrice: number; weekendPrice: number };
    isAvailable: boolean;
    totalPrice: number;
    days: number;
    reservations?: Array<{
      checkIn: string;
      checkOut: string;
      status: string;
    }>;
  }> | undefined;

  // Create reservation mutation
  const createReservation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Set reservation data for success modal
      setReservationData({
        email: form.getValues('guestEmail'),
        confirmationCode: data.confirmationCode
      });
      setShowSuccessModal(true);
      
      // Reset form
      form.reset();
      setDateRange({});
      setSelectedCabin(null);
      
      queryClient.invalidateQueries({ queryKey: ['/api/cabins/availability'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error en la Reserva",
        description: error.message || "No se pudo crear la reserva. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setDateRange(range);
      if (range.from) {
        form.setValue("checkIn", range.from.toISOString().split('T')[0]);
        
        // Auto-select checkout date as next day if only from is selected
        if (!range.to) {
          const nextDay = new Date(range.from);
          nextDay.setDate(nextDay.getDate() + 1);
          setDateRange({ from: range.from, to: nextDay });
          form.setValue("checkOut", nextDay.toISOString().split('T')[0]);
        }
      }
      if (range.to) {
        form.setValue("checkOut", range.to.toISOString().split('T')[0]);
      }
    }
  };

  const onSubmit = (data: BookingFormData) => {
    if (!data.cabinId || data.totalPrice === 0) {
      toast({
        title: "Información Incompleta",
        description: "Por favor selecciona una cabaña y fechas válidas.",
        variant: "destructive",
      });
      return;
    }

    // Combinar código de país con número de teléfono
    const fullPhoneNumber = `${data.countryCode} ${data.guestPhone}`;
    
    // Crear nueva data con teléfono completo
    const submissionData = {
      ...data,
      guestPhone: fullPhoneNumber
    };

    createReservation.mutate(submissionData);
  };

  const handleCabinSelect = (cabinData: any) => {
    setSelectedCabin(cabinData);
    form.setValue("cabinId", cabinData.cabin.id);
    calculateTotalPrice(cabinData);
  };

  const calculateTotalPrice = (cabinData: any) => {
    const currentGuests = form.watch('guests');
    let finalPrice = cabinData.totalPrice;
    
    // Add extra cost for additional guests (more than 2)
    if (currentGuests > 2 && dateRange.from && dateRange.to) {
      const days = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const extraGuests = currentGuests - 2;
      const extraCost = extraGuests * 50000 * days; // 50k COP per extra person per night
      finalPrice += extraCost;
    }
    
    form.setValue("totalPrice", finalPrice);
  };

  // Recalculate price when guest count changes
  useEffect(() => {
    if (selectedCabin) {
      calculateTotalPrice(selectedCabin);
    }
  }, [form.watch('guests'), selectedCabin]);

  // Check if selected dates are available (simplified for now)
  const isDateDisabled = (date: Date) => {
    return date < new Date(); // Only disable past dates
  };

  // Check if date is a Colombian holiday
  const isHoliday = (date: Date) => {
    if (!holidaysData?.holidays) return false;
    const dateString = date.toISOString().split('T')[0];
    return holidaysData.holidays.includes(dateString);
  };

  // Get day type for visual display (colors)
  const getDayType = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const holiday = isHoliday(date);
    
    if (holiday) return 'festivo';
    if (dayOfWeek === 6 || dayOfWeek === 0) return 'fin-de-semana'; // Saturday-Sunday only
    return 'entre-semana';
  };

  return (
    <>
      {/* Floating Reserve Button - Only appears after hero */}
      <FloatingReserveButton />
      
      {/* Static Booking Section */}
      <section id="reservar" className="py-20 texture-paper" style={{backgroundColor: '#33443C'}} data-booking-widget>
        <div className="max-w-2xl mx-auto px-4">
          <Card className="shadow-elegant glass-effect" style={{backgroundColor: '#E0CBAD'}}>
            <CardContent className="p-6">
              <h3 className="font-playfair font-bold text-xl mb-4" style={{color: '#33443C'}}>Reserva tu Escape</h3>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium text-charcoal mb-2">
                      Fechas de Estadía
                      {dateRange.from && dateRange.to && (
                        <span className="ml-2 text-xs text-navy">
                          ({Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))} noche{Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''})
                        </span>
                      )}
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            dateRange.from && dateRange.to ? 'border-navy text-navy' : ''
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM/yyyy")}
                              </>
                            ) : (
                              <>
                                {format(dateRange.from, "dd/MM/yyyy")} - <span className="text-muted-foreground">Selecciona salida</span>
                              </>
                            )
                          ) : (
                            <span>Seleccionar fechas de entrada y salida</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto max-w-[95vw] p-0" align="start">
                        <div className="p-2 sm:p-3 border-b bg-muted/30">
                          <p className="text-xs text-muted-foreground mb-2">Leyenda de precios:</p>
                          <div className="flex flex-wrap gap-1 sm:gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-100 border border-blue-300 rounded"></div>
                              <span className="text-xs">Fin de semana ($450k)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-100 border border-green-300 rounded"></div>
                              <span className="text-xs">Festivo ($450k)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-100 border border-gray-300 rounded"></div>
                              <span className="text-xs">Entre semana ($350k)</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full overflow-hidden">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange.from || new Date()}
                            selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                            onSelect={handleDateSelect}
                            numberOfMonths={1}
                            disabled={isDateDisabled}
                            modifiers={{
                              holiday: (date) => isHoliday(date),
                              weekend: (date) => getDayType(date) === 'fin-de-semana',
                              weekday: (date) => getDayType(date) === 'entre-semana'
                            }}
                            modifiersClassNames={{
                              holiday: 'calendar-holiday',
                              weekend: 'calendar-weekend',
                              weekday: 'calendar-weekday'
                            }}
                            className="w-full"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    {dateRange.from && !dateRange.to && (
                      <p className="text-xs text-navy mt-1">
                        ✓ Fecha de entrada seleccionada. Ahora selecciona la fecha de salida.
                      </p>
                    )}
                    
                    {dateRange.from && dateRange.to && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Fechas seleccionadas. Verificando disponibilidad de cabañas...
                      </p>
                    )}
                  </div>
                  
                  {/* Cabin Selection - Mobile */}
                  {availabilityData && availabilityData.length > 0 && (
                    <div className="space-y-3">
                      <Label className="block text-sm font-medium text-charcoal mb-2">
                        Selecciona tu Cabaña
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({availabilityData.filter(c => c.isAvailable).length} de {availabilityData.length} disponibles)
                        </span>
                      </Label>
                      {availabilityData.map((cabin) => (
                        <div 
                          key={cabin.cabin.id}
                          className={`border-2 rounded-lg p-4 transition-all ${
                            cabin.isAvailable 
                              ? 'hover:opacity-90 cursor-pointer' 
                              : 'cursor-not-allowed opacity-60'
                          } ${
                            form.watch('cabinId') === cabin.cabin.id ? 'ring-2 ring-opacity-50' : ''
                          }`}
                          style={{
                            backgroundColor: cabin.isAvailable ? (form.watch('cabinId') === cabin.cabin.id ? '#33443C' : '#F5F2EC') : '#FEE2E2',
                            borderColor: cabin.isAvailable ? (form.watch('cabinId') === cabin.cabin.id ? '#33443C' : '#E5E7EB') : '#FECACA',
                            color: form.watch('cabinId') === cabin.cabin.id ? '#E0CBAD' : '#33443C'
                          }}
                          onClick={() => cabin.isAvailable && handleCabinSelect(cabin)}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg" style={{color: form.watch('cabinId') === cabin.cabin.id ? '#E0CBAD' : '#33443C'}}>{cabin.cabin.name}</h4>
                                {form.watch('cabinId') === cabin.cabin.id && (
                                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#E0CBAD'}}></div>
                                )}
                              </div>
                              <p className="text-sm" style={{color: form.watch('cabinId') === cabin.cabin.id ? '#E0CBAD' : '#33443C'}}>
                                {cabin.days} {cabin.days === 1 ? 'noche' : 'noches'} • Hasta 6 huéspedes
                              </p>
                              <p className="text-xs mt-1" style={{color: form.watch('cabinId') === cabin.cabin.id ? '#E0CBAD' : '#33443C'}}>
                                Incluye Desayuno
                              </p>
                              {!cabin.isAvailable && cabin.reservations && cabin.reservations.length > 0 && (
                                <p className="text-xs text-red-600 mt-1">
                                  Ocupado: {cabin.reservations.map(r => `${r.checkIn} - ${r.checkOut}`).join(', ')}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold text-lg" style={{color: form.watch('cabinId') === cabin.cabin.id ? '#E0CBAD' : '#33443C'}}>
                                ${cabin.totalPrice.toLocaleString()} COP
                              </p>
                              <p className={`text-xs font-medium ${
                                cabin.isAvailable ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {cabin.isAvailable ? '✓ Disponible' : '✗ No Disponible'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {dateRange.from && dateRange.to && isAvailabilityLoading && (
                    <div className="text-center py-4">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-navy" />
                      <p className="text-sm text-charcoal mt-2">Verificando disponibilidad...</p>
                    </div>
                  )}

                  {/* Guest Count Selector */}
                  <FormField
                    control={form.control}
                    name="guests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Huéspedes</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newValue = Math.max(1, field.value - 1);
                                field.onChange(newValue);
                              }}
                              disabled={field.value <= 1}
                            >
                              -
                            </Button>
                            <span className="w-12 text-center font-semibold">{field.value}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newValue = Math.min(6, field.value + 1);
                                field.onChange(newValue);
                              }}
                              disabled={field.value >= 6}
                            >
                              +
                            </Button>
                          </div>
                        </FormControl>
                        <div className="text-xs text-muted-foreground mt-1">
                          {form.watch('cabinId') ? (
                            <span>Montesereno Glamping: hasta 6 huéspedes</span>
                          ) : (
                            <span>Selecciona una cabaña primero</span>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ingresa tu nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="guestEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Ingresa tu email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormItem>
                    <FormLabel>Número de Teléfono</FormLabel>
                    <div className="flex space-x-2">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field }) => (
                          <FormItem className="w-32">
                            <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {countryCodes.map((country) => (
                                    <SelectItem key={country.id} value={country.code}>
                                      <span className="flex items-center space-x-2">
                                        <span>{country.flag}</span>
                                        <span>{country.code}</span>
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="guestPhone"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input type="tel" placeholder="311 123 4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </FormItem>
                  
                  {/* Note: Kit de Asado removed from new pricing model */}
                  
                  {form.watch('totalPrice') > 0 && (
                    <div className="border-t pt-4" style={{borderColor: '#33443C'}}>
                      <div className="flex justify-between items-center font-bold text-lg" style={{color: '#33443C'}}>
                        <span>Total a Pagar</span>
                        <span className="text-navy">${form.watch('totalPrice').toLocaleString()} COP</span>
                      </div>
                      <p className="text-xs text-charcoal mt-2">Incluye Desayuno</p>
                      {form.watch('cabinId') === 2 && form.watch('guests') > 2 && dateRange.from && dateRange.to && (
                        <p className="text-xs text-blue-600 mt-1">
                          Para {form.watch('guests')} personas (+${((form.watch('guests') - 2) * 50000 * Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))).toLocaleString()} COP extra)
                        </p>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[hsl(var(--nature-button))] hover:bg-[hsl(var(--nature-button-hover))] text-white py-4 font-montserrat font-semibold text-lg"
                    disabled={createReservation.isPending}
                  >
                    {createReservation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Reservar Ahora"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Success Modal */}
      {reservationData && (
        <ReservationSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false);
            setReservationData(null);
          }}
          guestEmail={reservationData.email}
          confirmationCode={reservationData.confirmationCode}
        />
      )}
    </>
  );
}