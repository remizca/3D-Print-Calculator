
import React from 'react';
import { HistoryEntry } from '../types';

interface HistoryViewProps {
    history: HistoryEntry[];
    onBack: () => void;
    onDelete: (id: string) => void;
    onView: (item: HistoryEntry) => void;
    onReprint: (item: HistoryEntry) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ history, onBack, onDelete, onView, onReprint }) => {
    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">History of Prints</h2>
            <div className="space-y-4">
                {history.length === 0 ? (
                    <p className="text-center text-gray-500">No saved history yet.</p>
                ) : (
                    history.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex-1 w-full text-center sm:text-left">
                                <div className="font-bold text-lg text-gray-800">{item.data.printName}</div>
                                <div className="text-sm text-gray-600">Customer: {item.data.customerName || 'N/A'}</div>
                                <div className="text-sm text-gray-600">Date: {item.data.purchaseDate || 'N/A'}</div>
                            </div>
                            <div className="text-lg font-bold text-green-500 w-full text-center sm:w-auto sm:text-right">
                                {item.currency.symbol} {item.costs.finalPrice.toFixed(2)}
                            </div>
                            <div className="flex space-x-2 mt-2 sm:mt-0">
                                <button onClick={() => onReprint(item)} className="bg-green-500 text-white rounded-full p-2 hover:bg-green-600 transition-colors" title="Reprint">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm10 8a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button onClick={() => onView(item)} className="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors" title="View Details">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <button onClick={() => onDelete(item.id)} className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors" title="Delete Item">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div className="flex justify-center mt-8">
                <button onClick={onBack} className="py-3 px-8 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors duration-300 shadow-lg">
                    Back to Calculator
                </button>
            </div>
        </div>
    );
};

export default HistoryView;