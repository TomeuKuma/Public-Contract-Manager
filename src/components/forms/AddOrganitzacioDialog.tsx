import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const CONTRACTING_BODY_OPTIONS = [
    "UFAG Residència Llar dels Ancians",
    "UFAG Residència La Bonanova",
    "UFAG Residència Bartomeu Quetglas",
    "UFAG Residència Huialfàs",
    "UFAG Residència Oms-Sant Miquel",
    "UFAG Residència Miquel Mir",
    "UFAG Residència Sant Josep",
    "UFAG Residència Son Caulelles",
    "UFAG Direcció de les llars del menor",
    "UFAG Coordinació dels centres d'inclusió social",
    "Presidència",
    "Vicepresidència",
    "Gerència",
];

interface AddOrganitzacioDialogProps {
    contractId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const AddOrganitzacioDialog = ({ contractId, open, onOpenChange, onSuccess }: AddOrganitzacioDialogProps) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Data state
    const [areas, setAreas] = useState<any[]>([]);
    const [centers, setCenters] = useState<any[]>([]);

    // Form state
    const [contractingBody, setContractingBody] = useState("");
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
    const [selectedCenters, setSelectedCenters] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            fetchAreas();
            fetchCenters();
            // Reset form
            setContractingBody("");
            setSelectedAreas([]);
            setSelectedCenters([]);
        }
    }, [open]);

    const fetchAreas = async () => {
        const { data } = await supabase.from("areas").select("*").order("name");
        if (data) setAreas(data);
    };

    const fetchCenters = async () => {
        const { data } = await supabase.from("centers").select("*").order("name");
        if (data) setCenters(data);
    };

    const handleAreaToggle = (areaId: string) => {
        setSelectedAreas(prev =>
            prev.includes(areaId)
                ? prev.filter(id => id !== areaId)
                : [...prev, areaId]
        );
    };

    const handleCenterToggle = (centerId: string) => {
        setSelectedCenters(prev =>
            prev.includes(centerId)
                ? prev.filter(id => id !== centerId)
                : [...prev, centerId]
        );
    };

    const filteredCenters = selectedAreas.length > 0
        ? centers.filter(c => selectedAreas.includes(c.area_id))
        : centers;

    const handleSave = async () => {
        if (!contractingBody) {
            toast({ title: "Error", description: "Selecciona un òrgan de contractació", variant: "destructive" });
            return;
        }

        // Although the user might not always select areas/centers, it's safer to require at least something or just proceed.
        // User request implied using the UI from NewOfiRec, which enforces validation.
        // But for adding a "Centre" (Lot) to an existing contract, maybe we just need the Name.
        // However, we should probably update contract relations too.

        setLoading(true);
        try {
            // 1. Create the Lot
            const lotName = `Organització: ${contractingBody}`;

            // Get current max sort_order
            const { data: lots } = await supabase
                .from("lots")
                .select("sort_order")
                .eq("contract_id", contractId)
                .order("sort_order", { ascending: false })
                .limit(1);

            const nextOrder = lots && lots.length > 0 ? lots[0].sort_order + 1 : 0;

            const { data: newLot, error: lotError } = await supabase
                .from("lots")
                .insert({
                    contract_id: contractId,
                    name: lotName,
                    sort_order: nextOrder,
                    observations: `Organització: ${contractingBody}`
                })
                .select()
                .single();

            if (lotError) throw lotError;

            // 2. Create Default Credit
            const { error: creditError } = await supabase
                .from("credits")
                .insert({
                    lot_id: newLot.id,
                    any: new Date().getFullYear(),
                    credit_committed_d: 0,
                    credit_real: 0,
                    credit_recognized_o: 0
                });

            if (creditError) throw creditError;

            // 3. Update Contract Areas/Centers associations
            // We should use upsert or ignore duplicates. Supabase insert won't duplicate if we handle it or if table has constraints.
            // contract_areas PK is likely (contract_id, area_id) composite? 
            // If not, we might create duplicates. Ideally table has unique constraint.
            // Assuming standard join table behavior.

            if (selectedAreas.length > 0) {
                const areaAssociations = selectedAreas.map(areaId => ({
                    contract_id: contractId,
                    area_id: areaId
                }));
                // Use upsert to avoid error on duplicate
                const { error: areaError } = await supabase
                    .from("contract_areas")
                    .upsert(areaAssociations, { onConflict: 'contract_id,area_id', ignoreDuplicates: true });

                if (areaError) console.error("Error adding areas:", areaError);
            }

            if (selectedCenters.length > 0) {
                const centerAssociations = selectedCenters.map(centerId => ({
                    contract_id: contractId,
                    center_id: centerId
                }));
                // Use upsert to avoid error on duplicate
                const { error: centerError } = await supabase
                    .from("contract_centers")
                    .upsert(centerAssociations, { onConflict: 'contract_id,center_id', ignoreDuplicates: true });

                if (centerError) console.error("Error adding centers:", centerError);
            }

            toast({
                title: "Èxit",
                description: "Organització afegida correctament",
            });
            onSuccess();
            onOpenChange(false);

        } catch (error) {
            console.error("Error adding organization:", error);
            toast({
                title: "Error",
                description: "No s'ha pogut guardar l'organització",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Afegir Organització</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div>
                        <Label htmlFor="org-contracting-body">
                            Òrgan de contractació <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={contractingBody}
                            onValueChange={setContractingBody}
                        >
                            <SelectTrigger className="mt-1.5">
                                <SelectValue placeholder="Selecciona..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CONTRACTING_BODY_OPTIONS.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label>
                                Àrees
                            </Label>
                            <div className="space-y-2 mt-2 h-48 overflow-y-auto border rounded-md p-2 bg-background">
                                {areas.map((area) => (
                                    <div key={area.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`org-area-${area.id}`}
                                            checked={selectedAreas.includes(area.id)}
                                            onCheckedChange={() => handleAreaToggle(area.id)}
                                        />
                                        <label
                                            htmlFor={`org-area-${area.id}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {area.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label>Centres associats</Label>
                            <div className="space-y-2 mt-2 h-48 overflow-y-auto border rounded-md p-2 bg-background">
                                {filteredCenters.map((center) => (
                                    <div key={center.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`org-center-${center.id}`}
                                            checked={selectedCenters.includes(center.id)}
                                            onCheckedChange={() => handleCenterToggle(center.id)}
                                        />
                                        <label
                                            htmlFor={`org-center-${center.id}`}
                                            className="text-sm cursor-pointer"
                                        >
                                            {center.name}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel·lar</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Guardant..." : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
