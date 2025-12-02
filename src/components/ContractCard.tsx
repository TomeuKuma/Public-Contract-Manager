import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ca } from "date-fns/locale";
import { Contract } from "@/types";

interface ContractCardProps {
  contract: Contract;
  onClick: () => void;
}

const ContractCard = memo(({ contract, onClick }: ContractCardProps) => {
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("ca-ES", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ca });
  };

  const getBorderColor = (type?: string) => {
    switch (type) {
      case "Subministrament":
        return "border-l-blue-500";
      case "Servei":
        return "border-l-green-500";
      case "Obra":
        return "border-l-orange-500";
      case "Concessió":
        return "border-l-purple-500";
      default:
        return "border-l-gray-400";
    }
  };

  const { totalCreditReal, totalCreditCommitted, totalCreditRecognized, executionPercentage } = useMemo(() => {
    // Use pre-calculated values from the view if available
    if (contract.total_real !== undefined) {
      return {
        totalCreditReal: contract.total_real,
        totalCreditCommitted: contract.total_committed || 0,
        totalCreditRecognized: contract.total_recognized || 0,
        executionPercentage: contract.execution_percentage || 0
      };
    }

    // Fallback for when we don't have the view data (e.g. after creating a new contract locally before refresh)
    const real = contract.lots?.reduce(
      (sum, lot) => sum + (lot.credit_real_total || 0),
      0
    ) || 0;

    const committed = contract.lots?.reduce(
      (sum, lot) => {
        const lotCommitted = lot.credits?.reduce(
          (creditSum, credit) => creditSum + (credit.credit_committed_d || 0),
          0
        ) || lot.credit_committed_total || 0;
        return sum + lotCommitted;
      },
      0
    ) || 0;

    const recognized = contract.lots?.reduce(
      (sum, lot) => {
        const lotRecognized = lot.credits?.reduce(
          (creditSum, credit) => creditSum + (credit.credit_recognized_o || 0),
          0
        ) || 0;
        return sum + lotRecognized;
      },
      0
    ) || 0;

    // Calculate Contract Execution Percentage
    let execPercentage = 0;
    if (contract.lots && contract.lots.length > 0) {
      const lotPercentages = contract.lots.map(lot => {
        if (!lot.credits || lot.credits.length === 0) return 0;

        const creditPercentages = lot.credits.map(credit => {
          const c = credit.credit_committed_d || 0;
          const r = credit.credit_recognized_o || 0;
          const re = c - r;
          return c !== 0 ? (1 - (re / c)) * 100 : 0;
        });

        const lotTotal = creditPercentages.reduce((sum, p) => sum + p, 0);
        return lotTotal / creditPercentages.length;
      });

      const contractTotal = lotPercentages.reduce((sum, p) => sum + p, 0);
      execPercentage = contractTotal / lotPercentages.length;
    }

    return {
      totalCreditReal: real,
      totalCreditCommitted: committed,
      totalCreditRecognized: recognized,
      executionPercentage: execPercentage
    };
  }, [contract]);

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${getBorderColor(contract.contract_type)}`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">{contract.name}</CardTitle>
            {(contract.award_procedure || contract.contract_type) && (
              <div className="text-xs text-muted-foreground mt-1">
                {contract.award_procedure && contract.contract_type
                  ? `${contract.award_procedure} - ${contract.contract_type}`
                  : contract.award_procedure || contract.contract_type
                }
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
              {contract.file_number && (
                <span>
                  Exp:{" "}
                  <a
                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.file_number.slice(
                      0,
                      -1
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contract.file_number}
                  </a>
                </span>
              )}
              {contract.dossier_number && (
                <span>
                  Doss:{" "}
                  <a
                    href={`https://imas.secimallorca.net/segex/expediente.aspx?id=${contract.dossier_number.slice(
                      0,
                      -1
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contract.dossier_number}
                  </a>
                </span>
              )}
              {(contract.start_date || contract.end_date) && (
                <span>
                  {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
                </span>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-sm font-bold">{formatCurrency(totalCreditCommitted)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Exec: <span className="font-semibold text-foreground">{executionPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {contract.lots && contract.lots.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-1.5">
              Lotes ({contract.lots.length})
            </div>
            <div className="space-y-1.5">
              {contract.lots.slice(0, 4).map((lot) => (
                <div
                  key={lot.id}
                  className="bg-muted/40 px-3 py-2 rounded text-xs space-y-1"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium text-foreground flex-1 line-clamp-1">{lot.name}</span>
                  </div>
                  {lot.awardee && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">Adjudicatari:</span> {lot.awardee}
                    </div>
                  )}
                  {lot.cpv_code && (
                    <div className="text-muted-foreground">
                      <span className="font-medium">CPV:</span> {lot.cpv_code} - {lot.cpv_description}
                    </div>
                  )}
                  {(lot.start_date || lot.end_date) && (
                    <div className="text-muted-foreground">
                      {formatDate(lot.start_date)} - {formatDate(lot.end_date)}
                    </div>
                  )}
                  <div className="flex gap-4 pt-1 border-t border-muted-foreground/20">
                    <div>
                      <span className="text-muted-foreground">Compromès:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(lot.lot_committed || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reconegut:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(lot.lot_recognized || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {contract.lots.length > 4 && (
                <div className="text-center py-1">
                  <Badge variant="secondary" className="text-xs">
                    +{contract.lots.length - 4} lote{contract.lots.length - 4 > 1 ? 's' : ''} més
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="mt-3 pt-3 border-t flex justify-between text-xs">
          <div className="space-y-0.5">
            <div>
              <span className="text-muted-foreground">Compromès:</span>{" "}
              <span className="font-semibold">{formatCurrency(totalCreditCommitted)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Reconegut:</span>{" "}
              <span className="font-semibold">{formatCurrency(totalCreditRecognized)}</span>
            </div>
          </div>
          <div className="space-y-0.5 text-right">
            <div>
              <span className="text-muted-foreground">Real:</span>{" "}
              <span className="font-semibold">{formatCurrency(totalCreditReal)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Execució:</span>{" "}
              <span className="font-semibold">{executionPercentage.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ContractCard;
