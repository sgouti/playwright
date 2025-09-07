import fs from 'fs';
import Papa from 'papaparse';



export class CSVUtils {

    async readCSV(filePath: string): Promise<any[]> {
        const csvFile = fs.readFileSync(filePath, 'utf8');
        const parsed = Papa.parse(csvFile, { header: true });
        return parsed.data as any[];
    }

    async writeCSV(filePath: string, data: any[]) {
        const csv = Papa.unparse(data);
        fs.writeFileSync(filePath, csv);
    }
    
}

