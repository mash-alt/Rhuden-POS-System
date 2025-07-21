/**
 * Utility function to export data as CSV
 */

/**
 * Convert an array of objects to CSV format
 * @param data Array of objects to convert
 * @param excludeFields Fields to exclude from export
 * @returns CSV string
 */
export const convertToCSV = <T extends Record<string, any>>(data: T[], excludeFields: string[] = []): string => {
  if (data.length === 0) {
    return '';
  }

  // Get all keys from the first object, excluding specified fields
  const keys = Object.keys(data[0]).filter(key => !excludeFields.includes(key));
  
  // Create header row
  const header = keys.map(key => `"${key}"`).join(',');
  
  // Create data rows
  const rows = data.map(item => {
    return keys.map(key => {
      const value = item[key];
      
      // Handle different types of values
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'object') {
        if (value === null) {
          return '""';
        } else if (value.toDate && typeof value.toDate === 'function') {
          // Handle Firestore Timestamp
          return `"${value.toDate().toLocaleString()}"`;
        } else if (value instanceof Date) {
          // Handle Date objects
          return `"${value.toLocaleString()}"`;
        } else if ('id' in value) {
          // If it's an object with an ID (like a reference), just use the ID
          return `"${value.id}"`;
        } else {
          // For other objects, use JSON stringification but limit the depth
          try {
            return `"${JSON.stringify(value, null, 0).replace(/"/g, '""')}"`;
          } catch (e) {
            return '"[Complex Object]"';
          }
        }
      } else {
        // Handle string values (escape quotes)
        return `"${String(value).replace(/"/g, '""')}"`;
      }
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
};

/**
 * Download data as a CSV file
 * @param data Array of objects to download
 * @param filename Filename for the downloaded file
 * @param excludeFields Optional array of field names to exclude from export
 */
export const downloadCSV = <T extends Record<string, any>>(
  data: T[], 
  filename: string,
  excludeFields: string[] = []
): void => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert data to CSV
  const csv = convertToCSV(data, excludeFields);
  
  // Create download link
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create temporary link element
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Add to document, trigger click, then remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
