import { GcodeInfo } from "../types";

// --- Regex Definitions ---

const weightRegexes = [
    // Catches various formats like "filament used[g]: 10.5g", "total filament weight = 10.5", "filament_used_g = 10.5"
    /(?:total |used )?filament (?:used|weight|cost)\s*(?:\(g\)|\[g\])?\s*[:=]\s*(\d+\.?\d*)\s*g?/i,
    /filament_used_g\s*=\s*(\d+\.?\d*)/i,
];

const lengthRegexes = [
    // Catches "filament used = 1234.5mm" or "Filament used: 12.345m", "filament_used_m = 12.345"
    /filament used\s*[:=]\s*(\d+\.?\d*)\s*(m|mm)/i,
    /filament_used_m\s*=\s*(\d+\.?\d*)/i,
];

// Time Regexes are defined separately to allow for specific logic for each one.
const timeRegexBambu = /total estimated time:\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i;
const timeRegexDHMS1 = /(?:build|print|estimated printing) time(?:.+)[:=]\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i;
const timeRegexDHMS2 = /(?:build|print|estimated printing) time\s*[:=]?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i;
const timeRegexHHMMSS = /estimated print time\s*:\s*(\d{2}):(\d{2}):(\d{2})/i;
const timeRegexCura = /^;TIME:(\d+)/i;

// The order determines priority. Bambu's specific regex is first for accuracy.
const allTimeRegexes = [timeRegexBambu, timeRegexDHMS1, timeRegexDHMS2, timeRegexHHMMSS, timeRegexCura];


export const parseGcode = (gcode: string): GcodeInfo => {
    const lines = gcode.split('\n');

    let result: GcodeInfo = {
        filamentWeightG: null,
        printTimeSeconds: null,
        filamentLengthMm: null,
    };
    
    for (const line of lines) {
        if (!line.startsWith(';')) continue; // Only parse comments
        
        // --- Search for WEIGHT if not found yet ---
        if (result.filamentWeightG === null) {
            for (const regex of weightRegexes) {
                const match = line.match(regex);
                if (match && match[1]) {
                    result.filamentWeightG = parseFloat(match[1]);
                    console.log(`[Gcode Parser] Found weight: ${result.filamentWeightG}g on line: "${line.trim()}"`);
                    break;
                }
            }
        }
        
        // --- Search for TIME if not found yet ---
        if (result.printTimeSeconds === null) {
            for (const regex of allTimeRegexes) {
                const match = line.match(regex);
                if (!match) continue;

                let seconds = 0;
                let found = false;

                // Apply specific parsing logic based on which regex matched
                if (regex === timeRegexBambu) {
                    const h = parseInt(match[1] || '0', 10);
                    const m = parseInt(match[2] || '0', 10);
                    const s = parseInt(match[3] || '0', 10);
                    seconds = (h * 3600) + (m * 60) + s;
                    found = seconds > 0;
                } else if (regex === timeRegexDHMS1 || regex === timeRegexDHMS2) {
                    const d = parseInt(match[1] || '0', 10);
                    const h = parseInt(match[2] || '0', 10);
                    const m = parseInt(match[3] || '0', 10);
                    const s = parseInt(match[4] || '0', 10);
                    seconds = (d * 86400) + (h * 3600) + (m * 60) + s;
                    found = seconds > 0;
                } else if (regex === timeRegexHHMMSS) {
                    const h = parseInt(match[1] || '0', 10);
                    const m = parseInt(match[2] || '0', 10);
                    const s = parseInt(match[3] || '0', 10);
                    seconds = (h * 3600) + (m * 60) + s;
                    found = seconds > 0;
                } else if (regex === timeRegexCura) {
                    seconds = parseInt(match[1], 10);
                    found = seconds > 0;
                }

                if (found) {
                    result.printTimeSeconds = seconds;
                    console.log(`[Gcode Parser] Found time: ${result.printTimeSeconds}s on line: "${line.trim()}"`);
                    break; // Exit the inner regex loop once a match is found
                }
            }
        }

        // --- Search for LENGTH if not found yet ---
        if (result.filamentLengthMm === null) {
            for (const regex of lengthRegexes) {
                const match = line.match(regex);
                if (match && match[1]) {
                    const length = parseFloat(match[1]);
                    // Unit is 'm' for `filament_used_m` regex, may be 'm' or 'mm' for the other.
                    const unit = match[2] ? match[2].toLowerCase() : 'm'; 
                    result.filamentLengthMm = unit === 'm' ? length * 1000 : length;
                    console.log(`[Gcode Parser] Found length: ${result.filamentLengthMm}mm on line: "${line.trim()}"`);
                    break;
                }
            }
        }
    }

    if(result.filamentWeightG === null) console.warn("[Gcode Parser] Local parser could not find filament weight comment.");
    if(result.printTimeSeconds === null) console.warn("[Gcode Parser] Local parser could not find print time comment.");

    return result;
};