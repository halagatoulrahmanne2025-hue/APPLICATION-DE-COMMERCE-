export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const rawUrl = req.body?.webAppUrl;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'URL Google Apps Script manquante.' });
  }

  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url.startsWith('https://script.google.com/')) {
    return res.status(400).json({ success: false, message: 'URL invalide.' });
  }

  if (url.includes('/edit')) {
    return res.status(400).json({ success: false, message: 'URL d\'édition /edit fournie au lieu de /exec.' });
  }

  if (url.endsWith('/dev')) {
    url = url.replace(/\/dev$/, '/exec');
  }

  if (!url.endsWith('/exec') && !url.includes('/exec?')) {
    url = url.endsWith('/') ? url + 'exec' : url + '/exec';
  }

  try {
    const targetUrl = `${url}${url.includes('?') ? '&' : '?'}action=getData&t=${Date.now()}`;
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Vercel-Proxy) Commerce-Collecte-App/2.0'
      },
      redirect: 'follow'
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        success: false,
        message: 'Réponse invalide de Google Apps Script (HTML reçu au lieu de JSON).'
      });
    }

    if (data.status === 'success') {
      return res.status(200).json({
        success: true,
        commercants: data.commercants || [],
        produitsEnStock: data.produitsEnStock || [],
        tousLesProduits: data.tousLesProduits || [],
        spreadsheetTitle: data.spreadsheetTitle || '',
        sheets: data.sheets || {},
        version: data.version || '3.0'
      });
    } else {
      return res.status(400).json({ success: false, message: data.message || 'Erreur Google Apps Script' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Erreur réseau' });
  }
}
