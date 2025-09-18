
import { GcodeInfo } from "../types";

// This function attempts a fast, local parse of G-code comments.
// It's designed to be more robust and catch more variations.
// If it fails to find key information, the app will fall back to the AI parser.
export const parseGcode = (gcode: string): GcodeInfo => {
    const lines = gcode.split('\n');

    let result: GcodeInfo = {
        filamentWeightG: null,
        printTimeSeconds: null,
        filamentLengthMm: null,
    };
    
    // --- Enhanced Regular Expressions ---
    // Catches various formats like "filament used[g]: 10.5g", "total filament weight = 10.5", "filament_used_g = 10.5"
    const weightRegexes = [
        /(?:total |used )?filament (?:used|weight|cost)\s*(?:\(g\)|\[g\])?\s*[:=]\s*(\d+\.?\d*)\s*g?/i,
        /filament_used_g\s*=\s*(\d+\.?\d*)/i,
    ];
    
    // Catches "print time = 1d 2h 3m 4s", "Build time: 2h 3m", "TIME:3600", "estimated print time: 01:30:00"
    // The first regex is specifically for Bambu Studio's "total estimated time" for higher accuracy.
    const timeRegexes = [
        /total estimated time:\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i, // Bambu Studio specific
        /(?:build|print|estimated printing) time(?:.+)[:=]\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i, // d h m s format with junk in the middle
        /(?:build|print|estimated printing) time\s*[:=]?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i, // Simpler d h m s format
        /estimated print time\s*:\s*(\d{2}):(\d{2}):(\d{2})/i, // HH:MM:SS format
        /^;TIME:(\d+)/i // Cura format (seconds)
    ];

    // Catches "filament used = 1234.5mm" or "Filament used: 12.345m", "filament_used_m = 12.345"
    const lengthRegexes = [
        /filament used\s*[:=]\s*(\d+\.?\d*)\s*(m|mm)/i,
        /filament_used_m\s*=\s*(\d+\.?\d*)/i,
    ];

    for (const line of lines) {
        if (!line.startsWith(';')) continue; // Only parse comments
        
        // --- Search for values, stopping when found for that property ---
        if (result.filamentWeightG === null) {
            for (const regex of weightRegexes) {
                const match = line.match(regex);
                if (match && match[1]) {
                    result.filamentWeightG = parseFloat(match[1]);
                    console.log(`[Gcode Parser] Found weight: ${result.filamentWeightG}g with regex "${regex.source}" on line: "${line.trim()}"`);
                    break;
                }
            }
        }
        
        if (result.printTimeSeconds === null) {
            for (const regex of timeRegexes) {
                const match = line.match(regex);
                if (!match) continue;

                if (regex.source.includes(':')) { // HH:MM:SS format
                    const h = parseInt(match[1] || '0', 10);
                    const m = parseInt(match[2] || '0', 10);
                    const s = parseInt(match[3] || '0', 10);
                    result.printTimeSeconds = (h * 3600) + (m * 60) + s;
                    console.log(`[Gcode Parser] Found time (HH:MM:SS): ${result.printTimeSeconds}s on line: "${line.trim()}"`);
                    break;
                } else if (regex.source.startsWith('^;TIME')) { // Cura format
                     result.printTimeSeconds = parseInt(match[1], 10);
                     console.log(`[Gcode Parser] Found Cura time: ${result.printTimeSeconds}s on line: "${line.trim()}"`);
                     break;
                } else { // DHMS format
                    let d = 0, h = 0, m = 0, s = 0;
                     if (regex.source.includes('total estimated time')) { // Bambu Studio format
                         h = parseInt(match[1] || '0', 10);
                         m = parseInt(match[2] || '0', 10);
                         s = parseInt(match[3] || '0', 10);
                     } else { // Generic DHMS
                         d = parseInt(match[1] || '0', 10);
                         h = parseInt(match[2] || '0', 10);
                         m = parseInt(match[3] || '0', 10);
                         s = parseInt(match[4] || '0', 10);
                     }

                    if (d > 0 || h > 0 || m > 0 || s > 0) {
                        result.printTimeSeconds = (d * 86400) + (h * 3600) + (m * 60) + s;
                        console.log(`[Gcode Parser] Found time (dhms): ${result.printTimeSeconds}s on line: "${line.trim()}"`);
                        break;
                    }
                }
            }
        }

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
