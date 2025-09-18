
import React from 'react';
import { CalculationData, CalculatedCosts, Currency } from '../types';
import { CURRENCIES } from '../constants';

type AnalysisStatus = 'idle' | 'parsing' | 'deep_scan' | 'failed' | 'success';

interface CalculatorViewProps {
    data: CalculationData;
    costs: CalculatedCosts;
    currency: Currency;
    analysisStatus: AnalysisStatus;
    analysisMethod: 'local' | 'ai' | null;
    onDataChange: <K extends keyof CalculationData>(key: K, value: CalculationData[K]) => void;
    onGcodeUpload: (file: File) => void;
    onSave: () => void;
    onGeneratePdf: () => void;
    onViewHistory: () => void;
}

const InputField: React.FC<{id: string, label: string, type?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, min?: number | string, max?: number | string, step?: number | string, className?: string}> = 
    ({ id, label, type = "text", value, onChange, min, max, step, className }) => (
    <div className={className}>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        <input 
            type={type} 
            id={id} 
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 shadow-sm"
        />
    </div>
);

const OptionalCostSection: React.FC<{
    title: string;
    includeId: keyof CalculationData;
    isIncluded: boolean;
    hoursId?: keyof CalculationData;
    hoursValue?: number;
    minutesId?: keyof CalculationData;
    minutesValue?: number;
    rateId: keyof CalculationData;
    rateValue: number;
    onDataChange: <K extends keyof CalculationData>(key: K, value: CalculationData[K]) => void;
    currencySymbol: string;
    rateUnit: string;
}> = ({ title, includeId, isIncluded, hoursId, hoursValue, minutesId, minutesValue, rateId, rateValue, onDataChange, currencySymbol, rateUnit }) => {
    const hasTimeFields = hoursId && minutesId;
    const gridColsClass = hasTimeFields ? 'sm:grid-cols-3' : 'sm:grid-cols-1';

    return (
        <>
            <div className="flex items-center space-x-3 mt-4">
                <input 
                    type="checkbox" 
                    id={String(includeId)}
                    checked={isIncluded}
                    onChange={(e) => onDataChange(includeId, e.target.checked)}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={String(includeId)} className="text-gray-600 font-medium cursor-pointer">{title}</label>
            </div>
            {isIncluded && (
                <div className={`grid grid-cols-1 ${gridColsClass} gap-4 mt-2`}>
                    {hasTimeFields && (
                        <>
                            <InputField
                                id={String(hoursId)}
                                label="Time (hours)"
                                type="number"
                                value={hoursValue || 0}
                                min={0}
                                onChange={(e) => onDataChange(hoursId!, e.target.valueAsNumber || 0)}
                            />
                            <InputField
                                id={String(minutesId)}
                                label="Time (minutes)"
                                type="number"
                                value={minutesValue || 0}
                                min={0} max={59}
                                onChange={(e) => onDataChange(minutesId!, e.target.valueAsNumber || 0)}
                            />
                        </>
                    )}
                    <div>
                        <label htmlFor={String(rateId)} className="block text-sm font-medium text-gray-600 mb-1">Rate <span>{currencySymbol} ({rateUnit})</span></label>
                        <input 
                            type="number" 
                            id={String(rateId)} 
                            value={rateValue}
                            min={0}
                            step="0.01"
                            onChange={(e) => onDataChange(rateId, e.target.valueAsNumber || 0)}
                            className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 shadow-sm"
                        />
                    </div>
                </div>
            )}
        </>
    );
};


const CalculatorView: React.FC<CalculatorViewProps> = ({ data, costs, currency, analysisStatus, analysisMethod, onDataChange, onGcodeUpload, onSave, onGeneratePdf, onViewHistory }) => {
    
    const isParsing = analysisStatus === 'parsing' || analysisStatus === 'deep_scan';

    const getUploaderButtonText = () => {
        if (analysisStatus === 'parsing') return 'Analyzing...';
        if (analysisStatus === 'deep_scan') return 'Performing Deep Scan...';
        return 'Upload G-code';
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 text-center sm:text-left leading-tight">3D Print Cost Calculator</h1>
                <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                    <select id="currency" value={data.currency} onChange={(e) => onDataChange('currency', e.target.value)} className="bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-300">
                        {Object.keys(CURRENCIES).map(key => (
                            <option key={key} value={key}>
                                {CURRENCIES[key].symbol} {CURRENCIES[key].name} ({key})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

             {/* G-code Uploader */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner mb-6">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Analyze G-code File</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Upload a <code>.gcode</code> file to automatically fill Print Name, Print Time, and Filament Weight. Includes AI-powered fallback for tricky files.
                </p>
                <div className="flex items-center space-x-4">
                    <label htmlFor="gcode-upload" className={`w-full cursor-pointer text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg text-center ${isParsing ? 'bg-gray-500' : 'bg-blue-500 hover:bg-blue-600'}`}>
                        {getUploaderButtonText()}
                    </label>
                    <input
                        id="gcode-upload"
                        type="file"
                        accept=".gcode"
                        className="hidden"
                        disabled={isParsing}
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                onGcodeUpload(e.target.files[0]);
                            }
                            e.target.value = ''; // Allow re-uploading the same file
                        }}
                    />
                </div>
                {isParsing && (
                    <div className="mt-4 text-center text-blue-600 font-semibold animate-pulse">
                         {analysisStatus === 'deep_scan' ? 'This may take a moment...' : 'Please wait...'}
                    </div>
                )}
                 {analysisStatus === 'success' && (
                    <div className="mt-3 text-center text-sm text-gray-600">
                        Analysis complete.
                        {analysisMethod && (
                            <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${analysisMethod === 'ai' ? 'bg-purple-200 text-purple-800' : 'bg-green-200 text-green-800'}`}>
                                {analysisMethod === 'ai' ? 'Analyzed with AI' : 'Analyzed Locally'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Print Details */}
            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner mb-6">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Print Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     <InputField id="print-name" label="Print Name" value={data.printName} onChange={(e) => onDataChange('printName', e.target.value)} />
                     <InputField id="customer-name" label="Customer Name" value={data.customerName} onChange={(e) => onDataChange('customerName', e.target.value)} />
                     <InputField id="purchase-date" label="Date" type="date" value={data.purchaseDate} onChange={(e) => onDataChange('purchaseDate', e.target.value)} />
                </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-6">
                 {/* Print Time & Material Cost */}
                 <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Print Time & Material Costs</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <InputField
                            id="print-time-hours"
                            label="Time (hours)"
                            type="number"
                            value={data.printTimeHours}
                            min={0}
                            onChange={(e) => onDataChange('printTimeHours', e.target.valueAsNumber || 0)}
                        />
                         <InputField
                            id="print-time-minutes"
                            label="Time (minutes)"
                            type="number"
                            value={data.printTimeMinutes}
                            min={0} max={59}
                            onChange={(e) => onDataChange('printTimeMinutes', e.target.valueAsNumber || 0)}
                        />
                        <InputField
                            id="print-time-seconds"
                            label="Time (seconds)"
                            type="number"
                            value={data.printTimeSeconds}
                            min={0}
                            max={59}
                            onChange={(e) => onDataChange('printTimeSeconds', e.target.valueAsNumber || 0)}
                        />
                    </div>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <InputField
                            id="filament-diameter"
                            label="Diameter (mm)"
                            type="number"
                            value={data.filamentDiameter}
                            min={0}
                            step="0.01"
                            onChange={(e) => onDataChange('filamentDiameter', e.target.valueAsNumber || 0)}
                        />
                        <InputField
                            id="filament-weight"
                            label="Weight (g)"
                            type="number"
                            value={data.filamentWeight}
                            min={0}
                            onChange={(e) => onDataChange('filamentWeight', e.target.valueAsNumber || 0)}
                        />
                         <div>
                            <label htmlFor="filament-price" className="block text-sm font-medium text-gray-600 mb-1">Filament Price <span>{currency.symbol} (per kg)</span></label>
                            <input 
                                type="number" 
                                id="filament-price"
                                value={data.filamentPrice}
                                min={0}
                                step="0.01"
                                onChange={(e) => onDataChange('filamentPrice', e.target.valueAsNumber || 0)}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all duration-300 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                 {/* Optional Costs Section */}
                 <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 shadow-inner space-y-4">
                    <h2 className="text-xl font-bold text-gray-700">Optional Costs</h2>
                    
                    <OptionalCostSection
                        title="Include Electricity Cost"
                        includeId="includeElectricity"
                        isIncluded={data.includeElectricity}
                        rateId="electricityCost"
                        rateValue={data.electricityCost}
                        onDataChange={onDataChange}
                        currencySymbol={currency.symbol}
                        rateUnit="per kWh"
                    />

                    <OptionalCostSection
                        title="Include Labor Cost"
                        includeId="includeLabor"
                        isIncluded={data.includeLabor}
                        hoursId="laborTimeHours"
                        hoursValue={data.laborTimeHours}
                        minutesId="laborTimeMinutes"
                        minutesValue={data.laborTimeMinutes}
                        rateId="laborRate"
                        rateValue={data.laborRate}
                        onDataChange={onDataChange}
                        currencySymbol={currency.symbol}
                        rateUnit="per hour"
                    />

                     <OptionalCostSection
                        title="Include Post-Processing"
                        includeId="includePostProcessing"
                        isIncluded={data.includePostProcessing}
                        hoursId="postProcessingHours"
                        hoursValue={data.postProcessingHours}
                        minutesId="postProcessingMinutes"
                        minutesValue={data.postProcessingMinutes}
                        rateId="postProcessingRate"
                        rateValue={data.postProcessingRate}
                        onDataChange={onDataChange}
                        currencySymbol={currency.symbol}
                        rateUnit="per hour"
                    />
                     
                     <div className="mt-4">
                        <InputField
                            id="markup"
                            label="Markup Percentage (%)"
                            type="number"
                            value={data.markup}
                            min={0}
                            onChange={(e) => onDataChange('markup', e.target.valueAsNumber || 0)}
                        />
                    </div>
                 </div>

                 {/* Results Section */}
                <div className="p-6 bg-gray-800 text-white rounded-2xl shadow-lg">
                    <h2 className="text-xl font-bold mb-4">Final Cost Breakdown</h2>
                    <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-center"><span className="font-medium">Material Cost:</span><span className="font-bold">{currency.symbol} {costs.materialCost.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-medium">Electricity Cost:</span><span className="font-bold">{currency.symbol} {costs.electricityCost.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-medium">Labor Cost:</span><span className="font-bold">{currency.symbol} {costs.laborCost.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-medium">Post-Processing Cost:</span><span className="font-bold">{currency.symbol} {costs.postProcessingCost.toFixed(2)}</span></div>
                        <div className="border-t border-gray-600 my-2"></div>
                        <div className="flex justify-between items-center text-lg font-extrabold text-blue-300"><span>Total Cost (before markup):</span><span>{currency.symbol} {costs.totalCost.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center"><span className="font-medium">Markup Price:</span><span className="font-bold">{currency.symbol} {costs.markupPrice.toFixed(2)}</span></div>
                    </div>
                    <div className="border-t border-gray-600 my-4"></div>
                    <div className="flex justify-between items-center text-2xl font-extrabold text-green-400 mt-4"><span>Final Price:</span><span>{currency.symbol} {costs.finalPrice.toFixed(2)}</span></div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-6">
                        <button onClick={onGeneratePdf} className="w-full py-3 px-6 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors duration-300 shadow-lg">Generate PDF</button>
                        <button onClick={onSave} className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors duration-300 shadow-lg">Save to History</button>
                        <button onClick={onViewHistory} className="w-full py-3 px-6 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-colors duration-300 shadow-lg">View History</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalculatorView;
