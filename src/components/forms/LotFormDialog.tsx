import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

import { Lot } from "@/types";

interface LotFormDialogProps {
  contractId: string;
  lot?: Lot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  extendable?: boolean;
}

interface LotFormData {
  name: string;
  awardee: string;
  email_adjudicatari: string;
  cif_nif: string;
  start_date: string;
  end_date: string;
  cpv: string;
  extension_start_date: string;
  extension_end_date: string;
  extension_communication_deadline: string;
  observations: string;
}

export const LotFormDialog = ({ contractId, lot, open, onOpenChange, onSuccess, extendable = false }: LotFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<LotFormData>({
    defaultValues: lot || {}
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!lot;

  const startDate = watch("start_date");
  const endDate = watch("end_date");
  const extensionStartDate = watch("extension_start_date");

  const onSubmit = async (data: LotFormData) => {
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
        extension_start_date: extendable ? (data.extension_start_date || null) : null,
        extension_end_date: extendable ? (data.extension_end_date || null) : null,
        extension_communication_deadline: extendable ? (data.extension_communication_deadline || null) : null,
        observations: data.observations || null,
        email_adjudicatari: data.email_adjudicatari || null,
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
            <Label htmlFor="email_adjudicatari">E-mail de l'adjudicatari</Label>
            <Input id="email_adjudicatari" type="email" {...register("email_adjudicatari")} />
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

          {extendable && (
            <>
              <div className="space-y-2">
                <Label htmlFor="extension_communication_deadline">Data límit comunicació pròrroga</Label>
                <Input id="extension_communication_deadline" type="date" {...register("extension_communication_deadline")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="extension_start_date">Data inici pròrroga</Label>
                  <Input
                    id="extension_start_date"
                    type="date"
                    {...register("extension_start_date", {
                      validate: (value) => {
                        if (!value) return true;
                        if (endDate && value <= endDate) {
                          return "La data d'inici de pròrroga ha de ser posterior a la data de fi del lot";
                        }
                        return true;
                      }
                    })}
                  />
                  {errors.extension_start_date && (
                    <p className="text-sm text-destructive">{errors.extension_start_date.message as string}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="extension_end_date">Data fi pròrroga</Label>
                  <Input
                    id="extension_end_date"
                    type="date"
                    {...register("extension_end_date", {
                      validate: (value) => {
                        if (!value) return true;
                        if (extensionStartDate && value <= extensionStartDate) {
                          return "La data de fi de pròrroga ha de ser posterior a la data d'inici de pròrroga";
                        }
                        return true;
                      }
                    })}
                  />
                  {errors.extension_end_date && (
                    <p className="text-sm text-destructive">{errors.extension_end_date.message as string}</p>
                  )}
                </div>
              </div>
            </>
          )}

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
