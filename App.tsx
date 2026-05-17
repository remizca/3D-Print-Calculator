import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalculationData, HistoryEntry, Currency, Currencies } from './types';
import { CURRENCIES, DEFAULT_VALUES, FILAMENT_DENSITIES } from './constants';
import { getHistory, saveHistory, deleteHistoryItem as removeHistoryItem } from './services/historyService';
import { generatePdf } from './services/pdfService';
import { fetchRates } from './services/currencyService';
import CalculatorView from './components/CalculatorView';
import HistoryView from './components/HistoryView';
import Modal from './components/Modal';
import { Analytics } from '@vercel/analytics/react';

const App: React.FC = () => {
  const [view, setView] = useState<'calculator' | 'history'>('calculator');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modal, setModal] = useState<{ title: string; message: string } | null>(null);
  const [data, setData] = useState<CalculationData>(DEFAULT_VALUES);
  const [currencies, setCurrencies] = useState<Currencies>(CURRENCIES);
  const [ratesLastUpdated, setRatesLastUpdated] = useState<string | null>(null);
  const [ratesStale, setRatesStale] = useState(false);
  const [ratesLoading, setRatesLoading] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    const today = new Date().toISOString().split('T')[0];
    setData(prev => ({ ...prev, purchaseDate: today }));
    loadCurrencyRates();
  }, []);

  const loadCurrencyRates = async () => {
    setRatesLoading(true);
    try {
      const { rates, lastUpdated, isStale } = await fetchRates();
      setCurrencies(rates);
      setRatesLastUpdated(lastUpdated);
      setRatesStale(isStale);
    } catch {
      setRatesStale(true);
    } finally {
      setRatesLoading(false);
    }
  };

  const selectedCurrency: Currency = useMemo(() => currencies[data.currency] || CURRENCIES['USD'], [data.currency, currencies]);

  const calculatedCosts = useMemo(() => {
    const baseMaterialCost = (data.filamentWeight / 1000) * data.filamentPrice;
    const importedCombinedWeightG = data.filamentProfiles.reduce((sum, profile) => sum + profile.importedTotalWeightG, 0);
    const profileResolvedConsumedWeightG = (profile: typeof data.filamentProfiles[number]) => {
      const detailedWeight = profile.modelWeightG + profile.purgeWasteG + profile.towerWasteG;
      return detailedWeight > 0 ? detailedWeight : profile.importedTotalWeightG;
    };
    const modelMaterialCost = data.filamentProfiles.reduce(
      (sum, profile) => sum + ((profile.modelWeightG / 1000) * profile.pricePerKg),
      0,
    );
    const totalPurgeWasteG = data.filamentProfiles.reduce((sum, profile) => sum + profile.purgeWasteG, 0);
    const totalTowerWasteG = data.filamentProfiles.reduce((sum, profile) => sum + profile.towerWasteG, 0);
    const purgeMaterialCost = data.filamentProfiles.reduce(
      (sum, profile) => sum + ((profile.purgeWasteG / 1000) * profile.pricePerKg),
      0,
    );
    const towerMaterialCost = data.filamentProfiles.reduce(
      (sum, profile) => sum + ((profile.towerWasteG / 1000) * profile.pricePerKg),
      0,
    );
    const totalWasteG = totalPurgeWasteG + totalTowerWasteG;
    const purgeWasteCost = data.includeMultiColor ? purgeMaterialCost + towerMaterialCost : 0;
    const importedCombinedMaterialCost = data.filamentProfiles.reduce(
      (sum, profile) => sum + ((profileResolvedConsumedWeightG(profile) / 1000) * profile.pricePerKg),
      0,
    );
    const multiColorMaterialCost = data.includeMultiColor ? importedCombinedMaterialCost : modelMaterialCost;
    const materialCost = data.includeMultiColor ? multiColorMaterialCost : baseMaterialCost;

    const failureCost = materialCost * (data.failureRate / 100);

    const density = FILAMENT_DENSITIES[data.materialType] || FILAMENT_DENSITIES['PLA'];
    const radiusCm = (data.filamentDiameter / 2) / 10;
    const crossSectionCm2 = Math.PI * radiusCm * radiusCm;
    let computedWeightG: number | null = null;
    let computedLengthM: number | null = null;
    if (data.filamentLengthM > 0 && data.filamentWeight === 0) {
      computedWeightG = crossSectionCm2 * (data.filamentLengthM * 100) * density;
    } else if (data.filamentWeight > 0 && data.filamentLengthM === 0) {
      const volumeCm3 = data.filamentWeight / density;
      computedLengthM = (volumeCm3 / crossSectionCm2) / 100;
    }

    const basePrintTimeSeconds = (data.printTimeHours * 3600) + (data.printTimeMinutes * 60) + data.printTimeSeconds;
    const prepTimeSeconds = data.includeMultiColor
      ? ((data.prepTimeMinutes * 60) + data.prepTimeSeconds)
      : 0;
    const slicedTotalTimeSeconds = data.includeMultiColor
      ? ((data.slicedTotalTimeHours * 3600) + (data.slicedTotalTimeMinutes * 60) + data.slicedTotalTimeSeconds)
      : 0;
    const derivedSwitchTimeSeconds = data.includeMultiColor
      ? Math.max(0, slicedTotalTimeSeconds - basePrintTimeSeconds - prepTimeSeconds)
      : 0;
    const calculatedSwitchTimePerChangeSeconds = data.includeMultiColor && data.colorSwitchCount > 0
      ? derivedSwitchTimeSeconds / data.colorSwitchCount
      : 0;
    const extraSwitchTimeSeconds = data.includeMultiColor ? derivedSwitchTimeSeconds : 0;
    const effectivePrintTimeSeconds = data.includeMultiColor && slicedTotalTimeSeconds > 0
      ? slicedTotalTimeSeconds
      : basePrintTimeSeconds + extraSwitchTimeSeconds + prepTimeSeconds;
    const totalPrintTimeInHours = effectivePrintTimeSeconds / 3600;

    const electricityCost = data.includeElectricity
      ? (data.printerWattage / 1000) * totalPrintTimeInHours * data.electricityCost
      : 0;

    const totalLaborTime = data.laborTimeHours + (data.laborTimeMinutes / 60);
    const baseLaborCost = data.includeLabor ? totalLaborTime * data.laborRate : 0;
    const prepLaborCost = (data.includeMultiColor && data.includeLabor && prepTimeSeconds > 0)
      ? (prepTimeSeconds / 3600) * data.laborRate
      : 0;
    const laborCost = baseLaborCost + prepLaborCost;

    const totalPostProcessingTime = data.postProcessingHours + (data.postProcessingMinutes / 60);
    const postProcessingCost = data.includePostProcessing ? totalPostProcessingTime * data.postProcessingRate : 0;

    const depreciationCost = data.includeDepreciation ? totalPrintTimeInHours * data.depreciationRate : 0;

    const totalCost = materialCost + failureCost + electricityCost + laborCost + postProcessingCost + depreciationCost;
    const markupPrice = totalCost * (data.markup / 100);
    const taxAmount = (totalCost + markupPrice) * (data.taxRate / 100);
    const perUnitPrice = totalCost + markupPrice + taxAmount;
    const finalPrice = perUnitPrice * data.quantity;

    return {
      baseMaterialCost,
      modelMaterialCost,
      purgeMaterialCost,
      towerMaterialCost,
      multiColorMaterialCost,
      purgeWasteCost,
      totalPurgeWasteG,
      totalTowerWasteG,
      totalWasteG,
      importedCombinedWeightG,
      extraSwitchTimeSeconds,
      calculatedSwitchTimePerChangeSeconds,
      prepTimeSeconds,
      effectivePrintTimeSeconds,
      computedWeightG,
      computedLengthM,
      materialCost,
      failureCost,
      electricityCost,
      laborCost,
      prepLaborCost,
      postProcessingCost,
      depreciationCost,
      totalCost,
      markupPrice,
      taxAmount,
      perUnitPrice,
      finalPrice,
    };
  }, [data]);

  const handleDataChange = useCallback(<K extends keyof CalculationData>(key: K, value: CalculationData[K]) => {
    if (key === 'currency') {
      const oldCurrencyKey = data.currency;
      const newCurrencyKey = value as string;

      const oldRate = currencies[oldCurrencyKey]?.rate || 1;
      const newRate = currencies[newCurrencyKey]?.rate || 1;

      setData(prev => ({
        ...prev,
        currency: newCurrencyKey,
        filamentPrice: (prev.filamentPrice / oldRate) * newRate,
        filamentProfiles: prev.filamentProfiles.map(profile => ({
          ...profile,
          pricePerKg: (profile.pricePerKg / oldRate) * newRate,
        })),
        electricityCost: (prev.electricityCost / oldRate) * newRate,
        laborRate: (prev.laborRate / oldRate) * newRate,
        postProcessingRate: (prev.postProcessingRate / oldRate) * newRate,
        depreciationRate: (prev.depreciationRate / oldRate) * newRate,
      }));
    } else if (key === 'filamentWeight') {
      const newWeight = value as number;
      const density = FILAMENT_DENSITIES[data.materialType] || FILAMENT_DENSITIES['PLA'];
      const radiusCm = (data.filamentDiameter / 2) / 10;
      const crossSectionCm2 = Math.PI * radiusCm * radiusCm;
      const newLength = newWeight > 0 ? ((newWeight / density) / crossSectionCm2) / 100 : 0;
      setData(prev => ({ ...prev, filamentWeight: newWeight, filamentLengthM: parseFloat(newLength.toFixed(2)) }));
    } else if (key === 'filamentLengthM') {
      const newLength = value as number;
      const density = FILAMENT_DENSITIES[data.materialType] || FILAMENT_DENSITIES['PLA'];
      const radiusCm = (data.filamentDiameter / 2) / 10;
      const crossSectionCm2 = Math.PI * radiusCm * radiusCm;
      const newWeight = newLength > 0 ? crossSectionCm2 * (newLength * 100) * density : 0;
      setData(prev => ({ ...prev, filamentLengthM: newLength, filamentWeight: parseFloat(newWeight.toFixed(2)) }));
    } else if (key === 'filamentDiameter' || key === 'materialType') {
      setData(prev => {
        const updated = { ...prev, [key]: value };
        const density = FILAMENT_DENSITIES[updated.materialType] || FILAMENT_DENSITIES['PLA'];
        const radiusCm = (updated.filamentDiameter / 2) / 10;
        const crossSectionCm2 = Math.PI * radiusCm * radiusCm;
        if (updated.filamentWeight > 0) {
          const newLength = ((updated.filamentWeight / density) / crossSectionCm2) / 100;
          updated.filamentLengthM = parseFloat(newLength.toFixed(2));
        } else if (updated.filamentLengthM > 0) {
          const newWeight = crossSectionCm2 * (updated.filamentLengthM * 100) * density;
          updated.filamentWeight = parseFloat(newWeight.toFixed(2));
        }
        return updated;
      });
    } else {
      setData(prev => ({ ...prev, [key]: value }));
    }
  }, [data.currency, data.materialType, data.filamentDiameter, currencies]);

  const handleFilamentProfileChange = useCallback((id: string, key: string, value: string | number) => {
    setData(prev => ({
      ...prev,
      filamentProfiles: prev.filamentProfiles.map(profile => (
        profile.id === id ? { ...profile, [key]: value } : profile
      )),
    }));
  }, []);

  const handleAddFilamentProfile = useCallback(() => {
    setData(prev => ({
      ...prev,
      filamentProfiles: [
        ...prev.filamentProfiles,
        { id: `profile-${Date.now()}`, colorName: `Color ${prev.filamentProfiles.length + 1}`, importedTotalWeightG: 0, modelWeightG: 0, purgeWasteG: 0, towerWasteG: 0, pricePerKg: prev.filamentPrice },
      ],
    }));
  }, []);

  const handleRemoveFilamentProfile = useCallback((id: string) => {
    setData(prev => {
      if (prev.filamentProfiles.length <= 2) {
        return prev;
      }

      return {
        ...prev,
        filamentProfiles: prev.filamentProfiles.filter(profile => profile.id !== id),
      };
    });
  }, []);

  const handleSaveToHistory = () => {
    if (!data.printName.trim()) {
      setModal({ title: 'Save Error', message: 'Please enter a Print Name before saving.' });
      return;
    }

    const newEntry: HistoryEntry = {
      id: new Date().toISOString(),
      data: { ...data },
      costs: { ...calculatedCosts },
      currency: selectedCurrency,
    };

    const updatedHistory = saveHistory(newEntry);
    setHistory(updatedHistory);
    setModal({ title: 'Saved', message: 'Calculation saved to history.' });
  };

  const handleDeleteFromHistory = (id: string) => {
    const updatedHistory = removeHistoryItem(id);
    setHistory(updatedHistory);
    setModal({ title: 'Deleted', message: 'Item has been removed from history.' });
  };

  const handleViewHistoryItem = (item: HistoryEntry) => {
    const { currency, costs } = item;
    const multiColorDetails = item.data.includeMultiColor
      ? `Model Filament Cost: ${currency.symbol} ${costs.modelMaterialCost.toFixed(2)}
Purged Filament Cost: ${currency.symbol} ${costs.purgeMaterialCost.toFixed(2)}
Tower Filament Cost: ${currency.symbol} ${costs.towerMaterialCost.toFixed(2)}
Purged Filament Total: ${costs.totalPurgeWasteG.toFixed(2)} g
Tower Filament Total: ${costs.totalTowerWasteG.toFixed(2)} g
Filament Changes: ${item.data.colorSwitchCount}
Added Change Time: ${costs.extraSwitchTimeSeconds} seconds
Per Change Overhead: ${Math.round(costs.calculatedSwitchTimePerChangeSeconds)} seconds
Prep/Timelapse Time: ${costs.prepTimeSeconds} seconds
`
      : '';
    const failureDetails = item.data.failureRate > 0
      ? `Failure Buffer (${item.data.failureRate}%): ${currency.symbol} ${costs.failureCost.toFixed(2)}
`
      : '';
    const depreciationDetails = item.data.includeDepreciation
      ? `Depreciation: ${currency.symbol} ${costs.depreciationCost.toFixed(2)}
`
      : '';
    const taxDetails = item.data.taxRate > 0
      ? `Tax (${item.data.taxRate}%): ${currency.symbol} ${costs.taxAmount.toFixed(2)}
`
      : '';
    const quantityDetails = item.data.quantity > 1
      ? `Quantity: ${item.data.quantity}
Per Unit: ${currency.symbol} ${costs.perUnitPrice.toFixed(2)}
`
      : '';
    const formattedMessage =
      `Print Name: ${item.data.printName}
Customer Name: ${item.data.customerName || 'N/A'}
Date: ${item.data.purchaseDate || 'N/A'}
Quantity: ${item.data.quantity}
Material: ${item.data.materialType} (${item.data.filamentDiameter}mm)
Multi-Color Mode: ${item.data.includeMultiColor ? 'Enabled' : 'Disabled'}

Material Cost: ${currency.symbol} ${costs.materialCost.toFixed(2)}
${failureDetails}${multiColorDetails}Electricity (${item.data.printerWattage}W): ${currency.symbol} ${costs.electricityCost.toFixed(2)}
Labor: ${currency.symbol} ${costs.laborCost.toFixed(2)}
Post-Processing: ${currency.symbol} ${costs.postProcessingCost.toFixed(2)}
${depreciationDetails}
Total Cost: ${currency.symbol} ${costs.totalCost.toFixed(2)}
Markup Price: ${currency.symbol} ${costs.markupPrice.toFixed(2)}
${taxDetails}${quantityDetails}Final Price: ${currency.symbol} ${costs.finalPrice.toFixed(2)}`;

    setModal({ title: 'Saved Print Details', message: formattedMessage });
  };

  const handleReprintFromHistory = (item: HistoryEntry) => {
    setData({ ...DEFAULT_VALUES, ...item.data });
    setView('calculator');
    setModal({
      title: 'Data Loaded',
      message: `The print data for "${item.data.printName}" has been loaded into the calculator.`,
    });
  };

  const handleGeneratePdf = () => {
    if (!data.printName.trim()) {
      setModal({ title: 'PDF Generation Error', message: 'Please enter a Print Name to generate a receipt.' });
      return;
    }

    const entry: HistoryEntry = {
      id: new Date().toISOString(),
      data,
      costs: calculatedCosts,
      currency: selectedCurrency,
    };

    generatePdf(entry);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_#e5e7eb_0%,_#dbe4f0_45%,_#e5e7eb_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-0 top-16 h-56 w-56 rounded-full bg-amber-300/35 blur-3xl" />
        <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/25 blur-3xl" />
      </div>

      <main className="relative mx-auto w-full max-w-[1700px] rounded-[2rem] border border-slate-400/45 bg-slate-100/88 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur sm:p-6 xl:p-8 2xl:max-w-[1820px]">
        <header className="mb-8 rounded-[1.75rem] border-2 border-slate-700/80 bg-slate-900 px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.3)] sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                Print pricing workspace
              </div>
              <h1 className="font-['Space_Grotesk'] text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Modern cost planning for every 3D print.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Enter your slicer values directly and get an instant quote. Each section explains what it controls and the live summary keeps pricing visible while you work.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <nav className="inline-flex rounded-2xl border border-white/10 bg-white/5 p-1.5">
                <button
                  type="button"
                  onClick={() => setView('calculator')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${view === 'calculator' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                >
                  Calculator
                </button>
                <button
                  type="button"
                  onClick={() => setView('history')}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${view === 'history' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                >
                  History
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${view === 'history' ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-slate-200'}`}>
                    {history.length}
                  </span>
                </button>
              </nav>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                  Current quote
                </div>
                <div className="mt-1 text-2xl font-bold text-white">
                  {selectedCurrency.symbol} {calculatedCosts.finalPrice.toFixed(2)}
                </div>
                {data.quantity > 1 && (
                  <div className="text-xs text-emerald-200/80">
                    {selectedCurrency.symbol} {calculatedCosts.perUnitPrice.toFixed(2)} per unit × {data.quantity}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {view === 'calculator' ? (
          <CalculatorView
            data={data}
            costs={calculatedCosts}
            currency={selectedCurrency}
            currencies={currencies}
            ratesLastUpdated={ratesLastUpdated}
            ratesStale={ratesStale}
            ratesLoading={ratesLoading}
            onDataChange={handleDataChange}
            onFilamentProfileChange={handleFilamentProfileChange}
            onAddFilamentProfile={handleAddFilamentProfile}
            onRemoveFilamentProfile={handleRemoveFilamentProfile}
            onSave={handleSaveToHistory}
            onGeneratePdf={handleGeneratePdf}
            onViewHistory={() => setView('history')}
            onRefreshRates={loadCurrencyRates}
          />
        ) : (
          <HistoryView
            history={history}
            onBack={() => setView('calculator')}
            onDelete={handleDeleteFromHistory}
            onView={handleViewHistoryItem}
            onReprint={handleReprintFromHistory}
          />
        )}

        <Analytics />
      </main>

      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{modal.message}</p>
        </Modal>
      )}
    </div>
  );
};

export default App;
