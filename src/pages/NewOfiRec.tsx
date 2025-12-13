import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createOfiRecContract } from "@/lib/contractService";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus, Trash2, Building2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { CONTRACTING_BODIES, OFI_REC_OPTIONS } from "@/lib/constants";
import type { Area, Center } from "@/types";

interface Organization {
    id: string; // Temporary ID for UI key
    contracting_body: string;
    selectedAreas: string[];
    selectedCenters: string[];
}

const NewOfiRec = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Global Reference Data
    const [areas, setAreas] = useState<Area[]>([]);
    const [centers, setCenters] = useState<Center[]>([]);

    // Form State
    const [duplicateFileNumberError, setDuplicateFileNumberError] = useState(false);
    const [formData, setFormData] = useState({
        file_number: "",
        referencia_interna: "",
        award_procedure: "OFI",
    });

    // Organization List State
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    // Organization Dialog State
    const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
    const [currentOrg, setCurrentOrg] = useState<Organization>({
        id: "",
        contracting_body: "",
        selectedAreas: [],
        selectedCenters: []
    });

    useEffect(() => {
        fetchAreas();
        fetchCenters();
    }, []);

    const fetchAreas = async () => {
        const { data } = await supabase.from("areas").select("*").order("name");
        if (data) setAreas(data);
    };

    const fetchCenters = async () => {
        const { data } = await supabase.from("centers").select("*").order("name");
        if (data) setCenters(data);
    };

    // Dialog Handlers
    const handleOpenOrgDialog = () => {
        setCurrentOrg({
            id: crypto.randomUUID(),
            contracting_body: "",
            selectedAreas: [],
            selectedCenters: []
        });
        setIsOrgDialogOpen(true);
    };

    const handleSaveOrg = () => {
        if (!currentOrg.contracting_body) {
            toast({ title: "Error", description: "Selecciona un òrgan de contractació", variant: "destructive" });
            return;
        }
        if (currentOrg.selectedAreas.length === 0) {
            toast({ title: "Error", description: "Selecciona almenys una àrea", variant: "destructive" });
            return;
        }

        setOrganizations([...organizations, currentOrg]);
        setIsOrgDialogOpen(false);
    };

    const handleRemoveOrg = (id: string) => {
        setOrganizations(organizations.filter(o => o.id !== id));
    };

    // Helper inside dialog
    const handleOrgAreaToggle = (areaId: string) => {
        setCurrentOrg(prev => ({
            ...prev,
            selectedAreas: prev.selectedAreas.includes(areaId)
                ? prev.selectedAreas.filter(id => id !== areaId)
                : [...prev.selectedAreas, areaId]
        }));
    };

    const handleOrgCenterToggle = (centerId: string) => {
        setCurrentOrg(prev => ({
            ...prev,
            selectedCenters: prev.selectedCenters.includes(centerId)
                ? prev.selectedCenters.filter(id => id !== centerId)
                : [...prev.selectedCenters, centerId]
        }));
    };

    const filteredCentersForDialog = currentOrg.selectedAreas.length > 0
        ? centers.filter(c => currentOrg.selectedAreas.includes(c.area_id))
        : centers;


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.file_number) {
            toast({ title: "Error", description: "El número d'expedient és obligatori", variant: "destructive" });
            return;
        }

        if (!formData.referencia_interna) {
            toast({ title: "Error", description: "La referència interna és obligatòria", variant: "destructive" });
            return;
        }

        if (organizations.length === 0) {
            toast({ title: "Error", description: "Has d'afegir almenys una organització", variant: "destructive" });
            return;
        }

        setLoading(true);

        const contractData = {
            ...formData,
            // Name is mapped to referencia_interna
            name: formData.referencia_interna,
            // Use the first organization's contracting body for the main contract field
            contracting_body: organizations[0].contracting_body,
            // Consolidate all areas/centers for the main contract relation
            areas: Array.from(new Set(organizations.flatMap(o => o.selectedAreas))),
            centers: Array.from(new Set(organizations.flatMap(o => o.selectedCenters))),
            // Pass organizations to be created as Lots
            organizations: organizations
        };

        const { data, error } = await createOfiRecContract(contractData);

        if (error) {
            if (error.code === "23505") {
                setDuplicateFileNumberError(true);
            } else {
                toast({
                    title: "Error",
                    description: "No s'ha pogut crear l'expedient",
                    variant: "destructive",
                });
            }
            setLoading(false);
            return;
        }

        toast({
            title: "Èxit",
            description: "Expedient creat correctament",
        });

        navigate(`/contractes/${data.id}`);
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/")}
                            className="mb-4"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Tornar
                        </Button>
                        <h1 className="text-3xl font-bold text-foreground">
                            Nou Expedient OFI/REC
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-card rounded-lg border p-6 space-y-4">
                            <h2 className="text-xl font-semibold mb-4">
                                Informació bàsica
                            </h2>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <Label htmlFor="award_procedure">
                                        Procediment
                                    </Label>
                                    <Select
                                        value={formData.award_procedure}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, award_procedure: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {OFI_REC_OPTIONS.map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1">
                                    <div className="flex items-center gap-2 h-5 mb-2">
                                        <Label htmlFor="file_number">
                                            Núm. d'expedient <span className="text-destructive">*</span>
                                        </Label>
                                        {duplicateFileNumberError && (
                                            <span className="text-[10px] text-destructive font-medium leading-tight">
                                                Existent.
                                            </span>
                                        )}
                                    </div>
                                    <Input
                                        id="file_number"
                                        value={formData.file_number}
                                        onChange={(e) => {
                                            setFormData({ ...formData, file_number: e.target.value });
                                            setDuplicateFileNumberError(false);
                                        }}
                                        className={duplicateFileNumberError ? "border-destructive" : ""}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label htmlFor="referencia_interna">
                                        Referència interna <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="referencia_interna"
                                        value={formData.referencia_interna}
                                        onChange={(e) =>
                                            setFormData({ ...formData, referencia_interna: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card rounded-lg border p-6 space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">
                                    Organització
                                </h2>
                                <Button type="button" onClick={handleOpenOrgDialog} variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Afegir Organització
                                </Button>
                            </div>

                            {organizations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    Cap organització afegida. Fes clic a "Afegir Organització" per començar.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {organizations.map((org, index) => (
                                        <div key={org.id} className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border">
                                            <div className="space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-primary" />
                                                    {org.contracting_body}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {org.selectedAreas.length} àrees seleccionades, {org.selectedCenters.length} centres associats.
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => handleRemoveOrg(org.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/")}
                                disabled={loading}
                            >
                                Cancel·lar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Desant...
                                    </>
                                ) : (
                                    "Crear Expedient"
                                )}
                            </Button>
                        </div>
                    </form>

                    {/* Organization Dialog */}
                    <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
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
                                        value={currentOrg.contracting_body}
                                        onValueChange={(value) =>
                                            setCurrentOrg({ ...currentOrg, contracting_body: value })
                                        }
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CONTRACTING_BODIES.map((option) => (
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
                                            Àrees <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="space-y-2 mt-2 h-48 overflow-y-auto border rounded-md p-2 bg-background">
                                            {areas.map((area) => (
                                                <div key={area.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`org-area-${area.id}`}
                                                        checked={currentOrg.selectedAreas.includes(area.id)}
                                                        onCheckedChange={() => handleOrgAreaToggle(area.id)}
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
                                            {filteredCentersForDialog.map((center) => (
                                                <div key={center.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`org-center-${center.id}`}
                                                        checked={currentOrg.selectedCenters.includes(center.id)}
                                                        onCheckedChange={() => handleOrgCenterToggle(center.id)}
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
                                <Button variant="outline" onClick={() => setIsOrgDialogOpen(false)}>Cancel·lar</Button>
                                <Button onClick={handleSaveOrg}>Guardar</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </main>
        </div>
    );
};

export default NewOfiRec;
