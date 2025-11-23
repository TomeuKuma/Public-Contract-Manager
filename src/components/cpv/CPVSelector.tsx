import { useState, useEffect } from 'react';
import { useCPVCodes } from '@/hooks/useCPVCodes';
import { CPVCode } from '@/types/cpv.types';
import { CPV_DEPTH_LABELS, CPV_DEPTH_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Search, Loader2, Check, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface CPVSelectorProps {
    onSelect: (cpv: CPVCode) => void;
    selectedId?: string;
    contractType?: string;
    className?: string;
}

export const CPVSelector = ({ onSelect, selectedId, contractType, className }: CPVSelectorProps) => {
    const { cpvCodes, isLoading, searchParams, setSearchParams, getCPVById } = useCPVCodes();
    const [breadcrumbs, setBreadcrumbs] = useState<CPVCode[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCPV, setSelectedCPV] = useState<CPVCode | null>(null);

    // Initial load of selected CPV
    useEffect(() => {
        if (selectedId && !selectedCPV) {
            getCPVById(selectedId).then(cpv => {
                if (cpv) setSelectedCPV(cpv);
            });
        }
    }, [selectedId, getCPVById]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                setSearchParams({ query: searchTerm, contractType, limit: 50 });
                setBreadcrumbs([]); // Clear breadcrumbs on search
            } else {
                // Reset to root level or current breadcrumb level
                const currentParent = breadcrumbs[breadcrumbs.length - 1];
                setSearchParams({
                    parentCode: currentParent ? currentParent.code : undefined,
                    depthLevel: currentParent ? undefined : 1, // Start at Division (1) if no parent
                    contractType,
                    limit: 100
                });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, breadcrumbs, contractType, setSearchParams]);

    const handleNavigateDown = (cpv: CPVCode) => {
        if (cpv.depth_level < 5) {
            setBreadcrumbs([...breadcrumbs, cpv]);
            setSearchTerm(''); // Clear search when navigating
        }
    };

    const handleNavigateUp = (index: number) => {
        const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
        setBreadcrumbs(newBreadcrumbs);
        setSearchTerm('');
    };

    const handleRootClick = () => {
        setBreadcrumbs([]);
        setSearchTerm('');
    };

    const handleSelect = (cpv: CPVCode) => {
        setSelectedCPV(cpv);
        onSelect(cpv);
    };

    const clearSelection = () => {
        setSelectedCPV(null);
        onSelect(null as any);
    };

    return (
        <div className={cn("flex flex-col h-[500px] border rounded-md bg-background", className)}>
            {/* Header: Search and Breadcrumbs */}
            <div className="p-4 border-b space-y-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca per codi o descripció..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>

                {!searchTerm && (
                    <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 px-2", breadcrumbs.length === 0 && "font-bold text-foreground")}
                            onClick={handleRootClick}
                        >
                            Inici
                        </Button>
                        {breadcrumbs.map((crumb, index) => (
                            <div key={crumb.id} className="flex items-center">
                                <ChevronRight className="h-4 w-4 mx-1" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={cn("h-6 px-2 max-w-[150px] truncate", index === breadcrumbs.length - 1 && "font-bold text-foreground")}
                                    onClick={() => handleNavigateUp(index)}
                                    title={crumb.description_ca}
                                >
                                    {crumb.code}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content: List of Codes */}
            <ScrollArea className="flex-1 p-2">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : cpvCodes?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No s'han trobat resultats.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {cpvCodes?.map((cpv) => (
                            <div
                                key={cpv.id}
                                className={cn(
                                    "flex items-center justify-between p-2 rounded-md hover:bg-accent group transition-colors",
                                    selectedCPV?.id === cpv.id ? "bg-accent/50 border-primary/20 border" : "border border-transparent"
                                )}
                            >
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono font-medium text-sm">{cpv.code}</span>
                                        <Badge
                                            variant="secondary"
                                            className={cn("text-[10px] px-1 py-0 h-5", CPV_DEPTH_COLORS[cpv.depth_level as keyof typeof CPV_DEPTH_COLORS])}
                                        >
                                            {CPV_DEPTH_LABELS[cpv.depth_level as keyof typeof CPV_DEPTH_LABELS]}
                                        </Badge>
                                        {selectedCPV?.id === cpv.id && (
                                            <Badge variant="default" className="text-[10px] h-5 bg-primary">Seleccionat</Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2" title={cpv.description_ca}>
                                        {cpv.description_ca}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                                    <Button
                                        size="sm"
                                        variant={selectedCPV?.id === cpv.id ? "secondary" : "default"}
                                        onClick={() => handleSelect(cpv)}
                                    >
                                        {selectedCPV?.id === cpv.id ? "Seleccionat" : "Seleccionar"}
                                    </Button>

                                    {!searchTerm && cpv.depth_level < 5 && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleNavigateDown(cpv)}
                                            title="Veure subcategories"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer: Selected Summary */}
            {selectedCPV && (
                <div className="p-3 border-t bg-muted/30 text-sm flex justify-between items-center">
                    <div className="truncate mr-4">
                        <span className="font-bold mr-2">{selectedCPV.code}</span>
                        <span className="text-muted-foreground truncate">{selectedCPV.description_ca}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                        Desmarcar
                    </Button>
                </div>
            )}
        </div>
    );
};
