
export interface CalculationData {
    printName: string;
    customerName: string;
    purchaseDate: string;
    currency: string;
    filamentDiameter: number;
    filamentWeight: number;
    filamentPrice: number;
    includeElectricity: boolean;
    printTimeHours: number;
    printTimeMinutes: number;
    printTimeSeconds: number;
    electricityCost: number;
    includeLabor: boolean;
    laborTimeHours: number;
    laborTimeMinutes: number;
    laborRate: number;
    includePostProcessing: boolean;
    postProcessingHours: number;
    postProcessingMinutes: number;
    postProcessingRate: number;
    markup: number;
}

export interface GcodeInfo {
    filamentWeightG: number | null;
    printTimeSeconds: number | null;
    filamentLengthMm: number | null;
}

export interface CalculatedCosts {
    materialCost: number;
    electricityCost: number;
    laborCost: number;
    postProcessingCost: number;
    totalCost: number;
    markupPrice: number;
    finalPrice: number;
}

export interface Currency {
    name: string;
    symbol: string;
    rate: number;
}

export interface Currencies {
    [key: string]: Currency;
}

export interface HistoryEntry {
    id: string;
    data: CalculationData;
    costs: CalculatedCosts;
    currency: Currency;
}
