import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { extractContractDataFromPDF, type ExtractedContractData } from '@/lib/pdfExtractionService';
import { useCatalogMapping, type MappedContractData } from '@/hooks/useCatalogMapping';
import { useToast } from '@/hooks/use-toast';

interface PDFExtractionModalProps {
    open: boolean;
    onClose: () => void;
    onDataExtracted: (data: MappedContractData) => void;
}

export function PDFExtractionModal({ open, onClose, onDataExtracted }: PDFExtractionModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractedContractData | null>(null);
    const { toast } = useToast();

    const {
        findClosestMatch,
        findMultipleMatches,
        areas,
        centers,
        isLoading: isCatalogsLoading,
    } = useCatalogMapping();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            setFile(selectedFile);
            setError(null);
            setExtractedData(null); // Reset previous extraction
        } else {
            setError('Per favor, selecciona un arxiu PDF vàlid');
            setFile(null);
        }
    };

    const handleExtract = async () => {
        if (!file) return;

        setIsExtracting(true);
        setError(null);

        try {
            const data = await extractContractDataFromPDF(file);
            setExtractedData(data);
            toast({
                title: "Dades extretes correctament",
                description: `S'han detectat ${data.lots.length} lot(s)`,
            });
        } catch (err: any) {
            setError(err.message || 'Error al processar el PDF');
            toast({
                title: "Error",
                description: err.message || 'Error al processar el PDF',
                variant: "destructive",
            });
        } finally {
            setIsExtracting(false);
        }
    };

    const handleConfirm = () => {
        if (!extractedData) return;

        // Mapear datos extraídos a IDs de catálogos
        const mappedData: MappedContractData = {
            contract: {
                expedient: extractedData.contract.expedient,
                internal_reference: extractedData.contract.internal_reference,
                title: extractedData.contract.title,
                contract_type: extractedData.contract.contract_type,
                award_procedure: extractedData.contract.award_procedure,
                award_date: extractedData.contract.award_date,
                contact_responsible: extractedData.contract.contact_responsible,
                is_extendable: extractedData.contract.is_extendable,
                is_modifiable: extractedData.contract.is_modifiable,
                area_ids: findMultipleMatches(extractedData.contract.areas, areas),
                center_ids: findMultipleMatches(extractedData.contract.centers, centers),
            },
            lots: extractedData.lots,
        };

        onDataExtracted(mappedData);

        // Reset modal state
        setFile(null);
        setExtractedData(null);
        setError(null);

        onClose();
    };

    const handleCancel = () => {
        setFile(null);
        setExtractedData(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importar Contracte des de PDF</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-1">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            id="pdf-upload"
                            disabled={isExtracting}
                        />
                        <label htmlFor="pdf-upload" className="cursor-pointer block w-full">
                            {file ? (
                                <div className="flex items-center justify-center gap-2 w-full px-4 max-w-full">
                                    <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                                    <div className="text-left min-w-0 flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        Selecciona un arxiu de <span className="font-bold">Resolució d'adjudicació del contracte</span> en format .pdf
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Clica per seleccionar un arxiu
                                    </p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded">
                            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Extracted Data Preview */}
                    {extractedData && (
                        <div className="space-y-3 p-4 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Dades extretes correctament</span>
                            </div>

                            <div className="text-sm space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Expedient</p>
                                        <p className="font-medium">{extractedData.contract.expedient || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Data adjudicació</p>
                                        <p className="font-medium">{extractedData.contract.award_date || '-'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">Objecte</p>
                                    <p className="font-medium line-clamp-2">{extractedData.contract.title}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Tipus</p>
                                        <p className="font-medium">{extractedData.contract.contract_type || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Procediment</p>
                                        <p className="font-medium">{extractedData.contract.award_procedure || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ref. Interna</p>
                                        <p className="font-medium">{extractedData.contract.internal_reference || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Responsable</p>
                                        <p className="font-medium">{extractedData.contract.contact_responsible || '-'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${extractedData.contract.is_extendable ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Prorrogable</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${extractedData.contract.is_modifiable ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span>Modificable</span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Lots detectats: {extractedData.lots.length}
                                    </p>
                                    {extractedData.lots.map((lot, i) => (
                                        <div key={i} className="ml-2 p-2 bg-white rounded mb-2 last:mb-0">
                                            <p className="font-medium text-sm">{lot.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {lot.supplier_name} | {lot.start_date} - {lot.end_date}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isExtracting && (
                        <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <p className="text-sm text-blue-600">
                                Processant PDF amb IA... Això pot trigar uns segons
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t mt-auto">
                    <Button variant="outline" onClick={handleCancel} disabled={isExtracting}>
                        Cancel·lar
                    </Button>
                    {!extractedData ? (
                        <Button
                            onClick={handleExtract}
                            disabled={!file || isExtracting || isCatalogsLoading}
                        >
                            {isExtracting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processant...
                                </>
                            ) : (
                                'Extraure Dades'
                            )}
                        </Button>
                    ) : (
                        <Button onClick={handleConfirm}>
                            Aplicar al Formulari
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
