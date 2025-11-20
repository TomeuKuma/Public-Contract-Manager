import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface CreditFormDialogProps {
  lotId: string;
  credit?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreditFormDialog = ({ lotId, credit, open, onOpenChange, onSuccess }: CreditFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: credit || {}
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!credit;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const creditData = {
        lot_id: lotId,
        organic_item: data.organic_item || null,
        program_item: data.program_item || null,
        economic_item: data.economic_item || null,
        credit_committed_d: parseFloat(data.credit_committed_d) || 0,
        credit_recognized_o: parseFloat(data.credit_recognized_o) || 0,
        credit_real: parseFloat(data.credit_real) || 0,
        percentage_modified: parseInt(data.percentage_modified) || 0,
        accounting_document_number: data.accounting_document_number || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("credits")
          .update(creditData)
          .eq("id", credit.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("credits")
          .insert(creditData);
        if (error) throw error;
      }

      toast({
        title: "Èxit",
        description: isEdit ? "Crèdit actualitzat correctament" : "Crèdit creat correctament",
      });
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving credit:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut guardar el crèdit",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar crèdit" : "Afegir crèdit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organic_item">Orgànica</Label>
              <Input id="organic_item" {...register("organic_item")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program_item">Programa</Label>
              <Input id="program_item" {...register("program_item")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="economic_item">Econòmica</Label>
              <Input id="economic_item" {...register("economic_item")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_committed_d">Crèdit compromès D *</Label>
              <Input 
                id="credit_committed_d" 
                type="number" 
                step="0.01"
                {...register("credit_committed_d", { required: true })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit_recognized_o">Crèdit reconegut O</Label>
              <Input 
                id="credit_recognized_o" 
                type="number" 
                step="0.01"
                {...register("credit_recognized_o")} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_real">Crèdit real</Label>
              <Input 
                id="credit_real" 
                type="number" 
                step="0.01"
                {...register("credit_real")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage_modified">% Modificat</Label>
              <Input 
                id="percentage_modified" 
                type="number" 
                {...register("percentage_modified")} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accounting_document_number">Núm. document comptable</Label>
            <Input id="accounting_document_number" {...register("accounting_document_number")} />
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
