export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { webAppUrl, formType, payload } = req.body || {};
  if (!webAppUrl || typeof webAppUrl !== 'string') {
    return res.status(400).json({ success: false, message: 'URL Google Apps Script manquante.' });
  }

  let url = webAppUrl.trim().replace(/^["']|["']$/g, '');
  if (!url.startsWith('https://script.google.com/')) {
    return res.status(400).json({ success: false, message: 'URL Google Apps Script non valide.' });
  }

  if (url.includes('/edit')) {
    return res.status(400).json({ success: false, message: 'URL d\'édition (/edit) fournie. Utilisez l\'URL /exec.' });
  }

  if (url.endsWith('/dev')) {
    url = url.replace(/\/dev$/, '/exec');
  }

  if (!url.endsWith('/exec') && !url.includes('/exec?')) {
    url = url.endsWith('/') ? url + 'exec' : url + '/exec';
  }

  if (!formType || !payload) {
    return res.status(400).json({ success: false, message: 'Type de formulaire ou données manquantes.' });
  }

  let normalizedFormType = String(formType || '').trim().toLowerCase();
  if (normalizedFormType === 'commercant' || normalizedFormType === 'liste_commercants' || normalizedFormType === 'listecommercants') {
    normalizedFormType = 'commercants';
  }

  try {
    const postBody = JSON.stringify({
      formType: normalizedFormType,
      timestamp: new Date().toISOString(),
      ...payload
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'User-Agent': 'Mozilla/5.0 (Vercel-Proxy) Commerce-Collecte-App/2.0'
      },
      body: postBody,
      redirect: 'follow'
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé par Google. Votre script Google Apps Script doit être déployé avec « Qui a accès : Tout le monde ».'
        });
      }
      return res.status(502).json({
        success: false,
        message: 'Réponse inattendue de Google Apps Script lors de l\'enregistrement.'
      });
    }

    if (data.status === 'success') {
      return res.status(200).json({
        success: true,
        message: data.message || 'Enregistrement confirmé dans Google Sheets.',
        data: data.data || {}
      });
    } else {
      let errorMsg = data.message || 'Le script Google a retourné une erreur lors de l\'écriture.';
      if (errorMsg.includes('Type de formulaire inconnu') && errorMsg.includes('commercants')) {
        errorMsg = 'Le script Google Apps Script de votre feuille n\'a pas encore été mis à jour avec le code supportant « commercants ». Cliquez sur « Script & Guide », copiez le code à jour, puis dans Google Sheets cliquez sur Déployer > Gérer les déploiements > Crayon ✏️ > Version: Nouvelle version > Déployer.';
      }
      return res.status(400).json({
        success: false,
        message: errorMsg
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: `Erreur de transmission : ${err.message}`
    });
  }
}
