export function calculateCreditReal(
    creditCompromes: number,
    modificacioCredit: number,
    creditReconegut: number
): number {
    return creditCompromes + modificacioCredit - creditReconegut;
}

export function calculatePercentageModified(
    modificacioCredit: number,
    creditCompromes: number
): number {
    if (creditCompromes === 0) return 0;
    return (modificacioCredit / creditCompromes) * 100;
}

export function calculateTotalInvoice(
    baseImport: number,
    ivaImport: number
): number {
    return baseImport + ivaImport;
}

export function calculateExecutionPercentage(
    creditReconegut: number,
    creditCompromes: number
): number {
    if (creditCompromes === 0) return 0;
    return Math.round((creditReconegut / creditCompromes) * 100);
}
