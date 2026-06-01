
import fs from 'fs';

function jsonToCsv(jsonArray) {
  if (!jsonArray || jsonArray.length === 0) return '';
  const headers = Object.keys(jsonArray[0]);
  const csvRows = [headers.join(',')];

  for (const obj of jsonArray) {
    const values = headers.map(header => {
      const val = obj[header];
      if (val === null || val === undefined) return '';
      let str = String(val);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

const table = process.argv[2];
const inputFile = process.argv[3];
const outputFile = `/mnt/documents/${table}.csv`;

try {
  const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const csv = jsonToCsv(data);
  fs.writeFileSync(outputFile, csv);
  console.log(`Successfully wrote ${outputFile}`);
} catch (err) {
  console.error(`Error processing ${table}:`, err);
}
