import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanAndValidateUrl(rawUrl: string): { valid: boolean; url: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, url: '', error: 'URL Google Apps Script manquante ou vide.' };
  }

  let url = rawUrl.trim().replace(/^["']|["']$/g, '');

  if (!url.startsWith('https://script.google.com/')) {
    return {
      valid: false,
      url,
      error: 'L\'URL doit commencer par https://script.google.com/macros/s/...'
    };
  }

  if (url.includes('/edit')) {
    return {
      valid: false,
      url,
      error: 'Vous avez collé l\'URL d\'édition du script (/edit) au lieu de l\'URL de l\'application Web (/exec). Allez dans Déployer > Gérer les déploiements et copiez l\'URL de l\'application Web.'
    };
  }

  if (url.endsWith('/dev')) {
    url = url.replace(/\/dev$/, '/exec');
  }

  if (!url.endsWith('/exec') && !url.includes('/exec?')) {
    if (url.endsWith('/')) {
      url = url + 'exec';
    } else {
      url = url + '/exec';
    }
  }

  return { valid: true, url };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.text({ type: ['text/plain', 'application/json'] }));

  // 1. Diagnostic & Test de connexion
  app.post('/api/sheets/test', async (req: Request, res: Response) => {
    const rawUrl = req.body?.webAppUrl;
    const validation = cleanAndValidateUrl(rawUrl);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errorType: 'INVALID_URL',
        message: validation.error
      });
    }

    const targetUrl = validation.url;

    try {
      const testUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=test&t=${Date.now()}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Commerce-Collecte-App/2.0'
        },
        redirect: 'follow'
      });

      const redirectedUrl = response.url;
      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();

      // Détection de redirection vers la page de connexion Google (Moi uniquement au lieu de Tout le monde)
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

      // Tentative de parsing JSON
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        // Ce n'est pas du JSON valide
        return res.status(502).json({
          success: false,
          errorType: 'NOT_JSON',
          message: `Le script Google a répondu avec du texte ou du HTML au lieu du JSON attendu (Statut HTTP ${response.status}). Assurez-vous d'avoir remplacé le code par le script fourni et d'avoir déployé une nouvelle version.`,
          rawSnippet: responseText.slice(0, 300)
        });
      }

      if (data.status === 'error') {
        return res.status(400).json({
          success: false,
          errorType: 'SCRIPT_ERROR',
          message: data.message || 'Erreur renvoyée par le script Google Apps Script.'
        });
      }

      return res.json({
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
      console.error('Server error during sheets test:', err);
      return res.status(500).json({
        success: false,
        errorType: 'NETWORK_ERROR',
        message: `Impossible de contacter Google Apps Script : ${err.message || 'Vérifiez votre connexion internet.'}`
      });
    }
  });

  // 2. Récupération des données distantes (commerçants & stock)
  app.post('/api/sheets/data', async (req: Request, res: Response) => {
    const rawUrl = req.body?.webAppUrl;
    const validation = cleanAndValidateUrl(rawUrl);

    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    try {
      const targetUrl = `${validation.url}${validation.url.includes('?') ? '&' : '?'}action=getData&t=${Date.now()}`;
      const response = await fetch(targetUrl, {
        method: 'GET',
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
        return res.json({
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
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // 3. Soumission / Enregistrement d'une ligne
  app.post('/api/sheets/submit', async (req: Request, res: Response) => {
    const { webAppUrl, formType, payload } = req.body || {};
    const validation = cleanAndValidateUrl(webAppUrl);

    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
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

      const response = await fetch(validation.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
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
            message: 'Accès refusé par Google. Votre déploiement doit être configuré avec « Qui a accès : Tout le monde ».'
          });
        }
        return res.status(502).json({
          success: false,
          message: 'Réponse inattendue de Google Apps Script lors de l\'enregistrement.'
        });
      }

      if (data.status === 'success') {
        return res.json({
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
  });

  // Vite middleware in dev or static files in production
  const distDir = path.resolve(__dirname, 'dist');
  const indexHtmlPath = path.resolve(distDir, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);

  if (process.env.NODE_ENV === 'production' && hasDist) {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
