export type CsvRow = Record<string, string>;

export const parseCsvFile = async (file: File): Promise<CsvRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = parseCSVLines(text);

        if (lines.length < 1) {
          reject(new Error('CSV file is empty'));
          return;
        }

        const headers = lines[0].map((h) => h.trim());
        const result = lines
          .slice(1)
          .filter((line) => line.length === headers.length) // Ensure line has correct number of fields
          .map((values) => {
            const obj: CsvRow = {};

            headers.forEach((header, index) => {
              // Preserve formatting in multi-line fields like lyrics
              obj[header] = values[index] !== undefined ? values[index] : '';
            });

            return obj;
          });

        resolve(result.filter((item) => Object.values(item).some((val) => val)));
      } catch (error) {
        console.error('CSV parsing error:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsText(file);
  });
};

// Enhanced function to properly parse CSV with complex fields
function parseCSVLines(text: string): string[][] {
  const result: string[][] = [];

  // Handle different line endings
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedText.split('\n');

  // Process line by line, handling multi-line fields properly
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header comments or empty lines
    if ((i === 0 && line.startsWith('//')) || !line.trim()) {
      continue;
    }

    // Process each character in the line
    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      // Handle quotes
      if (char === '"') {
        if (inQuotes && j + 1 < line.length && line[j + 1] === '"') {
          // Double quotes inside quoted field - add a single quote
          currentField += '"';
          j++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      }
      // Handle field separator only if not in quotes
      else if (char === ',' && !inQuotes) {
        currentLine.push(currentField);
        currentField = '';
      }
      // Add character to current field
      else {
        currentField += char;
      }
    }

    // At the end of a line...
    if (!inQuotes) {
      // If not in quotes, the line is complete
      currentLine.push(currentField);
      result.push(currentLine);
      currentLine = [];
      currentField = '';
    } else {
      // If still in quotes, add a newline to the field
      currentField += '\n';
    }
  }

  // Handle any remaining field
  if (currentField || currentLine.length > 0) {
    if (currentField) {
      currentLine.push(currentField);
    }
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
  }

  return result;
}
