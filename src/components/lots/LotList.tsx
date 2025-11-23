import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Lot, Credit, Invoice } from "@/types";
import { LotItem } from "./LotItem";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import { updateLotOrder } from "@/lib/contractService";
import { useToast } from "@/hooks/use-toast";

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
    lots: initialLots,
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
    const [lots, setLots] = useState<Lot[]>(initialLots);
    const { toast } = useToast();

    useEffect(() => {
        setLots(initialLots);
    }, [initialLots]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLots((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Prepare updates for DB
                const updates = newItems.map((lot, index) => ({
                    id: lot.id,
                    sort_order: index,
                    contract_id: lot.contract_id,
                    name: lot.name,
                }));

                // Call service to update order
                updateLotOrder(updates).then(({ error }) => {
                    if (error) {
                        toast({
                            title: "Error",
                            description: "No s'ha pogut guardar l'ordre dels lots",
                            variant: "destructive",
                        });
                        // Revert on error could be implemented here
                    }
                });

                return newItems;
            });
        }
    };

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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={lots.map(l => l.id)}
                            strategy={verticalListSortingStrategy}
                        >
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
                        </SortableContext>
                    </DndContext>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No hi ha lots associats a aquest contracte
                    </p>
                )}
            </div>
        </div>
    );
}
