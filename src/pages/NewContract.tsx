import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createContract } from "@/lib/contractService";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { PDFExtractionModal } from "@/components/forms/PDFExtractionModal";
import type { MappedContractData } from "@/hooks/useCatalogMapping";




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

const AWARD_PROCEDURE_OPTIONS = [
  "Contracte obert",
  "Contracte menor AD",
  "Contracte menor ADO",
];

const CONTRACT_TYPE_OPTIONS = [
  "Subministrament",
  "Servei",
  "Obra",
  "Concessió",
];

const NewContract = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [duplicateFileNumberError, setDuplicateFileNumberError] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dossier_number: "",
    file_number: "",
    tipus_necessitat: "Puntual",
    contracting_body: "",
    contact_responsible: "",
    award_procedure: "",
    contract_type: "",
    purpose: "",
    need_to_satisfy: "",
    observations: "",
    extendable: false,
    modifiable: false,
    referencia_interna: "",
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

  const handleAreaToggle = (areaId: string) => {
    setSelectedAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleCenterToggle = (centerId: string) => {
    setSelectedCenters((prev) =>
      prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
    );
  };

  const filteredCenters =
    selectedAreas.length > 0
      ? centers.filter((c) => selectedAreas.includes(c.area_id))
      : centers;

  const handlePDFDataExtracted = (data: MappedContractData) => {
    // Rellenar campos del contracte
    setFormData({
      ...formData,
      name: data.contract.title,
      file_number: data.contract.expedient,
      contract_type: data.contract.contract_type,
      award_procedure: data.contract.award_procedure,
      purpose: data.contract.title,
      referencia_interna: data.contract.internal_reference,
      contact_responsible: data.contract.contact_responsible,
      extendable: data.contract.is_extendable,
      modifiable: data.contract.is_modifiable,
    });

    // Rellenar áreas y centros
    setSelectedAreas(data.contract.area_ids);
    setSelectedCenters(data.contract.center_ids);

    toast({
      title: "Dades importades",
      description: "Revisa els camps i completa la informació que falta. Els lots s'hauran d'afegir manualment.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "El nom del contracte és obligatori",
        variant: "destructive",
      });
      return;
    }

    if (!formData.file_number) {
      toast({
        title: "Error",
        description: "El número d'expedient és obligatori",
        variant: "destructive",
      });
      return;
    }

    if (selectedAreas.length === 0) {
      toast({
        title: "Error",
        description: "Has de seleccionar almenys una àrea",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const contractData = {
      ...formData,
      areas: selectedAreas,
      centers: selectedCenters,
    };

    const { data, error } = await createContract(contractData);

    if (error) {
      // Check for unique constraint violation (code 23505)
      if (error.code === "23505") {
        setDuplicateFileNumberError(true);
      } else {
        toast({
          title: "Error",
          description: "No s'ha pogut crear el contracte",
          variant: "destructive",
        });
      }
      setLoading(false);
      return;
    }

    toast({
      title: "Èxit",
      description: "Contracte creat correctament",
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
              Nou Contracte
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-card rounded-lg border p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  Informació bàsica
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex flex-col items-center justify-center h-auto py-1 px-2 hover:bg-transparent text-primary"
                  onClick={() => setShowPDFModal(true)}
                  title="Importar des de PDF"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-[10px] font-bold leading-none mt-0.5">IA</span>
                </Button>
              </div>

              <div>
                <Label htmlFor="name">
                  Nom del contracte <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 h-5 mb-2">
                    <Label htmlFor="dossier_number">Núm. de dossier</Label>
                  </div>
                  <Input
                    id="dossier_number"
                    value={formData.dossier_number}
                    onChange={(e) =>
                      setFormData({ ...formData, dossier_number: e.target.value })
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center gap-2 h-5 mb-2">
                    <Label htmlFor="file_number">
                      Núm. d'expedient <span className="text-destructive">*</span>
                    </Label>
                    {duplicateFileNumberError && (
                      <span className="text-[10px] text-destructive font-medium leading-tight">
                        Nº d'expedient existent.
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
              </div>

              <div>
                <Label htmlFor="referencia_interna">Referència interna</Label>
                <Input
                  id="referencia_interna"
                  value={formData.referencia_interna}
                  onChange={(e) =>
                    setFormData({ ...formData, referencia_interna: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="purpose">Descripció de l'objecte</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) =>
                    setFormData({ ...formData, purpose: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="need_to_satisfy">Necessitat a satisfer</Label>
                <Textarea
                  id="need_to_satisfy"
                  value={formData.need_to_satisfy}
                  onChange={(e) =>
                    setFormData({ ...formData, need_to_satisfy: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="observations">Observacions</Label>
                <Textarea
                  id="observations"
                  value={formData.observations}
                  onChange={(e) =>
                    setFormData({ ...formData, observations: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                Àrees i centres
              </h2>

              <div>
                <Label>
                  Àrees <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2 mt-2">
                  {areas.map((area) => (
                    <div key={area.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`area-${area.id}`}
                        checked={selectedAreas.includes(area.id)}
                        onCheckedChange={() => handleAreaToggle(area.id)}
                      />
                      <label
                        htmlFor={`area-${area.id}`}
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
                <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  {filteredCenters.map((center) => (
                    <div key={center.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`center-${center.id}`}
                        checked={selectedCenters.includes(center.id)}
                        onCheckedChange={() => handleCenterToggle(center.id)}
                      />
                      <label
                        htmlFor={`center-${center.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {center.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border p-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                Detalls administratius
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipus_necessitat">Tipus de necessitat</Label>
                  <Select
                    value={formData.tipus_necessitat}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipus_necessitat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Puntual">Puntual</SelectItem>
                      <SelectItem value="Recurrent">Recurrent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contracting_body">
                    Òrgan de contractació
                  </Label>
                  <Select
                    value={formData.contracting_body}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contracting_body: value })
                    }
                  >
                    <SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="contact_responsible">
                  Responsable de contacte
                </Label>
                <Input
                  id="contact_responsible"
                  value={formData.contact_responsible}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      contact_responsible: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="award_procedure">
                    Procediment d'adjudicació
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
                      {AWARD_PROCEDURE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contract_type">Tipus contractual</Label>
                  <Select
                    value={formData.contract_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contract_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTRACT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extendable"
                    checked={formData.extendable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, extendable: !!checked })
                    }
                  />
                  <label htmlFor="extendable" className="text-sm cursor-pointer">
                    Prorrogable
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="modifiable"
                    checked={formData.modifiable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, modifiable: !!checked })
                    }
                  />
                  <label htmlFor="modifiable" className="text-sm cursor-pointer">
                    Modificable
                  </label>
                </div>
              </div>
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
                  "Crear Contracte"
                )}
              </Button>
            </div>
          </form>

          {/* Modal de extracción de PDF */}
          <PDFExtractionModal
            open={showPDFModal}
            onClose={() => setShowPDFModal(false)}
            onDataExtracted={handlePDFDataExtracted}
          />
        </div>
      </main>
    </div>
  );
};

export default NewContract;
