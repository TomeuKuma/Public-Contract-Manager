import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2 } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lot, Credit, Invoice } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { CreditList } from "@/components/credits/CreditList";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { memo } from "react";

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

export const LotItem = memo(function LotItem({
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
                            <h4 className="font-semibold">{lot.name}</h4>
                            <p className="text-sm text-muted-foreground">
                                {lot.awardee || "Sense adjudicatari"}
                                {lot.email_adjudicatari && (
                                    <span className="text-xs text-muted-foreground block">
                                        {lot.email_adjudicatari}
                                    </span>
                                )}
                            </p>
                            {lot.cpv_code && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className="font-mono">{lot.cpv_code}</span>
                                    {lot.cpv_description && <span className="ml-1">- {lot.cpv_description}</span>}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="space-y-1">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-xs text-muted-foreground">Compromès:</span>
                                    <span className="text-lg font-semibold text-primary">
                                        {formatCurrency(totalCreditCommitted)}
                                    </span>
                                </div>
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
