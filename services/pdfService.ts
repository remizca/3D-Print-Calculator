
import { HistoryEntry } from '../types';

declare const window: any;

export const generatePdf = (entry: HistoryEntry) => {
    const { data, costs, currency } = entry;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("3D Print Receipt", 105, 20, null, null, "center");

    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    doc.setFontSize(14);
    let y = 35;
    
    doc.setFont(undefined, 'bold');
    doc.text("Print Details", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Print Name: ${data.printName}`, 20, y);
    y += 10;
    doc.text(`Customer Name: ${data.customerName || 'N/A'}`, 20, y);
    y += 10;
    doc.text(`Date: ${data.purchaseDate || 'N/A'}`, 20, y);
    y += 10;
    doc.text(`Quantity: ${data.quantity}`, 20, y);
    y += 10;
    doc.text(`Material: ${data.materialType} (${data.filamentDiameter}mm)`, 20, y);

    if (data.includeMultiColor) {
        y += 10;
        doc.text(`Multi-Color Mode: Enabled`, 20, y);
        y += 10;
        doc.text(`Filament Changes: ${data.colorSwitchCount}`, 20, y);
        y += 10;
        doc.text(`Purged Filament: ${costs.totalPurgeWasteG.toFixed(2)} g`, 20, y);
        y += 10;
        doc.text(`Tower Filament: ${costs.totalTowerWasteG.toFixed(2)} g`, 20, y);
        y += 10;
        doc.text(`Per Change Overhead: ${Math.round(costs.calculatedSwitchTimePerChangeSeconds)}s`, 20, y);
        y += 10;
        doc.text(`Prep/Timelapse Time: ${costs.prepTimeSeconds}s`, 20, y);
    }

    y += 15;
    doc.setFont(undefined, 'bold');
    doc.text("Cost Breakdown", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Material Cost: ${currency.symbol} ${costs.materialCost.toFixed(2)}`, 20, y);
    if (data.includeMultiColor) {
        y += 10;
        doc.text(`Model Filament Cost: ${currency.symbol} ${costs.modelMaterialCost.toFixed(2)}`, 20, y);
        y += 10;
        doc.text(`Purged Filament Cost: ${currency.symbol} ${costs.purgeMaterialCost.toFixed(2)}`, 20, y);
        y += 10;
        doc.text(`Tower Filament Cost: ${currency.symbol} ${costs.towerMaterialCost.toFixed(2)}`, 20, y);
    }
    if (data.failureRate > 0) {
        y += 10;
        doc.text(`Failure Buffer (${data.failureRate}%): ${currency.symbol} ${costs.failureCost.toFixed(2)}`, 20, y);
    }
    y += 10;
    doc.text(`Electricity (${data.printerWattage}W): ${currency.symbol} ${costs.electricityCost.toFixed(2)}`, 20, y);
    y += 10;
    doc.text(`Labor: ${currency.symbol} ${costs.laborCost.toFixed(2)}`, 20, y);
    if (costs.prepLaborCost > 0) {
        y += 10;
        doc.text(`Prep Time Labor: ${currency.symbol} ${costs.prepLaborCost.toFixed(2)}`, 20, y);
    }
    y += 10;
    doc.text(`Post-Processing: ${currency.symbol} ${costs.postProcessingCost.toFixed(2)}`, 20, y);
    if (data.includeDepreciation) {
        y += 10;
        doc.text(`Depreciation: ${currency.symbol} ${costs.depreciationCost.toFixed(2)}`, 20, y);
    }
    
    y += 15;
    doc.setLineWidth(0.3);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Cost (before markup): ${currency.symbol} ${costs.totalCost.toFixed(2)}`, 20, y);
    y += 10;
    doc.setFont(undefined, 'normal');
    doc.text(`Markup Price: ${currency.symbol} ${costs.markupPrice.toFixed(2)}`, 20, y);
    if (data.taxRate > 0) {
        y += 10;
        doc.text(`Tax (${data.taxRate}%): ${currency.symbol} ${costs.taxAmount.toFixed(2)}`, 20, y);
    }
    if (data.quantity > 1) {
        y += 10;
        doc.text(`Per Unit: ${currency.symbol} ${costs.perUnitPrice.toFixed(2)}`, 20, y);
    }
    
    y += 20;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(`Final Price: ${currency.symbol} ${costs.finalPrice.toFixed(2)}`, 20, y);
    if (data.quantity > 1) {
        y += 10;
        doc.setFontSize(14);
        doc.setFont(undefined, 'normal');
        doc.text(`(${data.quantity} units at ${currency.symbol} ${costs.perUnitPrice.toFixed(2)} each)`, 20, y);
    }
    
    doc.save(`3D_Print_Receipt_${data.printName.replace(/\s/g, '_')}.pdf`);
};
