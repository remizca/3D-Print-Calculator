
import { CalculationData, Currencies } from './types';

export const CURRENCIES: Currencies = {
    USD: { name: 'US Dollar', symbol: '$', rate: 1.00 },
    PHP: { name: 'Philippine Peso', symbol: '₱', rate: 58.75 },
    EUR: { name: 'Euro', symbol: '€', rate: 0.92 },
    GBP: { name: 'British Pound', symbol: '£', rate: 0.79 },
    CAD: { name: 'Canadian Dollar', symbol: 'C$', rate: 1.37 },
    AUD: { name: 'Australian Dollar', symbol: 'A$', rate: 1.50 },
    JPY: { name: 'Japanese Yen', symbol: '¥', rate: 157.30 }
};

export const DEFAULT_VALUES: CalculationData = {
    printName: '',
    customerName: '',
    purchaseDate: '',
    currency: 'USD',
    filamentWeight: 50,
    filamentPrice: 25,
    includeElectricity: true,
    printTimeHours: 4,
    printTimeMinutes: 0,
    electricityCost: 0.15,
    includeLabor: true,
    laborTimeHours: 0,
    laborTimeMinutes: 30,
    laborRate: 15,
    includePostProcessing: true,
    postProcessingHours: 1,
    postProcessingMinutes: 0,
    postProcessingRate: 10,
    markup: 200,
};
