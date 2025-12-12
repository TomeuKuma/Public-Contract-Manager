import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useFilters } from "@/hooks/useFilters";

const FiltersSidebar = () => {
  const {
    filters,
    areas,
    centers,
    setSearch,
    handleAreaToggle,
    handleCenterToggle,
    handleContractTypeToggle,
    handleAwardProcedureToggle,
    handleYearToggle,
    clearFilters,
  } = useFilters();

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchAvailableYears();
  }, []);

  const fetchAvailableYears = async () => {
    // @ts-ignore
    const { data, error } = await supabase.rpc("get_available_years");
    if (error) {
      console.error("Error fetching available years:", error);
      return;
    }
    if (data) {
      setAvailableYears(data.map((d: any) => d.year));
    }
  };

  const filteredCenters = filters.selectedAreas.length > 0
    ? centers.filter((c) => filters.selectedAreas.includes(c.area_id))
    : centers;

  const contractTypes = ["Subministrament", "Servei", "Obra", "Concessió"];
  const awardProcedures = [
    "Contracte obert",
    "Contracte menor AD",
    "Contracte menor ADO",
    "OFI",
    "REC",
  ];

  const hasActiveFilters =
    filters.search ||
    filters.selectedAreas.length > 0 ||
    filters.selectedCenters.length > 0 ||
    filters.selectedContractTypes.length > 0 ||
    filters.selectedAwardProcedures.length > 0 ||
    filters.selectedYears.length > 0;

  return (
    <aside
      className={`border-r bg-card transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? "w-12" : "w-64"
        }`}
    >
      <div className={`p-4 flex items-center ${isCollapsed ? "justify-center flex-col gap-2" : "justify-between"}`}>
        {!isCollapsed && <h2 className="font-semibold text-lg">Filtres</h2>}
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={clearFilters}
              title="Netejar filtres"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-6">
          <div>
            <div className="space-y-2">
              <Label htmlFor="search">Cerca per paraula clau</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, núm. expedient..."
                  value={filters.search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Any</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableYears.map((year) => (
                <div key={year} className="flex items-start space-x-2">
                  <Checkbox
                    id={`year-${year}`}
                    checked={filters.selectedYears.includes(year)}
                    onCheckedChange={() => handleYearToggle(year)}
                  />
                  <label
                    htmlFor={`year-${year}`}
                    className="text-sm leading-tight cursor-pointer"
                  >
                    {year}
                  </label>
                </div>
              ))}
            </div>
            {filters.selectedYears.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.selectedYears.map((year) => (
                  <Badge key={year} variant="secondary" className="text-xs">
                    {year}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Àrea</Label>
            <div className="space-y-2">
              {areas.map((area) => (
                <div key={area.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={`area-${area.id}`}
                    checked={filters.selectedAreas.includes(area.id)}
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
            {filters.selectedAreas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.selectedAreas.map((areaId) => {
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
                    checked={filters.selectedCenters.includes(center.id)}
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
            {filters.selectedCenters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.selectedCenters.map((centerId) => {
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
                    checked={filters.selectedContractTypes.includes(type)}
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
            {filters.selectedContractTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.selectedContractTypes.map((type) => (
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
                    checked={filters.selectedAwardProcedures.includes(procedure)}
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
            {filters.selectedAwardProcedures.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.selectedAwardProcedures.map((procedure) => (
                  <Badge key={procedure} variant="secondary" className="text-xs">
                    {procedure}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default FiltersSidebar;
