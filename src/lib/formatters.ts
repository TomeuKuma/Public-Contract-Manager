export const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat("ca-ES", {
        style: "currency",
        currency: "EUR",
    }).format(amount);
};

export const formatDate = (date: string | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ca-ES");
};
