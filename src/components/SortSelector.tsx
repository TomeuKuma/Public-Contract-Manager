import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, X } from "lucide-react";

export interface SortOption {
    field: 'total_committed' | 'start_date' | 'end_date' | 'file_number';
    direction: 'asc' | 'desc';
}

interface SortSelectorProps {
    value: SortOption | null;
    onChange: (sort: SortOption | null) => void;
}

const sortFields = [
    { value: 'total_committed', label: 'Total', shortLabel: 'Total' },
    { value: 'start_date', label: 'Data inici', shortLabel: 'Inici' },
    { value: 'end_date', label: 'Data fi', shortLabel: 'Fi' },
    { value: 'file_number', label: "Núm. exp.", shortLabel: "Núm. exp." },
] as const;

export const SortSelector = ({ value, onChange }: SortSelectorProps) => {
    const handleFieldClick = (field: SortOption['field']) => {
        if (value?.field === field) {
            // Toggle direction if same field
            onChange({
                field,
                direction: value.direction === 'asc' ? 'desc' : 'asc'
            });
        } else {
            // New field, default to descending
            onChange({
                field,
                direction: 'desc'
            });
        }
    };

    const clearSort = () => {
        onChange(null);
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">Ordenar:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                {sortFields.map((field) => {
                    const isActive = value?.field === field.value;
                    const isAscending = isActive && value.direction === 'asc';

                    return (
                        <Badge
                            key={field.value}
                            variant={isActive ? "default" : "outline"}
                            className={`cursor-pointer transition-all hover:opacity-80 ${isActive ? '' : 'hover:bg-muted'
                                }`}
                            onClick={() => handleFieldClick(field.value)}
                        >
                            <span className="text-xs">
                                {field.shortLabel}
                                {isActive && (
                                    <span className="ml-1">
                                        {isAscending ? '↑' : '↓'}
                                    </span>
                                )}
                            </span>
                        </Badge>
                    );
                })}

                {value && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSort}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    );
};
