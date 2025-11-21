import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
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
                    {credits.map((credit) => (
                        <AccordionItem key={credit.id} value={credit.id} className="border rounded">
                            <AccordionTrigger className="px-3 py-2 hover:no-underline">
                                <div className="flex items-center justify-between w-full pr-2">
                                    <div className="text-left text-sm">
                                        <span className="font-medium">
                                            {credit.any} - {credit.organic_item || "-"} / {credit.program_item || "-"} /{" "}
                                            {credit.economic_item || "-"}
                                        </span>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-semibold">{formatCurrency(credit.credit_real)}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pb-3">
                                <div className="space-y-3 pt-2">
                                    <div className={`grid ${modifiable ? "grid-cols-5" : "grid-cols-3"} gap-2 text-xs`}>
                                        <div>
                                            <p className="text-muted-foreground">Crèdit compromès:</p>
                                            <p className="font-medium">{formatCurrency(credit.credit_committed_d)}</p>
                                        </div>
                                        {modifiable && (
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
                                        {credit.projecte_inversio && (
                                            <div className="col-span-full">
                                                <Badge variant="secondary" className="mt-1">
                                                    Projecte d'inversió: {credit.codi_projecte_inversio}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => onEdit(credit)}>
                                            <Edit className="h-3 w-3 mr-1" />
                                            Editar
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onDelete(credit.id)}>
                                            <Trash2 className="h-3 w-3 mr-1" />
                                            Eliminar
                                        </Button>
                                    </div>

                                    <InvoiceList
                                        invoices={credit.invoices || []}
                                        onAdd={() => onAddInvoice(credit.id)}
                                        onEdit={onEditInvoice}
                                        onDelete={onDeleteInvoice}
                                    />
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
    );
}
