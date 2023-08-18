export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  a.download = filename;
  a.href = window.URL.createObjectURL(blob);
  a.click();
}
