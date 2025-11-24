import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Credit, Invoice } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { InvoiceList } from "@/components/invoices/InvoiceList";

interface CreditListProps {
    credits: Credit[];
    modifiable: boolean;
    onEdit: (credit: Credit) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
    onAddInvoice: (creditId: string) => void;
    onEditInvoice: (invoice: Invoice) => void;
    onDeleteInvoice: (id: string) => void;
}

export function CreditList({
    credits,
    modifiable,
    onEdit,
    onDelete,
    onAdd,
    onAddInvoice,
    onEditInvoice,
    onDeleteInvoice,
}: CreditListProps) {
    return (
        <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-sm">Crèdits</h5>
                <Button size="sm" variant="outline" onClick={onAdd}>
                    <Plus className="h-3 w-3 mr-1" />
                    Afegir Crèdit
                </Button>
            </div>

            {credits && credits.length > 0 ? (
                <Accordion type="single" collapsible className="space-y-2">
                    {credits.map((credit) => {
                        // Determine background color based on flags
                        let bgColor = "";
                        if (credit.modificacio && credit.prorroga) {
                            bgColor = "bg-purple-50 border-purple-200";
                        } else if (credit.modificacio) {
                            bgColor = "bg-red-50 border-red-200";
                        } else if (credit.prorroga) {
                            bgColor = "bg-blue-50 border-blue-200";
                        }

                        return (
                            <AccordionItem key={credit.id} value={credit.id} className={`border rounded ${bgColor}`}>
                                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                    <div className="flex items-center justify-between w-full pr-2">
                                        <div className="text-left text-sm">
                                            <span className="font-medium">
                                                {credit.any} - {credit.organic_item || "-"} / {credit.program_item || "-"} /{" "}
                                                {credit.economic_item || "-"}
                                            </span>
                                        </div>
                                        <div className="text-right text-sm space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Compromès:</span>
                                                <span className="font-semibold">{formatCurrency(credit.credit_committed_d || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Reconegut:</span>
                                                <span className="font-semibold">{formatCurrency(credit.credit_recognized_o || 0)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Real:</span>
                                                <span className="font-semibold">{formatCurrency((credit.credit_committed_d || 0) - (credit.credit_recognized_o || 0))}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Executat %:</span>
                                                <span className="font-semibold">
                                                    {(() => {
                                                        const committed = credit.credit_committed_d || 0;
                                                        const recognized = credit.credit_recognized_o || 0;
                                                        const real = committed - recognized;
                                                        const percentage = committed !== 0 ? (1 - (real / committed)) * 100 : 0;
                                                        return `${percentage.toFixed(2)}%`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                    <div className="space-y-3 pt-2">
                                        <TooltipProvider>
                                            <div className="flex gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" onClick={() => onEdit(credit)}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Editar crèdit</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button size="icon" variant="ghost" onClick={() => onDelete(credit.id)} className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Eliminar crèdit</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TooltipProvider>

                                        <InvoiceList
                                            invoices={credit.invoices || []}
                                            onAdd={() => onAddInvoice(credit.id)}
                                            onEdit={onEditInvoice}
                                            onDelete={onDeleteInvoice}
                                        />
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                    No hi ha crèdits associats
                </p>
            )}
        </div>
    );
}
