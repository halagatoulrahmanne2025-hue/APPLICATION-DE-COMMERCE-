export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const rawUrl = req.body?.webAppUrl;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({
      success: false,
      errorType: 'INVALID_URL',
      message: 'URL Google Apps Script manquante ou vide.'
    });
  }

  let url = rawUrl.trim().replace(/^["']|["']$/g, '');
  if (!url.startsWith('https://script.google.com/')) {
    return res.status(400).json({
      success: false,
      errorType: 'INVALID_URL',
      message: 'L\'URL doit commencer par https://script.google.com/macros/s/...'
    });
  }

  if (url.includes('/edit')) {
    return res.status(400).json({
      success: false,
      errorType: 'INVALID_URL',
      message: 'Vous avez collé l\'URL d\'édition (/edit). Utilisez l\'URL de l\'application Web (/exec).'
    });
  }

  if (url.endsWith('/dev')) {
    url = url.replace(/\/dev$/, '/exec');
  }

  if (!url.endsWith('/exec') && !url.includes('/exec?')) {
    url = url.endsWith('/') ? url + 'exec' : url + '/exec';
  }

  try {
    const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=test&t=${Date.now()}`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Vercel-Proxy) Commerce-Collecte-App/2.0'
      },
      redirect: 'follow'
    });

    const redirectedUrl = response.url;
    const responseText = await response.text();

    if (
      redirectedUrl.includes('accounts.google.com') ||
      responseText.includes('ServiceLogin') ||
      responseText.includes('Sign in - Google Accounts')
    ) {
      return res.status(403).json({
        success: false,
        errorType: 'AUTH_REQUIRED',
        message:
          'Autorisation Google requise : Votre script Google Apps Script n\'a pas été déployé avec l\'accès « Tout le monde ». Google bloque les requêtes non connectées.\n\nSolution : Dans Google Apps Script, cliquez sur Déployer > Gérer les déploiements > Crayon (Modifier) > « Qui a accès » : sélectionnez « Tout le monde » (Anyone), puis enregistrez.'
      });
    }

    let data: any = null;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        success: false,
        errorType: 'NOT_JSON',
        message: `Le script Google a répondu avec du texte ou du HTML au lieu du JSON attendu (Statut HTTP ${response.status}). Assurez-vous d'avoir déployé la dernière version du script.`
      });
    }

    if (data.status === 'error') {
      return res.status(400).json({
        success: false,
        errorType: 'SCRIPT_ERROR',
        message: data.message || 'Erreur renvoyée par le script Google Apps Script.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Connexion établie avec succès avec votre fichier Google Sheets !',
      data: {
        commercantsCount: Array.isArray(data.commercants) ? data.commercants.length : 0,
        stockCount: Array.isArray(data.produitsEnStock) ? data.produitsEnStock.length : 0,
        commercants: data.commercants || [],
        produitsEnStock: data.produitsEnStock || [],
        tousLesProduits: data.tousLesProduits || [],
        spreadsheetTitle: data.spreadsheetTitle || '',
        sheets: data.sheets || {}
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      errorType: 'NETWORK_ERROR',
      message: `Impossible de contacter Google Apps Script : ${err.message || 'Erreur de connexion'}`
    });
  }
}
