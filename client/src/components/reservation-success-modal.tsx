import { CheckCircle, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReservationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestEmail: string;
  confirmationCode: string;
}

export default function ReservationSuccessModal({
  isOpen,
  onClose,
  guestEmail,
  confirmationCode
}: ReservationSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-2 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <DialogTitle className="text-lg font-semibold text-green-800">
            ¡Reserva Congelada!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 text-sm">
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Correo Enviado</span>
            </div>
            <div className="text-xs text-blue-700 mb-1">Se envió a:</div>
            <div className="font-mono text-xs bg-white px-2 py-1 rounded border text-blue-900 break-all">
              {guestEmail}
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Código</span>
            </div>
            <div className="font-mono text-sm font-bold text-amber-900 bg-white px-3 py-1 rounded border text-center">
              {confirmationCode}
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <div className="text-xs text-yellow-800 font-medium mb-1">
              ¿No ves el correo?
            </div>
            <div className="text-xs text-yellow-700 space-y-1">
              <div>• Revisa carpeta SPAM</div>
              <div>• Puede tardar unos minutos</div>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded border border-green-200">
            <div className="text-xs text-green-800 font-medium mb-1">
              Siguiente Paso
            </div>
            <div className="text-xs text-green-700">
              Realiza el abono del 50% siguiendo las instrucciones del correo
            </div>
          </div>
        </div>
        
        <div className="flex justify-center pt-3">
          <Button 
            onClick={onClose}
            className="bg-olive hover:bg-olive/90 px-6 text-sm"
          >
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}