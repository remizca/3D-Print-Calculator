
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalculationData, HistoryEntry, Currency } from './types';
import { CURRENCIES, DEFAULT_VALUES } from './constants';
import { getHistory, saveHistory, deleteHistoryItem as removeHistoryItem } from './services/historyService';
import { generatePdf } from './services/pdfService';
import CalculatorView from './components/CalculatorView';
import HistoryView from './components/HistoryView';
import Modal from './components/Modal';

const App: React.FC = () => {
    const [view, setView] = useState<'calculator' | 'history'>('calculator');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [modal, setModal] = useState<{ title: string; message: string } | null>(null);
    const [data, setData] = useState<CalculationData>(DEFAULT_VALUES);

    useEffect(() => {
        setHistory(getHistory());
        const today = new Date().toISOString().split('T')[0];
        setData(prev => ({...prev, purchaseDate: today}));
    }, []);
    
    const selectedCurrency: Currency = useMemo(() => CURRENCIES[data.currency], [data.currency]);

    const calculatedCosts = useMemo(() => {
        const materialCost = (data.filamentWeight / 1000) * data.filamentPrice;
        
        const totalPrintTime = data.printTimeHours + (data.printTimeMinutes / 60);
        const electricityCost = data.includeElectricity ? (totalPrintTime * 0.05) * data.electricityCost : 0; // Assuming 50W printer

        const totalLaborTime = data.laborTimeHours + (data.laborTimeMinutes / 60);
        const laborCost = data.includeLabor ? totalLaborTime * data.laborRate : 0;
        
        const totalPostProcessingTime = data.postProcessingHours + (data.postProcessingMinutes / 60);
        const postProcessingCost = data.includePostProcessing ? totalPostProcessingTime * data.postProcessingRate : 0;

        const totalCost = materialCost + electricityCost + laborCost + postProcessingCost;
        const markupPrice = totalCost * (data.markup / 100);
        const finalPrice = totalCost + markupPrice;

        return {
            materialCost,
            electricityCost,
            laborCost,
            postProcessingCost,
            totalCost,
            markupPrice,
            finalPrice
        };
    }, [data]);
    
    const handleDataChange = useCallback(<K extends keyof CalculationData>(key: K, value: CalculationData[K]) => {
        if (key === 'currency') {
            const oldCurrencyKey = data.currency;
            const newCurrencyKey = value as string;
            
            const oldRate = CURRENCIES[oldCurrencyKey].rate;
            const newRate = CURRENCIES[newCurrencyKey].rate;

            setData(prev => ({
                ...prev,
                currency: newCurrencyKey,
                filamentPrice: (prev.filamentPrice / oldRate) * newRate,
                electricityCost: (prev.electricityCost / oldRate) * newRate,
                laborRate: (prev.laborRate / oldRate) * newRate,
                postProcessingRate: (prev.postProcessingRate / oldRate) * newRate,
            }));

        } else {
             setData(prev => ({ ...prev, [key]: value }));
        }
    }, [data.currency]);


    const handleSaveToHistory = () => {
        if (!data.printName.trim()) {
            setModal({ title: "Save Error", message: "Please enter a Print Name before saving." });
            return;
        }

        const newEntry: HistoryEntry = {
            id: new Date().toISOString(),
            data: { ...data },
            costs: { ...calculatedCosts },
            currency: selectedCurrency
        };
        const updatedHistory = saveHistory(newEntry);
        setHistory(updatedHistory);
        setModal({ title: "Success!", message: "Calculation saved to history." });
    };

    const handleDeleteFromHistory = (id: string) => {
        const updatedHistory = removeHistoryItem(id);
        setHistory(updatedHistory);
        setModal({ title: "Deleted", message: "Item has been removed from history." });
    };
    
    const handleViewHistoryItem = (item: HistoryEntry) => {
        const { currency, costs } = item;
        const formattedMessage = 
`Print Name: ${item.data.printName}
Customer Name: ${item.data.customerName || 'N/A'}
Date: ${item.data.purchaseDate || 'N/A'}

Material Cost: ${currency.symbol} ${costs.materialCost.toFixed(2)}
Electricity Cost: ${currency.symbol} ${costs.electricityCost.toFixed(2)}
Labor Cost: ${currency.symbol} ${costs.laborCost.toFixed(2)}
Post-Processing Cost: ${currency.symbol} ${costs.postProcessingCost.toFixed(2)}

Total Cost: ${currency.symbol} ${costs.totalCost.toFixed(2)}
Markup Price: ${currency.symbol} ${costs.markupPrice.toFixed(2)}
Final Price: ${currency.symbol} ${costs.finalPrice.toFixed(2)}`;

        setModal({ title: "Saved Print Details", message: formattedMessage });
    };

    const handleGeneratePdf = () => {
         if (!data.printName.trim()) {
            setModal({ title: "PDF Generation Error", message: "Please enter a Print Name to generate a receipt." });
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
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <main className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 w-full max-w-2xl">
                {view === 'calculator' ? (
                    <CalculatorView 
                        data={data}
                        costs={calculatedCosts}
                        currency={selectedCurrency}
                        onDataChange={handleDataChange}
                        onSave={handleSaveToHistory}
                        onGeneratePdf={handleGeneratePdf}
                        onViewHistory={() => setView('history')}
                    />
                ) : (
                    <HistoryView 
                        history={history}
                        onBack={() => setView('calculator')}
                        onDelete={handleDeleteFromHistory}
                        onView={handleViewHistoryItem}
                    />
                )}
            </main>
            {modal && (
                <Modal 
                    title={modal.title}
                    onClose={() => setModal(null)}
                >
                    <p className="text-gray-700 whitespace-pre-wrap">{modal.message}</p>
                </Modal>
            )}
        </div>
    );
};

export default App;
