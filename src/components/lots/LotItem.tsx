import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lot, Credit, Invoice } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { CreditList } from "@/components/credits/CreditList";

interface LotItemProps {
    lot: Lot;
    contractModifiable: boolean;
    onEdit: (lot: Lot) => void;
    onDelete: (id: string) => void;
    onAddCredit: (lotId: string) => void;
    onEditCredit: (credit: Credit) => void;
    onDeleteCredit: (id: string) => void;
    onAddInvoice: (creditId: string) => void;
    onEditInvoice: (invoice: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
}

export function LotItem({
    lot,
    contractModifiable,
    onEdit,
    onDelete,
    onAddCredit,
    onEditCredit,
    onDeleteCredit,
    onAddInvoice,
    onEditInvoice,
    onDeleteInvoice,
}: LotItemProps) {
    return (
        <AccordionItem value={lot.id} className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                    <div className="text-left">
                        <h4 className="font-semibold">{lot.name}</h4>
                        <p className="text-sm text-muted-foreground">
                            {lot.awardee || "Sense adjudicatari"}
                            {lot.email_adjudicatari && (
                                <span className="text-xs text-muted-foreground block">
                                    {lot.email_adjudicatari}
                                </span>
                            )}
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
                        <Button size="sm" variant="outline" onClick={() => onEdit(lot)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar lot
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(lot.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar lot
                        </Button>
                    </div>

                    <CreditList
                        credits={lot.credits || []}
                        modifiable={contractModifiable}
                        onAdd={() => onAddCredit(lot.id)}
                        onEdit={onEditCredit}
                        onDelete={onDeleteCredit}
                        onAddInvoice={onAddInvoice}
                        onEditInvoice={onEditInvoice}
                        onDeleteInvoice={onDeleteInvoice}
                    />
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
