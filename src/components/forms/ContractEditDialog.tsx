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

const INSTRUCTORS = [
  "Karen Carriel", "Marta Bonet", "Xisca Perelló", "Bartomeu Miralles",
  "María Fariñas", "Juan de Villalonga", "Elisa León", "María Mayol",
  "Francisca Roig", "Servei Jurídico-Administratiu"
];

const CONTRACTING_BODIES = [
  "UFAG Residència Llar dels Ancians", "UFAG Residència La Bonanova",
  "UFAG Residència Mare Nostrum", "UFAG Residència Reina Sofia",
  "UFAG Centre de dia Reina Sofia", "UFAG Centre de dia Can Clar",
  "UFAG Centre de dia La Vileta", "UFAG SAM", "Gerència"
];

const AWARD_PROCEDURES = ["Contracte obert", "Contracte menor AD", "Contracte menor ADO"];
const CONTRACT_TYPES = ["Subministrament", "Servei", "Obra", "Concessió"];

export const ContractEditDialog = ({ contract, open, onOpenChange, onSuccess }: ContractEditDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: contract
  });
  const [areas, setAreas] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          name: data.name,
          file_number: data.file_number,
          dossier_number: data.dossier_number,
          instructor_technician: data.instructor_technician,
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
            <Label htmlFor="instructor_technician">Tècnic instructor</Label>
            <Select onValueChange={(value) => setValue("instructor_technician", value)} defaultValue={contract.instructor_technician}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tècnic" />
              </SelectTrigger>
              <SelectContent>
                {INSTRUCTORS.map(instructor => (
                  <SelectItem key={instructor} value={instructor}>{instructor}</SelectItem>
                ))}
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
              <Checkbox id="extendable" {...register("extendable")} defaultChecked={contract.extendable} />
              <label htmlFor="extendable" className="text-sm">Prorrogable</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="modifiable" {...register("modifiable")} defaultChecked={contract.modifiable} />
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
  );
};
