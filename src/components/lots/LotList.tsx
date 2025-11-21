import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Lot, Credit, Invoice } from "@/types";
import { LotItem } from "./LotItem";

interface LotListProps {
    lots: Lot[];
    contractModifiable: boolean;
    onAddLot: () => void;
    onEditLot: (lot: Lot) => void;
    onDeleteLot: (id: string) => void;
    onAddCredit: (lotId: string) => void;
    onEditCredit: (credit: Credit) => void;
    onDeleteCredit: (id: string) => void;
    onAddInvoice: (creditId: string) => void;
    onEditInvoice: (invoice: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
}

export function LotList({
    lots,
    contractModifiable,
    onAddLot,
    onEditLot,
    onDeleteLot,
    onAddCredit,
    onEditCredit,
    onDeleteCredit,
    onAddInvoice,
    onEditInvoice,
    onDeleteInvoice,
}: LotListProps) {
    return (
        <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Lots</h3>
                <Button size="sm" onClick={onAddLot}>
                    <Plus className="h-4 w-4 mr-2" />
                    Afegir Lot
                </Button>
            </div>

            <div className="space-y-3">
                {lots && lots.length > 0 ? (
                    <Accordion type="single" collapsible className="space-y-3">
                        {lots.map((lot) => (
                            <LotItem
                                key={lot.id}
                                lot={lot}
                                contractModifiable={contractModifiable}
                                onEdit={onEditLot}
                                onDelete={onDeleteLot}
                                onAddCredit={onAddCredit}
                                onEditCredit={onEditCredit}
                                onDeleteCredit={onDeleteCredit}
                                onAddInvoice={onAddInvoice}
                                onEditInvoice={onEditInvoice}
                                onDeleteInvoice={onDeleteInvoice}
                            />
                        ))}
                    </Accordion>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hi ha lots associats a aquest contracte
                    </p>
                )}
            </div>
        </div>
    );
}
