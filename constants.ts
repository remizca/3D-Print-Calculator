
import { CalculationData, Currencies, FilamentProfile } from './types';

export const EXCHANGE_RATE_API_URL = 'https://v6.exchangerate-api.com/v6/add219c4d63370f9799143b8/latest/USD';

export const CURRENCIES: Currencies = {
  USD: { name: 'US Dollar', symbol: '$', rate: 1.00 },
  PHP: { name: 'Philippine Peso', symbol: '₱', rate: 61.66 },
  EUR: { name: 'Euro', symbol: '€', rate: 0.86 },
  GBP: { name: 'British Pound', symbol: '£', rate: 0.75 },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', rate: 1.37 },
  AUD: { name: 'Australian Dollar', symbol: 'A$', rate: 1.40 },
  JPY: { name: 'Japanese Yen', symbol: '¥', rate: 158.61 },
  CNY: { name: 'Chinese Yuan', symbol: '¥', rate: 6.83 },
  INR: { name: 'Indian Rupee', symbol: '₹', rate: 95.98 },
  KRW: { name: 'South Korean Won', symbol: '₩', rate: 1497.84 },
  BRL: { name: 'Brazilian Real', symbol: 'R$', rate: 5.01 },
  MXN: { name: 'Mexican Peso', symbol: 'Mex$', rate: 17.34 },
  CHF: { name: 'Swiss Franc', symbol: 'Fr', rate: 0.79 },
  SEK: { name: 'Swedish Krona', symbol: 'kr', rate: 9.44 },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', rate: 1.28 },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.71 },
  THB: { name: 'Thai Baht', symbol: '฿', rate: 32.64 },
  AED: { name: 'UAE Dirham', symbol: 'د.إ', rate: 3.67 },
  ZAR: { name: 'South African Rand', symbol: 'R', rate: 16.65 },
  NOK: { name: 'Norwegian Krone', symbol: 'kr', rate: 9.31 },
};

export const FILAMENT_DENSITIES: Record<string, number> = {
  PLA: 1.24,
  PETG: 1.27,
  ABS: 1.04,
  TPU: 1.21,
  Nylon: 1.12,
  ASA: 1.07,
  PC: 1.20,
};

export const FILAMENT_DENSITY_G_CM3 = 1.24;

export const createDefaultFilamentProfile = (
    id: string,
    colorName: string,
    importedTotalWeightG = 0,
    modelWeightG = 0,
    pricePerKg = 25,
    purgeWasteG = 0,
    towerWasteG = 0,
): FilamentProfile => ({
    id,
    colorName,
    importedTotalWeightG,
    modelWeightG,
    purgeWasteG,
    towerWasteG,
    pricePerKg,
});

export const DEFAULT_VALUES: CalculationData = {
  printName: '',
  customerName: '',
  purchaseDate: '',
  currency: 'USD',
  quantity: 1,
  filamentDiameter: 1.75,
  materialType: 'PLA',
  filamentWeight: 50,
  filamentLengthM: 0,
  filamentPrice: 25,
  failureRate: 0,
  includeMultiColor: false,
  filamentProfiles: [
    createDefaultFilamentProfile('profile-1', 'Primary Color', 0, 35, 25, 1.2, 0.2),
    createDefaultFilamentProfile('profile-2', 'Accent Color', 0, 15, 25, 0.8, 0.1),
  ],
  colorSwitchCount: 0,
  prepTimeMinutes: 0,
  prepTimeSeconds: 0,
  slicedTotalTimeHours: 0,
  slicedTotalTimeMinutes: 0,
  slicedTotalTimeSeconds: 0,
  includeElectricity: true,
  printerWattage: 200,
  printTimeHours: 4,
  printTimeMinutes: 0,
  printTimeSeconds: 0,
  electricityCost: 0.15,
  includeLabor: true,
  laborTimeHours: 0,
  laborTimeMinutes: 30,
  laborRate: 15,
  includePostProcessing: true,
  postProcessingHours: 1,
  postProcessingMinutes: 0,
  postProcessingRate: 10,
  includeDepreciation: false,
  depreciationRate: 0.25,
  taxRate: 0,
  markup: 200,
};
