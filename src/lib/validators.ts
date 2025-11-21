export const contractValidators = {
    nomContracte: (value: string) => {
        if (!value || value.length < 3) {
            return "El nom del contracte ha de tenir almenys 3 caràcters";
        }
        return null;
    },
    numExpedient: (value: string) => {
        if (!value) {
            return "El número d'expedient és obligatori";
        }
        return null;
    },
};

export const lotValidators = {
    nomLot: (value: string) => {
        if (!value) {
            return "El nom del lot és obligatori";
        }
        return null;
    },
    adjudicatari: (value: string) => {
        if (!value) {
            return "L'adjudicatari és obligatori";
        }
        return null;
    },
};
