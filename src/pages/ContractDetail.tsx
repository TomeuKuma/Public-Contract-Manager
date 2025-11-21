import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ca } from "date-fns/locale";
import { ContractEditDialog } from "@/components/forms/ContractEditDialog";
import { LotFormDialog } from "@/components/forms/LotFormDialog";
import { CreditFormDialog } from "@/components/forms/CreditFormDialog";
import { InvoiceFormDialog } from "@/components/forms/InvoiceFormDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editContractOpen, setEditContractOpen] = useState(false);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [editingCredit, setEditingCredit] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [selectedCreditId, setSelectedCreditId] = useState<string>("");

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id]);

  const fetchContractDetail = async () => {
    setLoading(true);
    try {
      const { data: contractData, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", id)
        .single();

      if (contractError) throw contractError;

      const { data: areasData } = await supabase
        .from("contract_areas")
        .select("area_id, areas(name)")
        .eq("contract_id", id);

      const { data: centersData } = await supabase
        .from("contract_centers")
        .select("center_id, centers(name)")
        .eq("contract_id", id);

      const { data: lotsData } = await supabase
        .from("lots")
        .select(`
          *,
          credits(
            *,
            invoices(*)
          )
        `)
        .eq("contract_id", id);

      const lotsWithTotals = lotsData?.map((lot) => ({
        ...lot,
        credit_real_total: lot.credits?.reduce(
          (sum: number, credit: any) => sum + (credit.credit_real || 0),
          0
        ) || 0,
      }));

      setContract({
        ...contractData,
        areas: areasData?.map((a: any) => a.areas.name) || [],
        centers: centersData?.map((c: any) => c.centers.name) || [],
        lots: lotsWithTotals || [],
      });
    } catch (error) {
      console.error("Error fetching contract:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut carregar el contracte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Estàs segur que vols eliminar aquest contracte?")) return;

    try {
      const { error } = await supabase
        .from("contracts")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Èxit",
        description: "Contracte eliminat correctament",
      });
      navigate("/");
    } catch (error) {
      console.error("Error deleting contract:", error);
      toast({
        title: "Error",
        description: "No s'ha pogut eliminar el contracte",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("ca-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm("Estàs segur que vols eliminar aquest lot?")) return;
    try {
      const { error } = await supabase.from("lots").delete().eq("id", lotId);
      if (error) throw error;
      toast({ title: "Èxit", description: "Lot eliminat correctament" });
      fetchContractDetail();
    } catch (error) {
      toast({ title: "Error", description: "No s'ha pogut eliminar el lot", variant: "destructive" });
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    if (!confirm("Estàs segur que vols eliminar aquest crèdit?")) return;
    try {
      const { error } = await supabase.from("credits").delete().eq("id", creditId);
      if (error) throw error;
      toast({ title: "Èxit", description: "Crèdit eliminat correctament" });
      fetchContractDetail();
    } catch (error) {
      toast({ title: "Error", description: "No s'ha pogut eliminar el crèdit", variant: "destructive" });
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("Estàs segur que vols eliminar aquesta factura?")) return;
    try {
      const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
      if (error) throw error;
      toast({ title: "Èxit", description: "Factura eliminada correctament" });
      fetchContractDetail();
    } catch (error) {
      toast({ title: "Error", description: "No s'ha pogut eliminar la factura", variant: "destructive" });
    }
  };

  const handleAddLot = () => {
    setEditingLot(null);
    setLotDialogOpen(true);
  };

  const handleEditLot = (lot: any) => {
    setEditingLot(lot);
    setLotDialogOpen(true);
  };

  const handleAddCredit = (lotId: string) => {
    setSelectedLotId(lotId);
    setEditingCredit(null);
    setCreditDialogOpen(true);
  };

  const handleEditCredit = (credit: any) => {
    setEditingCredit(credit);
    setCreditDialogOpen(true);
  };

  const handleAddInvoice = (creditId: string) => {
    setSelectedCreditId(creditId);
    setEditingInvoice(null);
    setInvoiceDialogOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setInvoiceDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Contracte no trobat</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{contract.name}</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditContractOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contract Details Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Número de dossier:</p>
              <p className="font-medium">
                {contract.dossier_number ? (
                  <a
                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.dossier_number.slice(
                      0,
                      -1
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {contract.dossier_number}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Número d'expedient:</p>
              <p className="font-medium">
                {contract.file_number ? (
                  <a
                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.file_number.slice(
                      0,
                      -1
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                  >
                    {contract.file_number}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tipus de necessitat:</p>
              <p className="font-medium">{contract.tipus_necessitat || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Òrgan de contractació:</p>
              <p className="font-medium">{contract.contracting_body || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Responsable de contacte:</p>
              <p className="font-medium">{contract.contact_responsible || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Procediment d'adjudicació:</p>
              <p className="font-medium">{contract.award_procedure || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tipus contractual:</p>
              <p className="font-medium">{contract.contract_type || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Característiques:</p>
              <div className="flex gap-2">
                {contract.extendable && (
                  <Badge variant="outline" className="text-primary border-primary">
                    Prorrogable
                  </Badge>
                )}
                {contract.modifiable && (
                  <Badge variant="outline" className="text-primary border-primary">
                    Modificable
                  </Badge>
                )}
                {!contract.extendable && !contract.modifiable && "-"}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Data inici:</p>
              <p className="font-medium">
                {contract.start_date
                  ? format(new Date(contract.start_date), "dd/MM/yyyy", { locale: ca })
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Data fi:</p>
              <p className="font-medium">
                {contract.end_date
                  ? format(new Date(contract.end_date), "dd/MM/yyyy", { locale: ca })
                  : "-"}
              </p>
            </div>
          </div>

          {/* Purpose */}
          {contract.purpose && (
            <div>
              <p className="text-muted-foreground text-sm mb-2">Objecte:</p>
              <p className="text-sm">{contract.purpose}</p>
            </div>
          )}

          {/* Centers */}
          {contract.centers && contract.centers.length > 0 && (
            <div>
              <p className="text-muted-foreground text-sm mb-2">Centres associats:</p>
              <div className="flex flex-wrap gap-2">
                {contract.centers.map((center: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    {center}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Lots Section */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Lots</h3>
              <Button size="sm" onClick={handleAddLot}>
                <Plus className="h-4 w-4 mr-2" />
                Afegir Lot
              </Button>
            </div>

            <div className="space-y-3">
              {contract.lots && contract.lots.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-3">
                  {contract.lots.map((lot: any) => (
                    <AccordionItem key={lot.id} value={lot.id} className="border rounded-lg">
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="text-left">
                            <h4 className="font-semibold">{lot.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {lot.awardee || "Sense adjudicatari"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-primary">
                              {formatCurrency(lot.credit_real_total)}
                            </p>
                            <p className="text-xs text-muted-foreground">Crèdit real</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                          {/* Lot Details */}
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditLot(lot)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Editar lot
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteLot(lot.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Eliminar lot
                            </Button>
                          </div>

                          {/* Credits Section */}
                          <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-sm">Crèdits</h5>
                              <Button size="sm" variant="outline" onClick={() => handleAddCredit(lot.id)}>
                                <Plus className="h-3 w-3 mr-1" />
                                Afegir Crèdit
                              </Button>
                            </div>

                            {lot.credits && lot.credits.length > 0 ? (
                              <Accordion type="single" collapsible className="space-y-2">
                                {lot.credits.map((credit: any) => (
                                  <AccordionItem key={credit.id} value={credit.id} className="border rounded">
                                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                      <div className="flex items-center justify-between w-full pr-2">
                                        <div className="text-left text-sm">
                                          <span className="font-medium">
                                            {credit.any} - {credit.organic_item || "-"} / {credit.program_item || "-"} / {credit.economic_item || "-"}
                                          </span>
                                        </div>
                                        <div className="text-right text-sm">
                                          <p className="font-semibold">{formatCurrency(credit.credit_real)}</p>
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pb-3">
                                      <div className="space-y-3 pt-2">
                                        <div className={`grid ${contract.modifiable ? "grid-cols-5" : "grid-cols-3"} gap-2 text-xs`}>
                                          <div>
                                            <p className="text-muted-foreground">Crèdit compromès:</p>
                                            <p className="font-medium">{formatCurrency(credit.credit_committed_d)}</p>
                                          </div>
                                          {contract.modifiable && (
                                            <>
                                              <div>
                                                <p className="text-muted-foreground">Modificació:</p>
                                                <p className="font-medium">{formatCurrency(credit.modificacio_credit || 0)}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground">% Modificat:</p>
                                                <p className="font-medium">{credit.percentage_modified || 0}%</p>
                                              </div>
                                            </>
                                          )}
                                          <div>
                                            <p className="text-muted-foreground">Crèdit reconegut:</p>
                                            <p className="font-medium">{formatCurrency(credit.credit_recognized_o)}</p>
                                          </div>
                                          <div>
                                            <p className="text-muted-foreground">Crèdit real:</p>
                                            <p className="font-medium">{formatCurrency(credit.credit_real)}</p>
                                          </div>
                                        </div>

                                        <div className="flex gap-2">
                                          <Button size="sm" variant="outline" onClick={() => handleEditCredit(credit)}>
                                            <Edit className="h-3 w-3 mr-1" />
                                            Editar
                                          </Button>
                                          <Button size="sm" variant="destructive" onClick={() => handleDeleteCredit(credit.id)}>
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Eliminar
                                          </Button>
                                        </div>

                                        {/* Invoices Section */}
                                        <div className="border-t pt-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <h6 className="font-medium text-xs">Factures</h6>
                                            <Button size="sm" variant="outline" onClick={() => handleAddInvoice(credit.id)}>
                                              <Plus className="h-3 w-3 mr-1" />
                                              Afegir Factura
                                            </Button>
                                          </div>

                                          {credit.invoices && credit.invoices.length > 0 ? (
                                            <div className="space-y-2">
                                              {credit.invoices.map((invoice: any) => (
                                                <div key={invoice.id} className="bg-muted/50 rounded p-2 text-xs">
                                                  <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                      <p className="font-medium">{invoice.invoice_number}</p>
                                                      <p className="text-muted-foreground">
                                                        {format(new Date(invoice.invoice_date), "dd/MM/yyyy", { locale: ca })}
                                                      </p>
                                                    </div>
                                                    <div className="text-right">
                                                      <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                                                    </div>
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleEditInvoice(invoice)}>
                                                      <Edit className="h-3 w-3 mr-1" />
                                                      Editar
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDeleteInvoice(invoice.id)}>
                                                      <Trash2 className="h-3 w-3 mr-1" />
                                                      Eliminar
                                                    </Button>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                              No hi ha factures
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                ))}
                              </Accordion>
                            ) : (
                              <p className="text-xs text-muted-foreground text-center py-2">
                                No hi ha crèdits associats
                              </p>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hi ha lots associats a aquest contracte
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Dialogs */}
        {editContractOpen && (
          <ContractEditDialog
            contract={contract}
            open={editContractOpen}
            onOpenChange={setEditContractOpen}
            onSuccess={fetchContractDetail}
          />
        )}
        {lotDialogOpen && (
          <LotFormDialog
            contractId={id!}
            lot={editingLot}
            open={lotDialogOpen}
            onOpenChange={setLotDialogOpen}
            onSuccess={fetchContractDetail}
            extendable={contract?.extendable}
          />
        )}
        {creditDialogOpen && (
          <CreditFormDialog
            lotId={editingCredit?.lot_id || selectedLotId}
            credit={editingCredit}
            open={creditDialogOpen}
            onOpenChange={setCreditDialogOpen}
            onSuccess={fetchContractDetail}
            modifiable={contract?.modifiable}
          />
        )}
        {invoiceDialogOpen && (
          <InvoiceFormDialog
            creditId={editingInvoice?.credit_id || selectedCreditId}
            invoice={editingInvoice}
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            onSuccess={fetchContractDetail}
          />
        )}
      </div>
    </div>
  );
};

export default ContractDetail;
