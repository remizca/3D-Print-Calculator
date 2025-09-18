
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CalculationData, HistoryEntry, Currency, GcodeInfo } from './types';
import { CURRENCIES, DEFAULT_VALUES, FILAMENT_DENSITY_G_CM3 } from './constants';
import { getHistory, saveHistory, deleteHistoryItem as removeHistoryItem } from './services/historyService';
import { generatePdf } from './services/pdfService';
import { parseGcode } from './services/gcodeService';
import { analyzeGcodeWithAI } from './services/geminiService';
import CalculatorView from './components/CalculatorView';
import HistoryView from './components/HistoryView';
import Modal from './components/Modal';

type AnalysisStatus = 'idle' | 'parsing' | 'deep_scan' | 'failed' | 'success';

const App: React.FC = () => {
    const [view, setView] = useState<'calculator' | 'history'>('calculator');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [modal, setModal] = useState<{ title: string; message: string } | null>(null);
    const [data, setData] = useState<CalculationData>(DEFAULT_VALUES);
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
    const [analysisMethod, setAnalysisMethod] = useState<'local' | 'ai' | null>(null);


    useEffect(() => {
        setHistory(getHistory());
        const today = new Date().toISOString().split('T')[0];
        setData(prev => ({...prev, purchaseDate: today}));
    }, []);
    
    const selectedCurrency: Currency = useMemo(() => CURRENCIES[data.currency], [data.currency]);

    const calculatedCosts = useMemo(() => {
        const materialCost = (data.filamentWeight / 1000) * data.filamentPrice;
        
        const totalSeconds = (data.printTimeHours * 3600) + (data.printTimeMinutes * 60) + data.printTimeSeconds;
        const totalPrintTimeInHours = totalSeconds / 3600;

        const electricityCost = data.includeElectricity ? (totalPrintTimeInHours * data.electricityCost) : 0; 

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

    const updateStateFromParsedData = (parsedData: GcodeInfo, file: File) => {
        const { filamentWeightG, printTimeSeconds, filamentLengthMm } = parsedData;

        let finalWeightG: number;
        if (filamentWeightG !== null && filamentWeightG > 0) {
            finalWeightG = filamentWeightG;
        } else if (filamentLengthMm && filamentLengthMm > 0) {
            const radiusMm = data.filamentDiameter / 2;
            const volumeMm3 = Math.PI * Math.pow(radiusMm, 2) * filamentLengthMm;
            const volumeCm3 = volumeMm3 / 1000;
            finalWeightG = volumeCm3 * FILAMENT_DENSITY_G_CM3;
             console.warn("Used fallback weight calculation from filament length.");
        } else {
            // No valid weight or length, leave the current weight unchanged
            finalWeightG = data.filamentWeight;
        }
        
        const totalSeconds = printTimeSeconds || 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        setData(prev => ({
            ...prev,
            printName: file.name.replace(/\.gcode$/i, ''),
            filamentWeight: parseFloat(finalWeightG.toFixed(2)),
            printTimeHours: hours,
            printTimeMinutes: minutes,
            printTimeSeconds: seconds,
        }));
    };

    const handleGcodeUpload = useCallback(async (file: File) => {
        if (!file.name.toLowerCase().endsWith('.gcode')) {
            setModal({ title: "Invalid File", message: "Please upload a valid .gcode file." });
            return;
        }

        setAnalysisStatus('parsing');
        setAnalysisMethod(null);

        try {
            const gcodeText = await file.text();
            let parsedData = parseGcode(gcodeText);

            // --- STAGE 2: AI DEEP SCAN FALLBACK ---
            // If local parsing fails to get key data, use Gemini.
            if (!parsedData.printTimeSeconds || !parsedData.filamentWeightG) {
                console.log("Local parse insufficient. Triggering AI Deep Scan.");
                setAnalysisStatus('deep_scan');
                try {
                    const aiResult = await analyzeGcodeWithAI(gcodeText);
                    parsedData = { ...parsedData, ...aiResult }; // Merge AI results, giving them priority
                    setAnalysisMethod('ai');
                } catch(aiError) {
                    console.error("AI analysis failed:", aiError);
                    setModal({ title: "AI Analysis Failed", message: "The AI-powered deep scan could not analyze the file. Please check the browser console for more details." });
                    setAnalysisStatus('failed');
                    return;
                }
            } else {
                 setAnalysisMethod('local');
            }

            if (!parsedData.printTimeSeconds && !parsedData.filamentWeightG && !parsedData.filamentLengthMm) {
                 setModal({ title: "Analysis Failed", message: "Could not extract any meaningful data from the G-code file, even with AI analysis." });
                 setAnalysisStatus('failed');
                 return;
            }

            updateStateFromParsedData(parsedData, file);
            setModal({ title: "Success!", message: "G-code analyzed and fields have been updated." });
            setAnalysisStatus('success');

        } catch (error) {
            console.error("Failed to parse G-code:", error);
            setModal({ title: "Error", message: "An unexpected error occurred while processing the G-code file." });
            setAnalysisStatus('failed');
        }
    }, [data.filamentDiameter, data.filamentWeight]);


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

    const handleReprintFromHistory = (item: HistoryEntry) => {
        setData(item.data);
        setView('calculator');
        setModal({ title: "Data Loaded", message: `The print data for "${item.data.printName}" has been loaded into the calculator.` });
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
                        analysisStatus={analysisStatus}
                        analysisMethod={analysisMethod}
                        onDataChange={handleDataChange}
                        onGcodeUpload={handleGcodeUpload}
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
                        onReprint={handleReprintFromHistory}
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