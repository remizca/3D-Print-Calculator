
import { HistoryEntry } from '../types';

const HISTORY_KEY = 'printHistory';

export const getHistory = (): HistoryEntry[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        return [];
    }
};

export const saveHistory = (newEntry: HistoryEntry): HistoryEntry[] => {
    const history = getHistory();
    const updatedHistory = [...history, newEntry];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
};

export const deleteHistoryItem = (id: string): HistoryEntry[] => {
    const history = getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
};
