import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface ContractEditDialogProps {
  contract: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}



const CONTRACTING_BODIES = [
  "UFAG Residència Llar dels Ancians",
  "UFAG Residència La Bonanova",
  "UFAG Residència Bartomeu Quetglas",
  "UFAG Residència Huialfàs",
  "UFAG Residència Oms-Sant Miquel",
  "UFAG Residència Miquel Mir",
  "UFAG Residència Sant Josep",
  "UFAG Residència Son Caulelles",
  "UFAG Direcció de les llars del menor",
  "UFAG Coordinació dels centres d'inclusió social",
  "Presidència",
  "Vicepresidència",
  "Gerència",
];

const AWARD_PROCEDURES = ["Contracte obert", "Contracte menor AD", "Contracte menor ADO"];
const CONTRACT_TYPES = ["Subministrament", "Servei", "Obra", "Concessió"];

export const ContractEditDialog = ({ contract, open, onOpenChange, onSuccess }: ContractEditDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      ...contract,
      tipus_necessitat: contract.tipus_necessitat || "Puntual"
    }
  });
  const [areas, setAreas] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingUncheck, setPendingUncheck] = useState<"extendable" | "modifiable" | null>(null);

  useEffect(() => {
    fetchAreasAndCenters();
    fetchContractAssociations();
  }, [contract.id]);

  const fetchAreasAndCenters = async () => {
    const { data: areasData } = await supabase.from("areas").select("*");
    const { data: centersData } = await supabase.from("centers").select("*");
    setAreas(areasData || []);
    setCenters(centersData || []);
  };

  const fetchContractAssociations = async () => {
    const { data: areaAssoc } = await supabase
      .from("contract_areas")
      .select("area_id")
      .eq("contract_id", contract.id);
    const { data: centerAssoc } = await supabase
      .from("contract_centers")
      .select("center_id")
      .eq("contract_id", contract.id);

    setSelectedAreas(areaAssoc?.map(a => a.area_id) || []);
    setSelectedCenters(centerAssoc?.map(c => c.center_id) || []);
  };

  const handleCheckboxChange = (field: "extendable" | "modifiable", checked: boolean) => {
    if (!checked) {
      // Check for existing data
      let hasData = false;
      if (field === "extendable") {
        hasData = contract.lots?.some((lot: any) =>
          lot.extension_start_date || lot.extension_end_date || lot.extension_communication_deadline
        );
      } else if (field === "modifiable") {
        hasData = contract.lots?.some((lot: any) =>
          lot.credits?.some((credit: any) => credit.modificacio_credit && credit.modificacio_credit !== 0)
        );
      }

      if (hasData) {
        setPendingUncheck(field);
        setWarningOpen(true);
        return;
      }
    }
    setValue(field, checked);
  };

  const confirmUncheck = () => {
    if (pendingUncheck) {
      setValue(pendingUncheck, false);
      setPendingUncheck(null);
      setWarningOpen(false);
    }
  };

  const cancelUncheck = () => {
    setPendingUncheck(null);
    setWarningOpen(false);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          name: data.name,
          file_number: data.file_number,
          dossier_number: data.dossier_number,
          tipus_necessitat: data.tipus_necessitat,
          contracting_body: data.contracting_body,
          contact_responsible: data.contact_responsible,
          award_procedure: data.award_procedure,
          contract_type: data.contract_type,
          purpose: data.purpose,
          extendable: data.extendable,
          modifiable: data.modifiable,
        })
        .eq("id", contract.id);

      if (updateError) throw updateError;

      // Cleanup if unchecked
      if (!data.extendable && contract.extendable) {
        await supabase.from("lots")
          .update({
            extension_start_date: null,
            extension_end_date: null,
            extension_communication_deadline: null
          })
          .eq("contract_id", contract.id);
      }

      if (!data.modifiable && contract.modifiable) {
        // We need to update credits. Since we can't easily do "colA - colB" in one query for all,
        // and we need to reset modification to 0.
        // We can fetch all credits for this contract (we have them in contract.lots, but better fetch fresh or use what we have)
        // Actually, we can iterate over contract.lots and their credits to generate updates.
        // But it's safer to fetch IDs.

        // For simplicity and performance, let's assume we can iterate the loaded credits.
        // But wait, if the user added credits in this session, contract.lots might be stale?
        // No, ContractDetail refreshes on success.

        const updates = [];
        if (contract.lots) {
          for (const lot of contract.lots) {
            if (lot.credits) {
              for (const credit of lot.credits) {
                if (credit.modificacio_credit !== 0) {
                  const newReal = (credit.credit_committed_d || 0) - (credit.credit_recognized_o || 0);
                  updates.push(
                    supabase.from("credits").update({
                      modificacio_credit: 0,
                      percentage_modified: 0,
                      credit_real: newReal
                    }).eq("id", credit.id)
                  );
                }
              }
            }
          }
        }
        await Promise.all(updates);
      }

      // Update area associations
      await supabase.from("contract_areas").delete().eq("contract_id", contract.id);
      if (selectedAreas.length > 0) {
        const areaInserts = selectedAreas.map(areaId => ({
          contract_id: contract.id,
          area_id: areaId,
        }));
        await supabase.from("contract_areas").insert(areaInserts);
      }

      // Update center associations
      await supabase.from("contract_centers").delete().eq("contract_id", contract.id);
      if (selectedCenters.length > 0) {
        const centerInserts = selectedCenters.map(centerId => ({
          contract_id: contract.id,
          center_id: centerId,
        }));
        await supabase.from("contract_centers").insert(centerInserts);
      }

      toast({
        title: "Èxit",
        description: "Contracte actualitzat correctament",
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating contract:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut actualitzar el contracte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar contracte</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom del contracte *</Label>
              <Input id="name" {...register("name", { required: true })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="file_number">Núm. d'expedient</Label>
                <Input id="file_number" {...register("file_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dossier_number">Núm. de dossier</Label>
                <Input id="dossier_number" {...register("dossier_number")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Àrees</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {areas.map(area => (
                  <div key={area.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedAreas.includes(area.id)}
                      onCheckedChange={(checked) => {
                        setSelectedAreas(checked
                          ? [...selectedAreas, area.id]
                          : selectedAreas.filter(id => id !== area.id)
                        );
                      }}
                    />
                    <label className="text-sm">{area.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Centres</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {centers.map(center => (
                  <div key={center.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedCenters.includes(center.id)}
                      onCheckedChange={(checked) => {
                        setSelectedCenters(checked
                          ? [...selectedCenters, center.id]
                          : selectedCenters.filter(id => id !== center.id)
                        );
                      }}
                    />
                    <label className="text-sm">{center.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipus_necessitat">Tipus de necessitat</Label>
              <Select onValueChange={(value) => setValue("tipus_necessitat", value)} defaultValue={contract.tipus_necessitat}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Puntual">Puntual</SelectItem>
                  <SelectItem value="Recurrent">Recurrent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contracting_body">Òrgan de contractació</Label>
              <Select onValueChange={(value) => setValue("contracting_body", value)} defaultValue={contract.contracting_body}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un òrgan" />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTING_BODIES.map(body => (
                    <SelectItem key={body} value={body}>{body}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_responsible">Responsable de contacte</Label>
              <Input id="contact_responsible" {...register("contact_responsible")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="award_procedure">Procediment d'adjudicació</Label>
                <Select onValueChange={(value) => setValue("award_procedure", value)} defaultValue={contract.award_procedure}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un procediment" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWARD_PROCEDURES.map(proc => (
                      <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract_type">Tipus contractual</Label>
                <Select onValueChange={(value) => setValue("contract_type", value)} defaultValue={contract.contract_type}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipus" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Objecte</Label>
              <Textarea id="purpose" {...register("purpose")} rows={3} />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extendable"
                  checked={watch("extendable")}
                  onCheckedChange={(checked) => handleCheckboxChange("extendable", checked as boolean)}
                />
                <label htmlFor="extendable" className="text-sm">Prorrogable</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="modifiable"
                  checked={watch("modifiable")}
                  onCheckedChange={(checked) => handleCheckboxChange("modifiable", checked as boolean)}
                />
                <label htmlFor="modifiable" className="text-sm">Modificable</label>
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

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advertència</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Desmarcar aquesta opció eliminarà {pendingUncheck === "extendable" ? "les dades de pròrroga" : "les modificacions de crèdit"} existents en guardar.
              Estàs segur que vols continuar?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cancelUncheck}>Cancel·lar</Button>
            <Button variant="destructive" onClick={confirmUncheck}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
