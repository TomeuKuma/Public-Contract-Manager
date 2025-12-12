import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CPVSelector } from "@/components/cpv/CPVSelector";
import { CPVCode } from "@/types/cpv.types";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Invoice } from "@/types";

interface InvoiceFormDialogProps {
  creditId: string;
  creditYear?: number;
  invoice?: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  availableCenters: { id: string; name: string }[];
  isOfiRec?: boolean;
}

interface InvoiceFormData {
  invoice_number: string;
  invoice_date: string;
  base_amount: string;
  vat_amount: string;
  center_id: string;
  // OFI/REC fields
  economic_year?: string;
  organic_item?: string;
  program_item?: string;
  economic_item?: string;
  accounting_document_number?: string;
  projecte_inversio?: boolean;
  codi_projecte_inversio?: string;
  modificacio?: boolean;
  prorroga?: boolean;
  register_number?: string;
  cif_nif?: string;
  awardee?: string;
  expense_description?: string;
  invoice_period_start?: string;
  invoice_period_end?: string;
  contract_type?: string;
  price_justification?: string;
  non_compliance_justification?: string;
  accumulated_duration?: string;
  cpv_code?: string;
  cpv_description?: string;
  cpv_code_id?: string;
}

export const InvoiceFormDialog = ({ creditId, creditYear, invoice, open, onOpenChange, onSuccess, availableCenters, isOfiRec = false }: InvoiceFormDialogProps) => {
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: invoice ? {
      economic_item: invoice.economic_item || "",
      accounting_document_number: invoice.accounting_document_number || "",
      projecte_inversio: invoice.projecte_inversio || false,
      codi_projecte_inversio: invoice.codi_projecte_inversio || "",
      modificacio: invoice.modificacio || false,
      prorroga: invoice.prorroga || false,
      register_number: invoice.register_number || "",
      cif_nif: invoice.cif_nif || "",
      awardee: invoice.awardee || "",
      expense_description: invoice.expense_description || "",
      invoice_period_start: invoice.invoice_period_start || "",
      invoice_period_end: invoice.invoice_period_end || "",
      contract_type: invoice.contract_type || "",
      price_justification: invoice.price_justification || "",
      non_compliance_justification: invoice.non_compliance_justification || "",
      accumulated_duration: invoice.accumulated_duration || "",
      cpv_code: invoice.cpv_code || "",
      cpv_description: invoice.cpv_description || "",
      cpv_code_id: invoice.cpv_code_id || "",
    } : {
      economic_year: new Date().getFullYear().toString(),
      projecte_inversio: false,
      modificacio: false,
      prorroga: false,
      vat_amount: "0",
    }
  });
  const [loading, setLoading] = useState(false);
  const [cpvOpen, setCpvOpen] = useState(false);
  const [selectedCpvLabel, setSelectedCpvLabel] = useState(invoice?.cpv_code ? `${invoice.cpv_code} - ${invoice.cpv_description}` : "");
  const isEdit = !!invoice;
  const isInvestmentProject = watch("projecte_inversio");

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true);
    try {
      const invoiceData = {
        credit_id: creditId,
        invoice_number: data.invoice_number,
        invoice_date: data.invoice_date,
        base_amount: parseFloat(data.base_amount),
        vat_amount: parseFloat(data.vat_amount),
        center_id: data.center_id || null,
        // OFI/REC fields
        organic_item: isOfiRec ? (data.organic_item || null) : null,
        program_item: isOfiRec ? (data.program_item || null) : null,
        economic_item: isOfiRec ? (data.economic_item || null) : null,
        accounting_document_number: isOfiRec ? (data.accounting_document_number || null) : null,
        economic_year: isOfiRec ? (parseInt(data.economic_year || "0") || null) : null,
        projecte_inversio: isOfiRec ? (data.projecte_inversio || false) : false,
        codi_projecte_inversio: isOfiRec && data.projecte_inversio ? (data.codi_projecte_inversio || null) : null,
        modificacio: isOfiRec ? (data.modificacio || false) : false,
        prorroga: isOfiRec ? (data.prorroga || false) : false,
        register_number: isOfiRec ? (data.register_number || null) : null,
        cif_nif: isOfiRec ? (data.cif_nif || null) : null,
        awardee: isOfiRec ? (data.awardee || null) : null,
        expense_description: isOfiRec ? (data.expense_description || null) : null,
        invoice_period_start: isOfiRec ? (data.invoice_period_start || null) : null,
        invoice_period_end: isOfiRec ? (data.invoice_period_end || null) : null,
        contract_type: isOfiRec ? (data.contract_type || null) : null,
        price_justification: isOfiRec ? (data.price_justification || null) : null,
        non_compliance_justification: isOfiRec ? (data.non_compliance_justification || null) : null,
        accumulated_duration: isOfiRec ? (data.accumulated_duration || null) : null,
        cpv_code: isOfiRec ? (data.cpv_code || null) : null,
        cpv_description: isOfiRec ? (data.cpv_description || null) : null,
        cpv_code_id: isOfiRec ? (data.cpv_code_id || null) : null,
      };

      if (isEdit) {
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", invoice.id);
        if (error) throw error;
        toast({ title: "Factura actualitzada correctament" });
      } else {
        const { error } = await supabase
          .from("invoices")
          .insert(invoiceData);
        if (error) throw error;
        toast({ title: "Factura creada correctament" });
      }

      onSuccess();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No s'ha pogut guardar la factura",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isOfiRec ? "max-w-4xl max-h-[90vh] overflow-y-auto" : "sm:max-w-[425px]"}>
        <DialogHeader>
          <DialogTitle>{invoice ? "Editar factura" : "Nova factura"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Número de factura *</Label>
              <Input
                id="invoice_number"
                {...register("invoice_number", { required: "El número de factura és obligatori" })}
              />
              {errors.invoice_number && (
                <p className="text-sm text-destructive">{errors.invoice_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Data d'emissió *</Label>
              <Input
                id="invoice_date"
                type="date"
                {...register("invoice_date", {
                  required: "La data és obligatòria",
                  validate: (value) => {
                    if (isOfiRec) return true;
                    const year = new Date(value).getFullYear();
                    const cYear = typeof creditYear === 'string' ? parseInt(creditYear) : creditYear;
                    return !cYear || year === cYear || "La data ha de coincidir amb l'any del crèdit";
                  }
                })}
              />
              {errors.invoice_date && (
                <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
              )}
            </div>
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
              <Label htmlFor="vat_amount">Import IVA</Label>
              <Input
                id="vat_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("vat_amount", { required: false })}
              />
            </div>
          </div>

          {/* OFI/REC: Mandatory fields moved to top */}
          {isOfiRec && (
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register_number">Nº Registre</Label>
                <Input id="register_number" {...register("register_number")} />
                {errors.register_number && <p className="text-sm text-destructive">{errors.register_number.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cif_nif">CIF/NIF *</Label>
                <Input id="cif_nif" {...register("cif_nif", { required: "CIF/NIF és obligatori" })} />
                {errors.cif_nif && <p className="text-sm text-destructive">{errors.cif_nif.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="awardee">Adjudicatari *</Label>
                <Input id="awardee" {...register("awardee", { required: "Adjudicatari és obligatori" })} />
                {errors.awardee && <p className="text-sm text-destructive">{errors.awardee.message}</p>}
              </div>
            </div>
          )}

          {!isOfiRec && (
            <div className="space-y-2">
              <Label htmlFor="center_id">Centre</Label>
              <Select
                onValueChange={(value) => register("center_id").onChange({ target: { value, name: "center_id" } })}
                defaultValue={invoice?.center_id || undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un centre" />
                </SelectTrigger>
                <SelectContent>
                  {availableCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* OFI/REC Specific Fields */}
          {isOfiRec && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-primary">Dades Addicionals</h3>

              {/* CPV Selector for OFI/REC */}
              <div className="space-y-2">
                <Label>CPV</Label>
                <Popover open={cpvOpen} onOpenChange={setCpvOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={cpvOpen} className="w-full justify-between font-normal">
                      {selectedCpvLabel || "Seleccionar CPV..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[600px] p-0" align="start">
                    <CPVSelector
                      className="border-0"
                      onSelect={(cpv: CPVCode | null) => {
                        if (cpv) {
                          setValue("cpv_code_id", cpv.id);
                          setValue("cpv_code", cpv.code);
                          setValue("cpv_description", cpv.description_ca);
                          setSelectedCpvLabel(`${cpv.code} - ${cpv.description_ca}`);
                          setCpvOpen(false);
                        } else {
                          setValue("cpv_code_id", undefined);
                          setValue("cpv_code", undefined);
                          setValue("cpv_description", undefined);
                          setSelectedCpvLabel("");
                        }
                      }}
                      selectedId={watch("cpv_code_id")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_description">Descripció de la despesa</Label>
                <Input id="expense_description" {...register("expense_description")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_period_start">Inici període factura</Label>
                  <Input id="invoice_period_start" type="date" {...register("invoice_period_start")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoice_period_end">Fi període factura</Label>
                  <Input id="invoice_period_end" type="date" {...register("invoice_period_end")} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contract_type">Tipus contractual</Label>
                  <Select onValueChange={(val) => setValue("contract_type", val)} defaultValue={invoice?.contract_type || undefined}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Subministrament">Subministrament</SelectItem>
                      <SelectItem value="Servei">Servei</SelectItem>
                      <SelectItem value="Obra">Obra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accumulated_duration">Duració acumulada</Label>
                  <Select onValueChange={(val) => setValue("accumulated_duration", val)} defaultValue={invoice?.accumulated_duration || undefined}>
                    <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Puntualment">Puntualment</SelectItem>
                      <SelectItem value="+ 1 any">+ 1 any</SelectItem>
                      <SelectItem value="+ 2 anys">+ 2 anys</SelectItem>
                      <SelectItem value="+ 3 anys">+ 3 anys</SelectItem>
                      <SelectItem value="+ 4 anys">+ 4 anys</SelectItem>
                      <SelectItem value="+ 5 anys">+ 5 anys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_justification">Justificació del preu</Label>
                <Select onValueChange={(val) => setValue("price_justification", val)} defaultValue={invoice?.price_justification || undefined}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a) Sol·licitats i comparats pressuposts de proveïdors diferents, els preus dels serveis contractats i/o subministraments efectuats s’ajusten als preus de mercat.">a) Sol·licitats i comparats pressuposts de proveïdors diferents, els preus dels serveis contractats i/o subministraments efectuats s’ajusten als preus de mercat.</SelectItem>
                    <SelectItem value="b) Els preus facturats es mantenen en les mateixes condicions que es venien aplicant durant la duració del contracte anterior">b) Els preus facturats es mantenen en les mateixes condicions que es venien aplicant durant la duració del contracte anterior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="non_compliance_justification">Justificació de l'incompliment</Label>
                <Select onValueChange={(val) => setValue("non_compliance_justification", val)} defaultValue={invoice?.non_compliance_justification || undefined}>
                  <SelectTrigger className="h-auto py-2"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent className="max-w-[calc(100vw-2rem)] md:max-w-2xl max-h-[80vh]">
                    <SelectItem value="a) Algunes despeses suposen un fraccionament per ser repetitives i gairebé periòdiques, i superen els llindars que requereix la Llei de Contractes del Sector Públic per licitar-les. ">
                      <span className="whitespace-normal block">a) Algunes despeses suposen un fraccionament per ser repetitives i gairebé periòdiques, i superen els llindars que requereix la Llei de Contractes del Sector Públic per licitar-les. </span>
                    </SelectItem>
                    <SelectItem value="b) Per finalització de contractes administratius i les corresponents prorrogues en el seu cas, i no haver començat una nova licitació o bé tot i haver sortit a licitació encara no s’ha adjudicat el nou contracte administratiu. ">
                      <span className="whitespace-normal block">b) Per finalització de contractes administratius i les corresponents prorrogues en el seu cas, i no haver començat una nova licitació o bé tot i haver sortit a licitació encara no s’ha adjudicat el nou contracte administratiu. </span>
                    </SelectItem>
                    <SelectItem value="c) Per finalització de contractes administratius i les corresponents prorrogues en el seu cas, i tot i haver sortit a licitació, l’adjudicació ha resultat deserta. ">
                      <span className="whitespace-normal block">c) Per finalització de contractes administratius i les corresponents prorrogues en el seu cas, i tot i haver sortit a licitació, l’adjudicació ha resultat deserta. </span>
                    </SelectItem>
                    <SelectItem value="d) Tot i haver sortit a licitació un nou contracte administratiu, l’adjudicació ha resultat deserta. ">
                      <span className="whitespace-normal block">d) Tot i haver sortit a licitació un nou contracte administratiu, l’adjudicació ha resultat deserta. </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <h3 className="text-sm font-semibold text-primary pt-2">Dades Pressupostàries</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="economic_year">Any</Label>
                  <Input
                    id="economic_year"
                    type="number"
                    {...register("economic_year")}
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

              <div className="space-y-2 hidden">
                {/* Hidden but kept in DOM just in case submit needs empty value */}
                <Input className="hidden" id="accounting_document_number" {...register("accounting_document_number")} />
              </div>
            </div>
          )}

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
    </Dialog >
  );
};
