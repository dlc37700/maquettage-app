import html2canvas from 'html2canvas';

export async function exportScreenAsPng(canvasElement, screenName = 'ecran') {
  if (!canvasElement) return;
  try {
    const canvas = await html2canvas(canvasElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${screenName.replace(/\s+/g, '_') || 'ecran'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Erreur lors de l\'export PNG:', err);
    alert('Erreur lors de l\'export PNG. Veuillez réessayer.');
  }
}
