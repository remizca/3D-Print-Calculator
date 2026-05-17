
export interface CalculationData {
  printName: string;
  customerName: string;
  purchaseDate: string;
  currency: string;
  quantity: number;
  filamentDiameter: number;
  materialType: string;
  filamentWeight: number;
  filamentLengthM: number;
  filamentPrice: number;
  failureRate: number;
  includeMultiColor: boolean;
  filamentProfiles: FilamentProfile[];
  colorSwitchCount: number;
  prepTimeMinutes: number;
  prepTimeSeconds: number;
  slicedTotalTimeHours: number;
  slicedTotalTimeMinutes: number;
  slicedTotalTimeSeconds: number;
  includeElectricity: boolean;
  printerWattage: number;
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
  includeDepreciation: boolean;
  depreciationRate: number;
  taxRate: number;
  markup: number;
}

export interface GcodeInfo {
    filamentWeightG: number | null;
    printTimeSeconds: number | null;
    filamentLengthMm: number | null;
    totalEstimatedTimeSeconds?: number | null;
    filamentProfiles?: FilamentProfile[];
    colorSwitchCount?: number | null;
}

export interface FilamentProfile {
    id: string;
    colorName: string;
    importedTotalWeightG: number;
    modelWeightG: number;
    purgeWasteG: number;
    towerWasteG: number;
    pricePerKg: number;
}

export interface CalculatedCosts {
  baseMaterialCost: number;
  modelMaterialCost: number;
  purgeMaterialCost: number;
  towerMaterialCost: number;
  multiColorMaterialCost: number;
  purgeWasteCost: number;
  totalPurgeWasteG: number;
  totalTowerWasteG: number;
  totalWasteG: number;
  importedCombinedWeightG: number;
  extraSwitchTimeSeconds: number;
  calculatedSwitchTimePerChangeSeconds: number;
  prepTimeSeconds: number;
  effectivePrintTimeSeconds: number;
  computedWeightG: number | null;
  computedLengthM: number | null;
  materialCost: number;
  failureCost: number;
  electricityCost: number;
  laborCost: number;
  prepLaborCost: number;
  postProcessingCost: number;
  depreciationCost: number;
  totalCost: number;
  markupPrice: number;
  taxAmount: number;
  perUnitPrice: number;
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
