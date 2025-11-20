import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Area {
  id: string;
  name: string;
}

interface Center {
  id: string;
  name: string;
  area_id: string;
}

interface Filters {
  search: string;
  selectedAreas: string[];
  selectedCenters: string[];
  selectedContractTypes: string[];
  selectedAwardProcedures: string[];
}

interface FiltersSidebarProps {
  onFilterChange: (filters: Filters) => void;
}

const FiltersSidebar = ({ onFilterChange }: FiltersSidebarProps) => {
  const [search, setSearch] = useState("");
  const [areas, setAreas] = useState<Area[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedCenters, setSelectedCenters] = useState<string[]>([]);
  const [selectedContractTypes, setSelectedContractTypes] = useState<string[]>([]);
  const [selectedAwardProcedures, setSelectedAwardProcedures] = useState<string[]>([]);

  useEffect(() => {
    fetchAreas();
    fetchCenters();
  }, []);

  useEffect(() => {
    onFilterChange({
      search,
      selectedAreas,
      selectedCenters,
      selectedContractTypes,
      selectedAwardProcedures,
    });
  }, [search, selectedAreas, selectedCenters, selectedContractTypes, selectedAwardProcedures]);

  const fetchAreas = async () => {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .order("name");

    if (data && !error) {
      setAreas(data);
    }
  };

  const fetchCenters = async () => {
    const { data, error } = await supabase
      .from("centers")
      .select("*")
      .order("name");

    if (data && !error) {
      setCenters(data);
    }
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

  const handleContractTypeToggle = (type: string) => {
    setSelectedContractTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleAwardProcedureToggle = (procedure: string) => {
    setSelectedAwardProcedures((prev) =>
      prev.includes(procedure)
        ? prev.filter((p) => p !== procedure)
        : [...prev, procedure]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedAreas([]);
    setSelectedCenters([]);
    setSelectedContractTypes([]);
    setSelectedAwardProcedures([]);
  };

  const filteredCenters = selectedAreas.length > 0
    ? centers.filter((c) => selectedAreas.includes(c.area_id))
    : centers;

  const contractTypes = ["Subministrament", "Servei", "Obra", "Concessió"];
  const awardProcedures = [
    "Contracte obert",
    "Contracte menor AD",
    "Contracte menor ADO",
  ];

  const hasActiveFilters =
    search ||
    selectedAreas.length > 0 ||
    selectedCenters.length > 0 ||
    selectedContractTypes.length > 0 ||
    selectedAwardProcedures.length > 0;

  return (
    <aside className="w-64 border-r bg-card p-4 space-y-6 overflow-y-auto">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Filtres</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2"
            >
              <X className="h-4 w-4 mr-1" />
              Netejar
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="search">Cerca per paraula clau</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nom, núm. expedient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Àrea</Label>
        <div className="space-y-2">
          {areas.map((area) => (
            <div key={area.id} className="flex items-start space-x-2">
              <Checkbox
                id={`area-${area.id}`}
                checked={selectedAreas.includes(area.id)}
                onCheckedChange={() => handleAreaToggle(area.id)}
              />
              <label
                htmlFor={`area-${area.id}`}
                className="text-sm leading-tight cursor-pointer"
              >
                {area.name}
              </label>
            </div>
          ))}
        </div>
        {selectedAreas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedAreas.map((areaId) => {
              const area = areas.find((a) => a.id === areaId);
              return (
                <Badge key={areaId} variant="secondary" className="text-xs">
                  {area?.name}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Centre</Label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredCenters.map((center) => (
            <div key={center.id} className="flex items-start space-x-2">
              <Checkbox
                id={`center-${center.id}`}
                checked={selectedCenters.includes(center.id)}
                onCheckedChange={() => handleCenterToggle(center.id)}
              />
              <label
                htmlFor={`center-${center.id}`}
                className="text-sm leading-tight cursor-pointer"
              >
                {center.name}
              </label>
            </div>
          ))}
        </div>
        {selectedCenters.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedCenters.map((centerId) => {
              const center = centers.find((c) => c.id === centerId);
              return (
                <Badge key={centerId} variant="secondary" className="text-xs">
                  {center?.name}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Tipus contractual</Label>
        <div className="space-y-2">
          {contractTypes.map((type) => (
            <div key={type} className="flex items-start space-x-2">
              <Checkbox
                id={`type-${type}`}
                checked={selectedContractTypes.includes(type)}
                onCheckedChange={() => handleContractTypeToggle(type)}
              />
              <label
                htmlFor={`type-${type}`}
                className="text-sm leading-tight cursor-pointer"
              >
                {type}
              </label>
            </div>
          ))}
        </div>
        {selectedContractTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedContractTypes.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Procediment d'adjudicació</Label>
        <div className="space-y-2">
          {awardProcedures.map((procedure) => (
            <div key={procedure} className="flex items-start space-x-2">
              <Checkbox
                id={`procedure-${procedure}`}
                checked={selectedAwardProcedures.includes(procedure)}
                onCheckedChange={() => handleAwardProcedureToggle(procedure)}
              />
              <label
                htmlFor={`procedure-${procedure}`}
                className="text-sm leading-tight cursor-pointer"
              >
                {procedure}
              </label>
            </div>
          ))}
        </div>
        {selectedAwardProcedures.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {selectedAwardProcedures.map((procedure) => (
              <Badge key={procedure} variant="secondary" className="text-xs">
                {procedure}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FiltersSidebar;
