
import { HistoryEntry } from '../types';
import { DEFAULT_VALUES, createDefaultFilamentProfile } from '../constants';

const HISTORY_KEY = 'printHistory';

const normalizeHistoryEntry = (entry: HistoryEntry): HistoryEntry => {
    const data = {
        ...DEFAULT_VALUES,
        ...entry.data,
        filamentProfiles: Array.isArray(entry.data?.filamentProfiles) && entry.data.filamentProfiles.length > 0
            ? entry.data.filamentProfiles.map((profile, index) => ({
                ...createDefaultFilamentProfile(`profile-${index + 1}`, `Color ${index + 1}`),
                ...profile,
                importedTotalWeightG: typeof profile?.importedTotalWeightG === 'number' ? profile.importedTotalWeightG : 0,
                modelWeightG: typeof profile?.modelWeightG === 'number' ? profile.modelWeightG : (profile as any)?.weightG ?? 0,
                purgeWasteG: typeof profile?.purgeWasteG === 'number' ? profile.purgeWasteG : 0,
                towerWasteG: typeof profile?.towerWasteG === 'number' ? profile.towerWasteG : 0,
            }))
            : DEFAULT_VALUES.filamentProfiles,
    };

    return {
        ...entry,
        data,
    };
};

export const getHistory = (): HistoryEntry[] => {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        const parsed = historyJson ? JSON.parse(historyJson) : [];
        return Array.isArray(parsed) ? parsed.map(normalizeHistoryEntry) : [];
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
