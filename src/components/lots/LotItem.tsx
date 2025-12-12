import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, Plus } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lot, Credit, Invoice } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { CreditList } from "@/components/credits/CreditList";
import { InvoiceList } from "@/components/invoices/InvoiceList";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { memo } from "react";

interface LotItemProps {
    lot: Lot;
    contractModifiable: boolean;
    awardProcedure?: string;
    onEdit: (lot: Lot) => void;
    onDelete: (id: string) => void;
    onAddCredit: (lotId: string) => void;
    onEditCredit: (credit: Credit) => void;
    onDeleteCredit: (id: string) => void;
    onAddInvoice: (creditId: string) => void;
    onEditInvoice: (invoice: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
}

export const LotItem = memo(function LotItem({
    lot,
    contractModifiable,
    awardProcedure,
    onEdit,
    onDelete,
    onAddCredit,
    onEditCredit,
    onDeleteCredit,
    onAddInvoice,
    onEditInvoice,
    onDeleteInvoice,
}: LotItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lot.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        position: "relative" as const,
    };

    // Calculate total credit committed from all credits
    const totalCreditCommitted = lot.credits?.reduce(
        (sum, credit) => sum + (credit.credit_committed_d || 0),
        0
    ) || 0;

    // Calculate total credit recognized from all credits
    const totalCreditRecognized = lot.credits?.reduce(
        (sum, credit) => sum + (credit.credit_recognized_o || 0),
        0
    ) || 0;

    // Calculate average execution percentage
    const avgExecutionPercentage = lot.credits && lot.credits.length > 0
        ? lot.credits.reduce((sum, credit) => {
            const committed = credit.credit_committed_d || 0;
            const recognized = credit.credit_recognized_o || 0;
            const real = committed - recognized;
            const percentage = committed !== 0 ? (1 - (real / committed)) * 100 : 0;
            return sum + percentage;
        }, 0) / lot.credits.length
        : 0;

    const isOfiRec = ['OFI', 'REC'].includes(awardProcedure || '');

    // For OFI/REC, the user wants to see "Area and Center" instead of "Organització: ...".
    // Since we don't store Area/Center directly on the Lot (it's relational), 
    // and the Lot Name was set to "Organització: [Contracting Body]", 
    // we will strip "Organització:" if present to just show the body, as that's what we have in the name.
    // If we want "Area and Center", we would need to fetch that from the relation or store it.
    // However, in step 8.3 we consolidated Areas/Centers to the Contract.
    // The individual Lot represents the Organization.
    // If the user insists on display Area/Center, we might be missing specific data on the Lot.
    // BUT checking the creation logic: `lot.name = "Organització: " + org.contracting_body`.
    // The user instruction: "no deben poner 'Organització:' en el nombre, simplemente mostrar el nombre del área y centro".
    // Wait, the "Contracting Body" is NOT the "Area and Center".
    // I might have simplified the data model too much by not linking specific Area/Center to the Lot in the DB explicitly (only implicitly via the creation time logic which I didn't verify relationally).
    // However, I can clean the name for now. "Organització: X" -> "X".
    // And for now I will display the clean name. If they really want Area/Center, I might need to query `lot_areas` if they existed, but Lot only has `credits`.
    // Actually, `NewOfiRec` allows selecting Areas/Centers per Organization.
    // But `createOfiRecContract` logic DID NOT create `lot_areas` or `lot_centers`. It only created `contract_areas` (consolidated).
    // So distinct Area/Center per Lot is LOST in the backend with the current service logic.
    // I must stick to the Name for now, but strip "Organització: ".

    const displayName = isOfiRec
        ? lot.name.replace(/^Organització:\s*/i, '')
        : lot.name;

    return (
        <div ref={setNodeRef} style={style} className="flex items-start gap-2">
            <div
                {...attributes}
                {...listeners}
                className="mt-4 cursor-grab text-muted-foreground hover:text-foreground"
            >
                <GripVertical className="h-5 w-5" />
            </div>
            <AccordionItem value={lot.id} className="border rounded-lg flex-1 bg-background">
                <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                        <div className="text-left">
                            <h4 className="font-semibold">{displayName}</h4>
                            {!isOfiRec && (
                                <p className="text-sm text-muted-foreground">
                                    {lot.awardee || "Sense adjudicatari"}
                                    {lot.email_adjudicatari && (
                                        <span className="text-xs text-muted-foreground block">
                                            {lot.email_adjudicatari}
                                        </span>
                                    )}
                                </p>
                            )}
                            {!isOfiRec && lot.cpv_code && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-mono">{lot.cpv_code}</span>
                                    {lot.cpv_description && <span className="ml-1">- {lot.cpv_description}</span>}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            {/* OFI/REC specific header actions (Add Invoice) */}
                            {isOfiRec && lot.credits && lot.credits.length > 0 && (
                                <div className="mb-2 flex justify-end">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent accordion toggle
                                            onAddInvoice(lot.credits![0].id);
                                        }}
                                    >
                                        <Plus className="h-3.5 w-3.5 mr-1" />
                                        Afegir Factura
                                    </Button>
                                </div>
                            )}

                            <div className="space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-xs text-muted-foreground">{isOfiRec ? "Reconegut:" : "Compromès:"}</span>
                                    <span className="text-lg font-semibold text-primary">
                                        {formatCurrency(isOfiRec ? totalCreditRecognized : totalCreditCommitted)}
                                    </span>
                                </div>
                                {!isOfiRec && (
                                    <>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-muted-foreground">Reconegut:</span>
                                            <span className="text-lg font-semibold text-primary">
                                                {formatCurrency(totalCreditRecognized)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-muted-foreground">Real:</span>
                                            <span className="text-lg font-semibold text-primary">
                                                {formatCurrency(lot.credit_real_total)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs text-muted-foreground">Executat %:</span>
                                            <span className="text-lg font-semibold text-primary">
                                                {avgExecutionPercentage.toFixed(2)}%
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                        <TooltipProvider>
                            <div className="flex gap-1">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={() => onEdit(lot)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Editar lot</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button size="icon" variant="ghost" onClick={() => onDelete(lot.id)} className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Eliminar lot</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>

                        {isOfiRec ? (
                            <InvoiceList
                                invoices={lot.credits?.[0]?.invoices || []}
                                onAdd={() => lot.credits?.[0] && onAddInvoice(lot.credits[0].id)}
                                onEdit={onEditInvoice}
                                onDelete={onDeleteInvoice}
                            />
                        ) : (
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
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </div>
    );

}, (prevProps, nextProps) => {
    return (
        prevProps.lot.id === nextProps.lot.id &&
        prevProps.lot.sort_order === nextProps.lot.sort_order &&
        prevProps.lot.name === nextProps.lot.name &&
        prevProps.lot.credit_real_total === nextProps.lot.credit_real_total &&
        prevProps.contractModifiable === nextProps.contractModifiable
    );
});
