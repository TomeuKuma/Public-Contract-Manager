import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ca } from "date-fns/locale";
import { Invoice } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface InvoiceListProps {
    invoices: Invoice[];
    onEdit: (invoice: Invoice) => void;
    onDelete: (id: string) => void;
    onAdd: () => void;
}

export function InvoiceList({ invoices, onEdit, onDelete, onAdd }: InvoiceListProps) {
    return (
        <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
                <h6 className="font-medium text-xs">Factures</h6>
                <Button size="sm" variant="outline" onClick={onAdd}>
                    <Plus className="h-3 w-3 mr-1" />
                    Afegir Factura
                </Button>
            </div>

            {invoices && invoices.length > 0 ? (
                <div className="space-y-2">
                    {invoices.map((invoice) => (
                        <div key={invoice.id} className="bg-muted/50 rounded p-2 text-xs">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-medium">{invoice.invoice_number}</p>
                                    <p className="text-muted-foreground">
                                        {format(new Date(invoice.invoice_date), "dd/MM/yyyy", { locale: ca })}
                                    </p>
                                    {invoice.centers && (
                                        <p className="text-muted-foreground text-[10px]">
                                            {invoice.centers.name}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                                </div>
                            </div>
                            <TooltipProvider>
                                <div className="flex gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => onEdit(invoice)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Editar factura</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button size="icon" variant="ghost" onClick={() => onDelete(invoice.id)} className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Eliminar factura</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </TooltipProvider>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                    No hi ha factures
                </p>
            )}
        </div>
    );
}
