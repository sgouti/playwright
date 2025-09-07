import fs from 'fs';
import Papa from 'papaparse';


export async function readCSV(filePath: string): Promise<any[]> {
  const csvFile = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(csvFile, { header: true }); // objects keyed by first row
  return parsed.data; // any[] – one object per row
}