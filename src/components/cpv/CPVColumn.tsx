import { useEffect } from 'react';
import { useCPVCodes } from '@/hooks/useCPVCodes';
import { CPVCode } from '@/types/cpv.types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CPV_DEPTH_COLORS, CPV_DEPTH_LABELS } from '@/lib/constants';

interface CPVColumnProps {
    parentCode?: string;
    depthLevel: number;
    selectedId?: string;
    onSelect: (cpv: CPVCode) => void;
    contractType?: string;
}

export const CPVColumn = ({ parentCode, depthLevel, selectedId, onSelect, contractType }: CPVColumnProps) => {
    const { cpvCodes, isLoading, setSearchParams } = useCPVCodes();

    useEffect(() => {
        setSearchParams({
            parentCode,
            depthLevel,
            contractType,
            limit: 100 // Ensure we get enough items for a column
        });
    }, [parentCode, depthLevel, contractType, setSearchParams]);

    if (isLoading) {
        return (
            <div className="w-[300px] h-full flex items-center justify-center border-r">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!cpvCodes || cpvCodes.length === 0) {
        if (depthLevel === 1) {
            return (
                <div className="w-[300px] h-full flex items-center justify-center border-r text-muted-foreground text-sm p-4 text-center">
                    No s'han trobat codis.
                </div>
            );
        }
        return null; // Don't render empty columns for deeper levels
    }

    return (
        <div className="w-[300px] h-full border-r flex flex-col bg-background">
            <div className="p-2 border-b bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {CPV_DEPTH_LABELS[depthLevel as keyof typeof CPV_DEPTH_LABELS] || `Nivell ${depthLevel}`}
            </div>
            <ScrollArea className="flex-1">
                <div className="p-1 space-y-0.5">
                    {cpvCodes.map((cpv) => {
                        const isSelected = selectedId === cpv.id;
                        const hasChildren = cpv.depth_level < 5; // Assuming 5 is max depth

                        return (
                            <Button
                                key={cpv.id}
                                variant="ghost"
                                className={cn(
                                    "w-full justify-between h-auto py-2 px-2 text-left font-normal hover:bg-accent/50",
                                    isSelected && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => onSelect(cpv)}
                            >
                                <div className="flex flex-col items-start min-w-0 flex-1 mr-2">
                                    <div className="flex items-center gap-2 w-full">
                                        <span className={cn("font-mono text-xs", isSelected && "font-bold")}>
                                            {cpv.code}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground line-clamp-2 leading-tight mt-0.5" title={cpv.description_ca}>
                                        {cpv.description_ca}
                                    </span>
                                </div>
                                {hasChildren && (
                                    <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground/50", isSelected && "text-foreground")} />
                                )}
                            </Button>
                        );
                    })}
                </div>
            </ScrollArea>
        </div>
    );
};
