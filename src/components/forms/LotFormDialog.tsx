import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LotFormDialogProps {
  contractId: string;
  lot?: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const LotFormDialog = ({ contractId, lot, open, onOpenChange, onSuccess }: LotFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: lot || {}
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!lot;

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const lotData = {
        contract_id: contractId,
        name: data.name,
        awardee: data.awardee || null,
        cif_nif: data.cif_nif || null,
        cpv: data.cpv || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        extension_start_date: data.extension_start_date || null,
        extension_end_date: data.extension_end_date || null,
        extension_communication_deadline: data.extension_communication_deadline || null,
        observations: data.observations || null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("lots")
          .update(lotData)
          .eq("id", lot.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lots")
          .insert(lotData);
        if (error) throw error;
      }

      toast({
        title: "Èxit",
        description: isEdit ? "Lot actualitzat correctament" : "Lot creat correctament",
      });
      reset();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving lot:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut guardar el lot",
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
          <DialogTitle>{isEdit ? "Editar lot" : "Afegir lot"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom del lot *</Label>
            <Input id="name" {...register("name", { required: true })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="awardee">Adjudicatari</Label>
              <Input id="awardee" {...register("awardee")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cif_nif">CIF/NIF</Label>
              <Input id="cif_nif" {...register("cif_nif")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpv">CPV</Label>
            <Input id="cpv" {...register("cpv")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data d'inici</Label>
              <Input id="start_date" type="date" {...register("start_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data fi</Label>
              <Input id="end_date" type="date" {...register("end_date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="extension_start_date">Data inici pròrroga</Label>
              <Input id="extension_start_date" type="date" {...register("extension_start_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extension_end_date">Data fi pròrroga</Label>
              <Input id="extension_end_date" type="date" {...register("extension_end_date")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extension_communication_deadline">Termini comunicació pròrroga</Label>
            <Input id="extension_communication_deadline" type="date" {...register("extension_communication_deadline")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observacions</Label>
            <Textarea id="observations" {...register("observations")} rows={3} />
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
