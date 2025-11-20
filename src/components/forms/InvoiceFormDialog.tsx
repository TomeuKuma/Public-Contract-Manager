import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface InvoiceFormDialogProps {
  creditId: string;
  invoice?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const InvoiceFormDialog = ({ creditId, invoice, open, onOpenChange, onSuccess }: InvoiceFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: invoice || {}
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!invoice;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const invoiceData = {
        credit_id: creditId,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        base_amount: parseFloat(data.base_amount),
        vat_amount: parseFloat(data.vat_amount),
      };

      if (isEdit) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", invoice.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("invoices")
          .insert(invoiceData);
        if (error) throw error;
      }

      toast({
        title: "Èxit",
        description: isEdit ? "Factura actualitzada correctament" : "Factura creada correctament",
      });
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut guardar la factura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar factura" : "Afegir factura"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice_number">Número de factura *</Label>
            <Input id="invoice_number" {...register("invoice_number", { required: true })} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice_date">Data de factura *</Label>
            <Input id="invoice_date" type="date" {...register("invoice_date", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="base_amount">Import base *</Label>
              <Input 
                id="base_amount" 
                type="number" 
                step="0.01"
                {...register("base_amount", { required: true })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vat_amount">Import IVA *</Label>
              <Input 
                id="vat_amount" 
                type="number" 
                step="0.01"
                {...register("vat_amount", { required: true })} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel·lar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardant..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
