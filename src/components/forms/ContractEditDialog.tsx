import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Contract } from "@/types";
import { CONTRACTING_BODIES, AWARD_PROCEDURES, CONTRACT_TYPES } from "@/lib/constants";
import { contractSchema, ContractFormValues } from "@/lib/schemas";
import { useAreas, useCenters } from "@/hooks/useMasterData";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ContractEditDialogProps {
  contract: Contract;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ContractEditDialog = ({ contract, open, onOpenChange, onSuccess }: ContractEditDialogProps) => {
  const { toast } = useToast();
  const { data: areas = [] } = useAreas();
  const { data: centers = [] } = useCenters();

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      name: contract.name,
      file_number: contract.file_number || "",
      dossier_number: contract.dossier_number || "",
      referencia_interna: contract.referencia_interna || "",
      tipus_necessitat: (contract.tipus_necessitat as "Puntual" | "Recurrent") || "Puntual",
      contracting_body: contract.contracting_body || "",
      contact_responsible: contract.contact_responsible || "",
      award_procedure: contract.award_procedure || "",
      contract_type: contract.contract_type || "",
      purpose: contract.purpose || "",
      need_to_satisfy: contract.need_to_satisfy || "",
      observations: contract.observations || "",
      extendable: contract.extendable || false,
      modifiable: contract.modifiable || false,
    }
  });

  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingUncheck, setPendingUncheck] = useState<"extendable" | "modifiable" | null>(null);
  const [duplicateFileNumberError, setDuplicateFileNumberError] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContractAssociations();
      form.reset({
        name: contract.name,
        file_number: contract.file_number || "",
        dossier_number: contract.dossier_number || "",
        referencia_interna: contract.referencia_interna || "",
        tipus_necessitat: (contract.tipus_necessitat as "Puntual" | "Recurrent") || "Puntual",
        contracting_body: contract.contracting_body || "",
        contact_responsible: contract.contact_responsible || "",
        award_procedure: contract.award_procedure || "",
        contract_type: contract.contract_type || "",
        purpose: contract.purpose || "",
        need_to_satisfy: contract.need_to_satisfy || "",
        observations: contract.observations || "",
        extendable: contract.extendable || false,
        modifiable: contract.modifiable || false,
      });
    }
  }, [open, contract]);

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
        ) || false;
      } else if (field === "modifiable") {
        hasData = contract.lots?.some((lot: any) =>
          lot.credits?.some((credit: any) => credit.modificacio || credit.prorroga)
        ) || false;
      }

      if (hasData) {
        setPendingUncheck(field);
        setWarningOpen(true);
        return;
      }
    }
    form.setValue(field, checked);
  };

  const confirmUncheck = () => {
    if (pendingUncheck) {
      form.setValue(pendingUncheck, false);
      setPendingUncheck(null);
      setWarningOpen(false);
    }
  };

  const cancelUncheck = () => {
    setPendingUncheck(null);
    setWarningOpen(false);
  };

  const onSubmit = async (data: ContractFormValues) => {
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
          need_to_satisfy: data.need_to_satisfy,
          observations: data.observations,
          extendable: data.extendable,
          modifiable: data.modifiable,
          referencia_interna: data.referencia_interna,
        })
        .eq("id", contract.id);

      if (updateError) {
        // Check for unique constraint violation (code 23505)
        if (updateError.code === "23505") {
          setDuplicateFileNumberError(true);
          setLoading(false);
          return;
        }
        throw updateError;
      }

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom del contracte *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="file_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Núm. d'expedient</FormLabel>
                      <div className="flex flex-col gap-1">
                        {duplicateFileNumberError && (
                          <span className="text-[10px] text-destructive font-medium leading-tight">
                            Nº d'expedient existent. Modifica o elimina el contracte duplicat abans de poder crear aquest contracte.
                          </span>
                        )}
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setDuplicateFileNumberError(false);
                            }}
                            className={duplicateFileNumberError ? "border-destructive" : ""}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dossier_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Núm. de dossier</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="referencia_interna"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referència interna</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data inici del contracte</Label>
                  <Input
                    id="start_date"
                    value={contract.start_date || "-"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data fi del contracte</Label>
                  <Input
                    id="end_date"
                    value={contract.end_date || "-"}
                    readOnly
                    className="bg-muted"
                  />
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

              <FormField
                control={form.control}
                name="tipus_necessitat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipus de necessitat</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Puntual">Puntual</SelectItem>
                        <SelectItem value="Recurrent">Recurrent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contracting_body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Òrgan de contractació</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un òrgan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONTRACTING_BODIES.map(body => (
                          <SelectItem key={body} value={body}>{body}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_responsible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsable de contacte</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="award_procedure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procediment d'adjudicació</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un procediment" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AWARD_PROCEDURES.map(proc => (
                            <SelectItem key={proc} value={proc}>{proc}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipus contractual</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONTRACT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripció de l'objecte</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="need_to_satisfy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Necessitat a satisfer</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observacions</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="extendable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => handleCheckboxChange("extendable", checked as boolean)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Prorrogable
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modifiable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => handleCheckboxChange("modifiable", checked as boolean)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Modificable
                      </FormLabel>
                    </FormItem>
                  )}
                />
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
          </Form>
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

