import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

import { Credit } from "@/types";

interface CreditFormDialogProps {
  lotId: string;
  credit?: Credit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  modifiable?: boolean;
}

interface CreditFormData {
  any: string;
  organic_item: string;
  program_item: string;
  economic_item: string;
  credit_committed_d: string;
  credit_recognized_o: string;
  credit_real: string;
  modificacio_credit: string;
  projecte_inversio: boolean;
  codi_projecte_inversio: string;
  accounting_document_number: string;
  percentage_modified: number;
}

export const CreditFormDialog = ({ lotId, credit, open, onOpenChange, onSuccess, modifiable = false }: CreditFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, setValue } = useForm<CreditFormData>({
    defaultValues: credit ? {
      ...credit,
      any: credit.any.toString(),
      credit_committed_d: credit.credit_committed_d.toString(),
      credit_recognized_o: credit.credit_recognized_o.toString(),
      credit_real: credit.credit_real.toString(),
      modificacio_credit: credit.modificacio_credit.toString(),
      percentage_modified: credit.percentage_modified || 0,
      projecte_inversio: credit.projecte_inversio,
      codi_projecte_inversio: credit.codi_projecte_inversio || "",
      accounting_document_number: credit.accounting_document_number || "",
      organic_item: credit.organic_item,
      program_item: credit.program_item,
      economic_item: credit.economic_item,
    } : {
      any: new Date().getFullYear().toString(),
      modificacio_credit: "0",
      percentage_modified: 0,
      projecte_inversio: false,
      codi_projecte_inversio: "",
      credit_committed_d: "0",
      credit_recognized_o: "0",
      credit_real: "0",
      organic_item: "",
      program_item: "",
      economic_item: "",
      accounting_document_number: ""
    }
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!credit;

  const creditCommitted = watch("credit_committed_d");
  const creditRecognized = watch("credit_recognized_o");
  const modification = watch("modificacio_credit");
  const isInvestmentProject = watch("projecte_inversio");

  useEffect(() => {
    const committed = typeof creditCommitted === 'string' ? parseFloat(creditCommitted) : (creditCommitted || 0);
    const recognized = typeof creditRecognized === 'string' ? parseFloat(creditRecognized) : (creditRecognized || 0);
    const mod = typeof modification === 'string' ? parseFloat(modification) : (modification || 0);

    // Calculate Percentage
    if (modifiable) {
      if (committed !== 0) {
        const percentage = (mod / committed) * 100;
        setValue("percentage_modified", Number(percentage.toFixed(2)));
      } else {
        setValue("percentage_modified", 0);
      }
    }

    // Calculate Real Credit
    // Formula: (Committed + Modification) - Recognized
    // If not modifiable, modification is ignored (treated as 0)
    const effectiveModification = modifiable ? mod : 0;
    const real = (committed + effectiveModification) - recognized;
    setValue("credit_real", Number(real.toFixed(2)).toString());

  }, [creditCommitted, creditRecognized, modification, modifiable, setValue]);

  const onSubmit = async (data: CreditFormData) => {
    setLoading(true);
    try {
      const creditData = {
        lot_id: lotId,
        any: parseInt(data.any) || new Date().getFullYear(),
        organic_item: data.organic_item || null,
        program_item: data.program_item || null,
        economic_item: data.economic_item || null,
        credit_committed_d: parseFloat(data.credit_committed_d) || 0,
        credit_recognized_o: parseFloat(data.credit_recognized_o) || 0,
        credit_real: parseFloat(data.credit_real) || 0,
        percentage_modified: modifiable ? (parseFloat(data.percentage_modified.toString()) || 0) : 0,
        modificacio_credit: modifiable ? (parseFloat(data.modificacio_credit) || 0) : 0,
        accounting_document_number: data.accounting_document_number || null,
        projecte_inversio: data.projecte_inversio || false,
        codi_projecte_inversio: data.projecte_inversio ? data.codi_projecte_inversio : null,
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar crèdit" : "Afegir crèdit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="any">Any *</Label>
              <Input
                id="any"
                type="number"
                {...register("any", {
                  required: true,
                  min: 1900,
                  max: 2100,
                  minLength: 4,
                  maxLength: 4
                })}
              />
            </div>
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

          {/* Line 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_committed_d">Crèdit compromès (€) *</Label>
              <Input
                id="credit_committed_d"
                type="number"
                step="0.01"
                {...register("credit_committed_d", { required: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accounting_document_number">Núm. D/AD/ADO</Label>
              <Input id="accounting_document_number" {...register("accounting_document_number")} />
            </div>
          </div>

          {/* Line 3 (Conditional) */}
          {modifiable && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="modificacio_credit">Modificació de crèdit (€)</Label>
                <Input
                  id="modificacio_credit"
                  type="number"
                  step="0.01"
                  placeholder="0,00 €"
                  {...register("modificacio_credit")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentage_modified">% Modificat</Label>
                <div className="relative">
                  <Input
                    id="percentage_modified"
                    readOnly
                    className="bg-muted"
                    {...register("percentage_modified")}
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          )}

          {/* Line 4 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_recognized_o">Crèdit reconegut O(€)</Label>
              <Input
                id="credit_recognized_o"
                type="number"
                step="0.01"
                readOnly
                className="bg-muted"
                {...register("credit_recognized_o")}
              />
            </div>
          </div>

          {/* Line 5 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credit_real">Crèdit real (€)</Label>
              <Input
                id="credit_real"
                type="number"
                step="0.01"
                readOnly
                className="bg-muted font-semibold"
                {...register("credit_real")}
              />
            </div>
          </div>

          {/* Line 6 - Investment Project */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="projecte_inversio"
                checked={watch("projecte_inversio")}
                onCheckedChange={(checked) => setValue("projecte_inversio", checked as boolean)}
              />
              <label htmlFor="projecte_inversio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Projecte d'inversió
              </label>
            </div>

            {isInvestmentProject && (
              <div className="space-y-2">
                <Label htmlFor="codi_projecte_inversio">Codi del projecte d'inversió *</Label>
                <Input
                  id="codi_projecte_inversio"
                  {...register("codi_projecte_inversio", { required: isInvestmentProject })}
                />
              </div>
            )}
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
