export function exportProjectAsJson(state) {
  const data = {
    projectName: state.projectName,
    screens: state.screens,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.projectName.replace(/\s+/g, '_') || 'projet'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importProjectFromJson(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        // Accept both { screens: [...] } and a raw array of screens
        const data = Array.isArray(parsed)
          ? { screens: parsed, projectName: 'Projet importé' }
          : parsed;
        if (!data.screens || !Array.isArray(data.screens)) {
          reject(new Error('Fichier JSON invalide : propriété "screens" manquante.'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('Fichier JSON invalide ou corrompu.'));
      }
    };
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsText(file);
  });
}
