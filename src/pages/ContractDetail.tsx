import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ContractEditDialog } from "@/components/forms/ContractEditDialog";
import { LotFormDialog } from "@/components/forms/LotFormDialog";
import { CreditFormDialog } from "@/components/forms/CreditFormDialog";
import { InvoiceFormDialog } from "@/components/forms/InvoiceFormDialog";
import { ContractHeader } from "@/components/contracts/ContractHeader";
import { LotList } from "@/components/lots/LotList";
import { Contract, Lot, Credit, Invoice } from "@/types";
import { getContractById } from "@/lib/contractService";

import { useFilters } from "@/hooks/useFilters";
import { AddOrganitzacioDialog } from "@/components/forms/AddOrganitzacioDialog";

const ContractDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { filters } = useFilters();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [editContractOpen, setEditContractOpen] = useState(false);
  const [lotDialogOpen, setLotDialogOpen] = useState(false);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [addOrganitzacioOpen, setAddOrganitzacioOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [editingCredit, setEditingCredit] = useState<Credit | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [selectedCreditId, setSelectedCreditId] = useState<string>("");

  // We need to store centers_data for the invoice form, which is not part of the Contract type
  // but is returned by the fetch logic. We can extend the state or keep it separate.
  const [availableCenters, setAvailableCenters] = useState<{ id: string; name: string }[]>([]);

  const fetchContractDetail = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await getContractById(id!, filters);

      if (error) throw new Error(error);

      if (data) {
        setContract(data as Contract);
        setAvailableCenters(data.centers_data || []);
      }
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
  }, [id, filters, toast]);

  useEffect(() => {
    if (id) {
      fetchContractDetail();
    }
  }, [id, fetchContractDetail]);

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
    if (['OFI', 'REC'].includes(contract?.award_procedure || '')) {
      setAddOrganitzacioOpen(true);
    } else {
      setEditingLot(null);
      setLotDialogOpen(true);
    }
  };

  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setLotDialogOpen(true);
  };

  const handleAddCredit = (lotId: string) => {
    setSelectedLotId(lotId);
    setEditingCredit(null);
    setCreditDialogOpen(true);
  };

  const handleEditCredit = (credit: Credit) => {
    setEditingCredit(credit);
    setCreditDialogOpen(true);
  };

  const handleAddInvoice = (creditId: string) => {
    setSelectedCreditId(creditId);
    setEditingInvoice(null);
    setInvoiceDialogOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
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
        <ContractHeader
          contract={contract}
          onEdit={() => setEditContractOpen(true)}
          onDelete={handleDelete}
          onClose={() => navigate("/")}
        />

        <div className="px-6 pb-6">
          <LotList
            lots={contract.lots || []}
            contractModifiable={contract.modifiable}
            awardProcedure={contract.award_procedure || ''}
            onAddLot={handleAddLot}
            onEditLot={handleEditLot}
            onDeleteLot={handleDeleteLot}
            onAddCredit={handleAddCredit}
            onEditCredit={handleEditCredit}
            onDeleteCredit={handleDeleteCredit}
            onAddInvoice={handleAddInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
          />
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
            isOfiRec={['OFI', 'REC'].includes(contract?.award_procedure || '')}
          />
        )}
        {addOrganitzacioOpen && (
          <AddOrganitzacioDialog
            contractId={id!}
            open={addOrganitzacioOpen}
            onOpenChange={setAddOrganitzacioOpen}
            onSuccess={fetchContractDetail}
          />
        )}
        {creditDialogOpen && (
          <CreditFormDialog
            lotId={editingCredit?.lot_id || selectedLotId}
            lot={contract?.lots?.find(l => l.id === (editingCredit?.lot_id || selectedLotId))}
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
            creditYear={
              editingInvoice
                ? contract?.lots?.flatMap(l => l.credits).find(c => c?.id === editingInvoice.credit_id)?.any
                : contract?.lots?.flatMap(l => l.credits).find(c => c?.id === selectedCreditId)?.any
            }
            invoice={editingInvoice}
            open={invoiceDialogOpen}
            onOpenChange={setInvoiceDialogOpen}
            onSuccess={fetchContractDetail}
            availableCenters={availableCenters}
            isOfiRec={['OFI', 'REC'].includes(contract?.award_procedure || '')}
          />
        )}
      </div>
    </div>
  );
};

export default ContractDetail;
