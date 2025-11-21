import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { ca } from "date-fns/locale";
import { Contract } from "@/types";

interface ContractHeaderProps {
    contract: Contract;
    onEdit: () => void;
    onDelete: () => void;
    onClose: () => void;
}

export function ContractHeader({ contract, onEdit, onDelete, onClose }: ContractHeaderProps) {
    return (
        <>
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold">{contract.name}</h2>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Contract Details Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                        <p className="text-muted-foreground mb-1">Número de dossier:</p>
                        <p className="font-medium">
                            {contract.dossier_number ? (
                                <a
                                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.dossier_number.slice(
                                        0,
                                        -1
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-blue-600"
                                >
                                    {contract.dossier_number}
                                </a>
                            ) : (
                                "-"
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Número d'expedient:</p>
                        <p className="font-medium">
                            {contract.file_number ? (
                                <a
                                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.file_number.slice(
                                        0,
                                        -1
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:underline text-blue-600"
                                >
                                    {contract.file_number}
                                </a>
                            ) : (
                                "-"
                            )}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Referència interna:</p>
                        <p className="font-medium">{contract.referencia_interna || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Tipus de necessitat:</p>
                        <p className="font-medium">{contract.tipus_necessitat || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Òrgan de contractació:</p>
                        <p className="font-medium">{contract.contracting_body || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Responsable de contacte:</p>
                        <p className="font-medium">{contract.contact_responsible || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Procediment d'adjudicació:</p>
                        <p className="font-medium">{contract.award_procedure || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Tipus contractual:</p>
                        <p className="font-medium">{contract.contract_type || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Característiques:</p>
                        <div className="flex gap-2">
                            {contract.extendable && (
                                <Badge variant="outline" className="text-primary border-primary">
                                    Prorrogable
                                </Badge>
                            )}
                            {contract.modifiable && (
                                <Badge variant="outline" className="text-primary border-primary">
                                    Modificable
                                </Badge>
                            )}
                            {!contract.extendable && !contract.modifiable && "-"}
                        </div>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Data inici:</p>
                        <p className="font-medium">
                            {contract.start_date
                                ? format(new Date(contract.start_date), "dd/MM/yyyy", { locale: ca })
                                : "-"}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground mb-1">Data fi:</p>
                        <p className="font-medium">
                            {contract.end_date
                                ? format(new Date(contract.end_date), "dd/MM/yyyy", { locale: ca })
                                : "-"}
                        </p>
                    </div>
                </div>

                {/* Purpose */}
                {contract.purpose && (
                    <div>
                        <p className="text-muted-foreground text-sm mb-2">Objecte:</p>
                        <p className="text-sm">{contract.purpose}</p>
                    </div>
                )}

                {/* Centers */}
                {contract.centers && contract.centers.length > 0 && (
                    <div>
                        <p className="text-muted-foreground text-sm mb-2">Centres associats:</p>
                        <div className="flex flex-wrap gap-2">
                            {contract.centers.map((center: any, index: number) => (
                                <Badge
                                    key={index}
                                    variant="secondary"
                                    className="bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                    {typeof center === 'string' ? center : center.name}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
