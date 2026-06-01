const fs = require('fs');

function jsonToCsv(jsonArray) {
  if (!jsonArray || jsonArray.length === 0) return '';
  const headers = Object.keys(jsonArray[0]);
  const csvRows = [headers.join(',')];

  for (const obj of jsonArray) {
    const values = headers.map(header => {
      let val = obj[header];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') val = JSON.stringify(val);
      let str = String(val);
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
const jsonData = process.argv[3];

try {
  const data = JSON.parse(jsonData);
  const csv = jsonToCsv(data);
  fs.writeFileSync(`/mnt/documents/${table}.csv`, csv);
  console.log(`Exported ${table}.csv`);
} catch (err) {
  console.error(`Error: ${err.message}`);
}
