import { Parser } from 'json2csv';
import { promises as fs } from 'fs';

export async function appendJsonToCsv(
    jsonData: Record<string, any>[] | string,
    outputPath: string,
    headers?: string[] // Optional headers parameter
): Promise<void> {
    try {
        // If input is a file path, read and parse it
        let data: Record<string, any>[];
        if (typeof jsonData === 'string') {
            const fileContent = await fs.readFile(jsonData, 'utf-8');
            data = JSON.parse(fileContent);
        } else {
            data = jsonData;
        }

        // If headers aren't provided, use object keys from first data item
        const fields = headers || Object.keys(data[0]);

        const parser = new Parser({
            fields, // Specify the fields/headers
            header: false, // Don't include headers when parsing
            delimiter: ',',
            quote: '"'
        });

        // Convert to CSV
        const csvData = parser.parse(data);

        // Check if file exists
        try {
            await fs.access(outputPath);
            // File exists, append data with a newline
            await fs.appendFile(outputPath, '\n' + csvData, 'utf-8');
            console.log('Data appended to existing CSV file');
        } catch {
            // File doesn't exist, create new with headers
            const headerRow = fields.join(',') + '\n';
            await fs.writeFile(outputPath, headerRow + csvData, 'utf-8');
            console.log('New CSV file created with headers');
        }

    } catch (error) {
        console.error('Error processing JSON to CSV:',
            error instanceof Error ? error.message : 'Unknown error');
        throw error;
    }
}