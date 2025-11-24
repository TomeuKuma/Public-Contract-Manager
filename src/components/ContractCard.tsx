import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Euro } from "lucide-react";
import { format } from "date-fns";
import { ca } from "date-fns/locale";

interface Lot {
  id: string;
  name: string;
  credit_real_total?: number;
  credit_committed_total?: number;
  credits?: {
    credit_committed_d?: number;
    modificacio_credit?: number;
  }[];
}

interface Contract {
  id: string;
  name: string;
  file_number?: string;
  dossier_number?: string;
  start_date?: string;
  end_date?: string;
  contract_type?: string;
  lots?: Lot[];
}

interface ContractCardProps {
  contract: Contract;
  onClick: () => void;
}

const ContractCard = ({ contract, onClick }: ContractCardProps) => {
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

  const totalCreditReal = contract.lots?.reduce(
    (sum, lot) => sum + (lot.credit_real_total || 0),
    0
  ) || 0;

  const totalCreditCommitted = contract.lots?.reduce(
    (sum, lot) => {
      // Calculate from credits if available, otherwise use credit_committed_total if it exists
      const lotCommitted = lot.credits?.reduce(
        (creditSum, credit) => creditSum + ((credit.credit_committed_d || 0) + (credit.modificacio_credit || 0)),
        0
      ) || lot.credit_committed_total || 0;
      return sum + lotCommitted;
    },
    0
  ) || 0;

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 ${getBorderColor(contract.contract_type)} flex flex-col md:flex-row md:items-center`}
      onClick={onClick}
    >
      <CardHeader className="pb-2 md:pb-6 md:w-1/3">
        <CardTitle className="text-lg font-semibold">{contract.name}</CardTitle>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2">
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
        </div>
        {(contract.start_date || contract.end_date) && (
          <div className="text-xs text-muted-foreground mt-1">
            {formatDate(contract.start_date)} - {formatDate(contract.end_date)}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0 md:pt-6 md:w-2/3">
        {contract.lots && contract.lots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {contract.lots.slice(0, 5).map((lot) => (
              <div
                key={lot.id}
                className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded text-xs"
              >
                <span className="text-muted-foreground">{lot.name}</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(lot.credit_real_total)}
                </span>
              </div>
            ))}
            {contract.lots.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{contract.lots.length - 5}
              </Badge>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <div className="text-sm text-right space-y-1">
            <div>
              <span className="text-muted-foreground">Compromès: </span>
              <span className="font-semibold">{formatCurrency(totalCreditCommitted)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Real: </span>
              <span className="font-semibold">{formatCurrency(totalCreditReal)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractCard;
