import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import FiltersSidebar from "@/components/FiltersSidebar";
import ContractCard from "@/components/ContractCard";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { getContracts, ContractFilters } from "@/lib/contractService";
import { useToast } from "@/hooks/use-toast";
import { useFilters } from "@/hooks/useFilters";
import { useContracts } from "@/hooks/useContracts";

const Index = () => {
  const { filters } = useFilters();
  const { contracts, loading, loadMore, totalCount } = useContracts(filters);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCardClick = (contractId: string) => {
    navigate(`/contractes/${contractId}`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <FiltersSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  Control de contractes IMAS
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Gestió de contractes per a centres residencials
                </p>
              </div>
              <Button onClick={() => navigate("/contractes/nou")}>
                <Plus className="mr-2 h-4 w-4" />
                Nou Contracte
              </Button>
            </div>

            {loading && contracts.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : contracts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg mb-4">
                  No s'han trobat contractes
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  Comença creant el teu primer contracte
                </p>
                <Button onClick={() => navigate("/contractes/nou")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Contracte
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {contracts.map((contract) => (
                  <ContractCard
                    key={contract.id}
                    contract={contract}
                    onClick={() => handleCardClick(contract.id)}
                  />
                ))}

                {contracts.length < totalCount && (
                  <div className="flex justify-center mt-4 pb-8">
                    <Button
                      variant="outline"
                      onClick={() => loadMore()}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Carregant...
                        </>
                      ) : (
                        "Carregar més contractes"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
