
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

    y += 20;
    doc.setFont(undefined, 'bold');
    doc.text("Cost Breakdown", 20, y);
    doc.setFont(undefined, 'normal');
    y += 10;
    doc.text(`Material Cost: ${currency.symbol} ${costs.materialCost.toFixed(2)}`, 20, y);
    y += 10;
    doc.text(`Electricity Cost: ${currency.symbol} ${costs.electricityCost.toFixed(2)}`, 20, y);
    y += 10;
    doc.text(`Labor Cost: ${currency.symbol} ${costs.laborCost.toFixed(2)}`, 20, y);
    y += 10;
    doc.text(`Post-Processing Cost: ${currency.symbol} ${costs.postProcessingCost.toFixed(2)}`, 20, y);
    
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
    
    y += 20;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(`Final Price: ${currency.symbol} ${costs.finalPrice.toFixed(2)}`, 20, y);
    
    doc.save(`3D_Print_Receipt_${data.printName.replace(/\s/g, '_')}.pdf`);
};
