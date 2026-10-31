import {
  Commercant,
  StockProduit,
  VentePayload,
  ProduitPayload,
  DepensePayload,
  FacturePayload,
  CommercantPayload,
  PendingSubmission,
  AppConfig,
  DiagnosticResult
} from '../types';
import { DEFAULT_COMMERCANTS, DEFAULT_STOCK_PRODUITS } from './defaultData';

const STORAGE_KEYS = {
  WEB_APP_URL: 'comm_collecte_webapp_url',
  COMMERCANTS: 'comm_collecte_commercants',
  STOCK: 'comm_collecte_stock',
  PENDING_QUEUE: 'comm_collecte_pending_queue',
  HISTORY: 'comm_collecte_history',
  CONFIG: 'comm_collecte_config',
  LAST_SYNC: 'comm_collecte_last_sync'
};

export const DEFAULT_CONFIG: AppConfig = {
  webAppUrl: '',
  sheetNameVentes: 'les vents',
  sheetNameProduits: 'les produit',
  sheetNameDepenses: 'les depence',
  sheetNameFactures: 'les factur',
  sheetNameCommercants: 'LISTE_COMMERCANTS',
  sheetNameStock: 'stock'
};

/**
 * Nettoie et valide l'URL de déploiement Google Apps Script
 */
export function sanitizeWebAppUrl(rawUrl: string): { valid: boolean; url: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, url: '', error: 'URL Google Apps Script manquante.' };
  }

  let clean = rawUrl.trim().replace(/^["']|["']$/g, '');

  if (!clean.startsWith('https://script.google.com/')) {
    return {
      valid: false,
      url: clean,
      error: 'L\'URL doit commencer par "https://script.google.com/macros/s/..."'
    };
  }

  if (clean.includes('/edit')) {
    return {
      valid: false,
      url: clean,
      error: 'Vous avez collé l\'URL d\'édition du code (/edit) au lieu de l\'URL de l\'application Web (/exec). Allez dans Déployer > Gérer les déploiements pour copier l\'URL de déploiement.'
    };
  }

  if (clean.endsWith('/dev')) {
    clean = clean.replace(/\/dev$/, '/exec');
  }

  if (!clean.endsWith('/exec') && !clean.includes('/exec?')) {
    if (clean.endsWith('/')) {
      clean = clean + 'exec';
    } else {
      clean = clean + '/exec';
    }
  }

  return { valid: true, url: clean };
}

export class GoogleSheetsService {
  private static instance: GoogleSheetsService;

  private config: AppConfig;
  private commercants: Commercant[] = [];
  private stockProduits: StockProduit[] = [];
  private pendingQueue: PendingSubmission[] = [];

  private constructor() {
    this.config = this.loadConfig();
    this.commercants = this.loadCommercants();
    this.stockProduits = this.loadStock();
    this.pendingQueue = this.loadPendingQueue();
  }

  public static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  // --- Configuration ---
  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public saveConfig(newConfig: Partial<AppConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
    if (newConfig.webAppUrl !== undefined) {
      const sanitized = sanitizeWebAppUrl(newConfig.webAppUrl);
      const urlToSave = sanitized.valid ? sanitized.url : newConfig.webAppUrl.trim();
      localStorage.setItem(STORAGE_KEYS.WEB_APP_URL, urlToSave);
      this.config.webAppUrl = urlToSave;
    }
  }

  public getWebAppUrl(): string {
    return this.config.webAppUrl || localStorage.getItem(STORAGE_KEYS.WEB_APP_URL) || '';
  }

  public setWebAppUrl(url: string): { valid: boolean; error?: string } {
    const check = sanitizeWebAppUrl(url);
    if (!check.valid) {
      this.saveConfig({ webAppUrl: url.trim() });
      return { valid: false, error: check.error };
    }
    this.saveConfig({ webAppUrl: check.url });
    return { valid: true };
  }

  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const url = localStorage.getItem(STORAGE_KEYS.WEB_APP_URL) || '';
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_CONFIG, ...parsed, webAppUrl: parsed.webAppUrl || url };
      }
      return { ...DEFAULT_CONFIG, webAppUrl: url };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  // --- Commerçants ---
  public getCommercants(): Commercant[] {
    return this.commercants;
  }

  private loadCommercants(): Commercant[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMMERCANTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored commercants', e);
    }
    return DEFAULT_COMMERCANTS;
  }

  // --- Stock & Produits ---
  public getProduitsDisponiblesEnStock(): StockProduit[] {
    return this.stockProduits.filter(p => p.stockRestant > 0);
  }

  public getAllStockProduits(): StockProduit[] {
    return this.stockProduits;
  }

  private loadStock(): StockProduit[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STOCK);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored stock', e);
    }
    return DEFAULT_STOCK_PRODUITS;
  }

  public saveStockLocally(items: StockProduit[]) {
    this.stockProduits = items;
    localStorage.setItem(STORAGE_KEYS.STOCK, JSON.stringify(items));
  }

  public saveCommercantsLocally(items: Commercant[]) {
    this.commercants = items;
    localStorage.setItem(STORAGE_KEYS.COMMERCANTS, JSON.stringify(items));
  }

  // --- Gestion de l'horodatage de synchronisation bidirectionnelle ---
  public getLastSyncTimestamp(): number | null {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return stored ? Number(stored) : null;
  }

  public recordSuccessfulSync(): number {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(now));
    return now;
  }

  public getLastSyncFormatted(): string {
    const ts = this.getLastSyncTimestamp();
    if (!ts) return 'Aucune actualisation effectuée';
    const d = new Date(ts);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ' à ' + d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  public getLastSyncTimeAgo(): string {
    const ts = this.getLastSyncTimestamp();
    if (!ts) return 'Jamais synchronisé';
    const diffSec = Math.floor((Date.now() - ts) / 1000);
    if (diffSec < 10) return 'À l\'instant';
    if (diffSec < 60) return `Il y a ${diffSec} sec`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return this.getLastSyncFormatted();
  }


  // --- Véritable Test de Connexion avec Diagnostic Complet ---
  public async testConnection(customUrl?: string): Promise<DiagnosticResult> {
    const rawUrl = (customUrl !== undefined ? customUrl : this.getWebAppUrl()).trim();
    
    if (!rawUrl) {
      return {
        success: false,
        errorType: 'INVALID_URL',
        message: 'Veuillez saisir votre URL de déploiement Google Apps Script.'
      };
    }

    const validation = sanitizeWebAppUrl(rawUrl);
    if (!validation.valid) {
      return {
        success: false,
        errorType: 'INVALID_URL',
        message: validation.error || 'URL invalide'
      };
    }

    const targetUrl = validation.url;

    // 1. Essai prioritaire via notre proxy /api/sheets/test
    try {
      const proxyRes = await fetch('/api/sheets/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: targetUrl })
      });

      const contentType = proxyRes.headers.get('content-type') || '';
      if (!proxyRes.ok || !contentType.includes('application/json')) {
        throw new Error(`Proxy non disponible (HTTP ${proxyRes.status})`);
      }

      const proxyData = await proxyRes.json();

      if (proxyData.success && proxyData.data) {
        // Mettre à jour les données locales
        if (Array.isArray(proxyData.data.commercants) && proxyData.data.commercants.length > 0) {
          const list: Commercant[] = proxyData.data.commercants.map((c: any) =>
            typeof c === 'string' ? { nom: c } : c
          );
          this.saveCommercantsLocally(list);
        }

        if (Array.isArray(proxyData.data.produitsEnStock)) {
          const stockList: StockProduit[] = proxyData.data.produitsEnStock.map((p: any) => ({
            nom: p.nom || p.Nom_Produit || p[0] || 'Produit',
            stockRestant: Number(p.stockRestant !== undefined ? p.stockRestant : (p.Stock_Restant || p[1] || 0)),
            prixVente: Number(p.prixVente || p.Prix_Vente || 0),
            prixAchat: Number(p.prixAchat || p.Prix_Achat || 0),
            unite: p.unite || ''
          }));
          this.saveStockLocally(stockList);
        }

        this.recordSuccessfulSync();

        return {
          success: true,
          message: proxyData.message || 'Connexion réussie avec Google Sheets !',
          details: {
            spreadsheetTitle: proxyData.data.spreadsheetTitle,
            commercantsCount: proxyData.data.commercantsCount,
            stockCount: proxyData.data.stockCount
          }
        };
      } else {
        return {
          success: false,
          errorType: proxyData.errorType || 'SCRIPT_ERROR',
          message: proxyData.message || 'Erreur lors du test de connexion.'
        };
      }
    } catch (proxyErr: any) {
      console.warn('Proxy test failed or unreachable, trying direct client fetch fallback...', proxyErr);
    }

    // 2. Fallback direct client-side (si proxy local non disponible)
    try {
      const directUrl = `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}action=test&t=${Date.now()}`;
      
      const directRes = await fetch(directUrl, {
        method: 'GET'
      });

      if (!directRes.ok) {
        throw new Error(`HTTP ${directRes.status}: ${directRes.statusText}`);
      }

      const text = await directRes.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        if (text.includes('accounts.google.com') || text.includes('ServiceLogin')) {
          return {
            success: false,
            errorType: 'AUTH_REQUIRED',
            message: 'Autorisation Google requise : Le script Apps Script n\'a pas été déployé avec « Qui a accès : Tout le monde ».'
          };
        }
        return {
          success: false,
          errorType: 'NOT_JSON',
          message: 'Le script Google a répondu avec du texte/HTML au lieu du JSON attendu.'
        };
      }

      if (json.status === 'success') {
        if (Array.isArray(json.commercants) && json.commercants.length > 0) {
          const list: Commercant[] = json.commercants.map((c: any) =>
            typeof c === 'string' ? { nom: c } : c
          );
          this.saveCommercantsLocally(list);
        }

        if (Array.isArray(json.produitsEnStock)) {
          const stockList: StockProduit[] = json.produitsEnStock.map((p: any) => ({
            nom: p.nom || p.Nom_Produit || p[0] || 'Produit',
            stockRestant: Number(p.stockRestant !== undefined ? p.stockRestant : (p.Stock_Restant || p[1] || 0)),
            prixVente: Number(p.prixVente || p.Prix_Vente || 0),
            prixAchat: Number(p.prixAchat || p.Prix_Achat || 0),
            unite: p.unite || ''
          }));
          this.saveStockLocally(stockList);
        }

        this.recordSuccessfulSync();

        return {
          success: true,
          message: 'Connexion directe validée avec succès !',
          details: {
            commercantsCount: Array.isArray(json.commercants) ? json.commercants.length : 0,
            stockCount: Array.isArray(json.produitsEnStock) ? json.produitsEnStock.length : 0
          }
        };
      } else {
        return {
          success: false,
          errorType: 'SCRIPT_ERROR',
          message: json.message || 'Erreur renvoyée par Google Apps Script.'
        };
      }
    } catch (clientErr: any) {
      return {
        success: false,
        errorType: 'CORS_ERROR',
        message: `Erreur de communication : ${clientErr.message || 'Failed to fetch'}.\n\nCause fréquente : Le déploiement Google Apps Script n'est pas autorisé pour « Tout le monde », ou l'URL est erronée.`
      };
    }
  }

  // --- Récupération des données distantes dans les deux sens (Google Sheets -> Application) ---
  public async fetchRemoteData(): Promise<{
    success: boolean;
    message: string;
    commercantsCount: number;
    stockCount: number;
    lastSyncFormatted?: string;
  }> {
    const rawUrl = this.getWebAppUrl();
    if (!rawUrl) {
      return {
        success: false,
        message: 'URL Google Apps Script non configurée.',
        commercantsCount: this.commercants.length,
        stockCount: this.getProduitsDisponiblesEnStock().length
      };
    }

    const validation = sanitizeWebAppUrl(rawUrl);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'URL invalide.',
        commercantsCount: this.commercants.length,
        stockCount: this.getProduitsDisponiblesEnStock().length
      };
    }

    // 1. Appel du proxy backend /api/sheets/data pour récupérer les données fraîches de Google Sheets
    try {
      const proxyRes = await fetch('/api/sheets/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: validation.url })
      });

      const contentType = proxyRes.headers.get('content-type') || '';
      if (!proxyRes.ok || !contentType.includes('application/json')) {
        throw new Error(`Proxy non disponible (HTTP ${proxyRes.status})`);
      }

      const proxyData = await proxyRes.json();

      if (proxyData.success) {
        // A. Actualiser les commerçants modifiés ou ajoutés directement dans Google Sheets
        if (Array.isArray(proxyData.commercants) && proxyData.commercants.length > 0) {
          const freshCommercants: Commercant[] = proxyData.commercants.map((c: any) =>
            typeof c === 'string'
              ? { nom: c, nomPrenom: c }
              : {
                  numero: c.numero,
                  nom: c.nom || c.nomPrenom || '',
                  nomPrenom: c.nomPrenom || c.nom || '',
                  telephone: String(c.telephone || '').trim(),
                  observation: String(c.observation || '').trim()
                }
          );
          this.saveCommercantsLocally(freshCommercants);
        }

        // B. Actualiser les stocks et filtrer STRICTEMENT ceux avec stockRestant > 0
        if (Array.isArray(proxyData.produitsEnStock)) {
          const freshStock: StockProduit[] = proxyData.produitsEnStock.map((p: any) => ({
            nom: p.nom || p.Nom_Produit || p[0] || 'Produit',
            stockRestant: Number(p.stockRestant !== undefined ? p.stockRestant : (p.Stock_Restant || p[1] || 0)),
            prixVente: Number(p.prixVente || p.Prix_Vente || 0),
            prixAchat: Number(p.prixAchat || p.Prix_Achat || 0),
            unite: p.unite || ''
          }));
          this.saveStockLocally(freshStock);
        }

        this.recordSuccessfulSync();

        return {
          success: true,
          message: `Synchronisation réussie : ${this.commercants.length} commerçant(s) et ${this.getProduitsDisponiblesEnStock().length} produit(s) en stock chargés depuis Google Sheets.`,
          commercantsCount: this.commercants.length,
          stockCount: this.getProduitsDisponiblesEnStock().length,
          lastSyncFormatted: this.getLastSyncFormatted()
        };
      }
    } catch (err: any) {
      console.warn('Erreur proxy /api/sheets/data, tentative de fallback testConnection :', err);
    }

    // 2. Fallback via testConnection
    const testResult = await this.testConnection();
    return {
      success: testResult.success,
      message: testResult.message,
      commercantsCount: this.commercants.length,
      stockCount: this.getProduitsDisponiblesEnStock().length,
      lastSyncFormatted: this.getLastSyncFormatted()
    };
  }

  // --- Synchronisation Complète Bidirectionnelle (Push file d'attente puis Pull Google Sheets) ---
  public async syncAll(): Promise<{
    syncedQueueCount: number;
    queueRemaining: number;
    remoteSuccess: boolean;
    remoteMessage: string;
    lastSyncFormatted: string;
  }> {
    let syncedQueueCount = 0;
    let queueRemaining = this.getPendingQueue().length;

    // Étape 1 : Si la file hors-ligne contient des éléments, les envoyer vers Google Sheets
    if (queueRemaining > 0) {
      const queueRes = await this.syncPendingQueue();
      syncedQueueCount = queueRes.synced;
      queueRemaining = queueRes.remaining;
    }

    // Étape 2 : Récupérer les données actualisées depuis Google Sheets vers l'application
    const remoteRes = await this.fetchRemoteData();

    return {
      syncedQueueCount,
      queueRemaining,
      remoteSuccess: remoteRes.success,
      remoteMessage: remoteRes.message,
      lastSyncFormatted: this.getLastSyncFormatted()
    };
  }

  // --- Envoi des Formulaires ---
  public async submitVente(payload: VentePayload): Promise<{ success: boolean; message: string; queued?: boolean }> {
    const res = await this.sendOrQueue('ventes', payload);

    // Décrémenter le stock localement immédiatement pour réactivité de l'interface
    this.decrementLocalStock(payload.nomProduit, payload.quantiteVendue);

    this.saveHistory({
      type: 'Vente',
      id: payload.idVente,
      title: `${payload.quantiteVendue}x ${payload.nomProduit}`,
      sub: `Commerçant : ${payload.nomCommercant}`,
      date: payload.dateVente,
      status: res.queued ? 'En attente' : 'Synchronisé'
    });

    return res;
  }

  public async submitProduit(payload: ProduitPayload): Promise<{ success: boolean; message: string; queued?: boolean }> {
    const res = await this.sendOrQueue('produits', payload);

    this.addOrUpdateLocalProduct(payload.nomProduit, payload.prixVenteUnitaire, payload.prixAchatUnitaire);

    this.saveHistory({
      type: 'Produit',
      id: payload.idProduitAchat,
      title: payload.nomProduit,
      sub: `Achat : ${payload.prixAchatUnitaire} FCFA | Vente : ${payload.prixVenteUnitaire} FCFA`,
      date: payload.dateAchat,
      status: res.queued ? 'En attente' : 'Synchronisé'
    });

    return res;
  }

  public async submitDepense(payload: DepensePayload): Promise<{ success: boolean; message: string; queued?: boolean }> {
    const res = await this.sendOrQueue('depenses', payload);

    this.saveHistory({
      type: 'Dépense',
      id: payload.idDepense,
      title: `${payload.montantDepense.toLocaleString('fr-FR')} FCFA - ${payload.motifDepense}`,
      sub: `Commerçant : ${payload.nomCommercant}`,
      date: payload.dateDepense,
      status: res.queued ? 'En attente' : 'Synchronisé'
    });

    return res;
  }

  public async submitFacture(payload: FacturePayload): Promise<{ success: boolean; message: string; queued?: boolean }> {
    const res = await this.sendOrQueue('factures', payload);

    this.incrementLocalStock(payload.nomProduit, payload.quantiteRecue, payload.prixAchatUnitaire);

    this.saveHistory({
      type: 'Facture / Reçu',
      id: payload.idReception,
      title: `${payload.quantiteRecue}x ${payload.nomProduit} reçus`,
      sub: `Prix achat : ${payload.prixAchatUnitaire} FCFA`,
      date: payload.dateReception,
      status: res.queued ? 'En attente' : 'Synchronisé'
    });

    return res;
  }

  // --- NOUVEAU TABLEAU : Commerçants & Anti-Doublons ---
  public isDuplicateCommercant(nomPrenom: string): boolean {
    const target = nomPrenom.trim().toLowerCase();
    return this.commercants.some(c => (c.nom || c.nomPrenom || '').trim().toLowerCase() === target);
  }

  public getNextCommercantNumero(): number {
    return this.commercants.length + 1;
  }

  public async submitCommercant(payload: CommercantPayload): Promise<{ success: boolean; message: string; queued?: boolean }> {
    const cleanNom = payload.nomPrenom.trim();
    if (this.isDuplicateCommercant(cleanNom)) {
      return {
        success: false,
        message: `Doublon refusé : Le commerçant « ${cleanNom} » est déjà présent dans la liste.`
      };
    }

    const res = await this.sendOrQueue('commercants', payload);

    // Ajouter immédiatement le nouveau commerçant à la liste locale
    const newCommercant: Commercant = {
      numero: payload.numero,
      nom: cleanNom,
      nomPrenom: cleanNom,
      telephone: payload.telephone.trim(),
      observation: (payload.observation || '').trim()
    };
    
    // Sauvegarder localement pour actualiser instantanément les listes déroulantes Ventes & Dépenses
    const updated = [...this.commercants, newCommercant];
    this.saveCommercantsLocally(updated);

    this.saveHistory({
      type: 'Commerçant',
      id: `COMM-${payload.numero}`,
      title: cleanNom,
      sub: `Tél : ${payload.telephone || 'Non renseigné'} • N° ${payload.numero}`,
      date: getTodayDateString(),
      status: res.queued ? 'En attente' : 'Synchronisé'
    });

    return res;
  }

  // --- Gestion de la transmission et mise en file d'attente hors-ligne ---
  private async sendOrQueue(
    formType: 'ventes' | 'produits' | 'depenses' | 'factures' | 'commercants',
    payload: any
  ): Promise<{ success: boolean; message: string; queued?: boolean }> {
    const url = this.getWebAppUrl();

    if (!url) {
      this.queueSubmission(formType, payload, 'Pas d\'URL Google Sheets configurée');
      return {
        success: true,
        queued: true,
        message: 'Enregistrement sécurisé hors ligne (URL non configurée).'
      };
    }

    // 1. Tenter l'envoi via notre proxy backend (aucun problème CORS, confirmation réelle)
    try {
      const proxyRes = await fetch('/api/sheets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webAppUrl: url, formType, payload })
      });

      const contentType = proxyRes.headers.get('content-type') || '';
      if (!proxyRes.ok || !contentType.includes('application/json')) {
        throw new Error(`Proxy non disponible (HTTP ${proxyRes.status})`);
      }

      const proxyData = await proxyRes.json();

      if (proxyData.success) {
        return {
          success: true,
          queued: false,
          message: proxyData.message || 'Données enregistrées avec succès dans Google Sheets !'
        };
      } else {
        // Le serveur distant a retourné une erreur explicite
        console.warn('Proxy submission error:', proxyData.message);
        this.queueSubmission(formType, payload, proxyData.message || 'Erreur d\'écriture');
        return {
          success: true,
          queued: true,
          message: `Enregistré hors ligne : ${proxyData.message || 'Erreur de transmission'}`
        };
      }
    } catch (proxyErr: any) {
      console.warn('Proxy submission network failure, trying direct send fallback:', proxyErr);
    }

    // 2. Fallback envoi direct client-side (text/plain pour éviter OPTIONS)
    try {
      const postBody = JSON.stringify({
        formType,
        timestamp: new Date().toISOString(),
        ...payload
      });

      const directRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: postBody
      });

      const resText = await directRes.text();
      let resJson: any;
      try {
        resJson = JSON.parse(resText);
      } catch {
        resJson = null;
      }

      if (resJson && resJson.status === 'success') {
        return {
          success: true,
          queued: false,
          message: resJson.message || 'Enregistrement confirmé dans Google Sheets !'
        };
      } else {
        const errMsg = resJson?.message || 'Réponse inattendue de Google Apps Script';
        this.queueSubmission(formType, payload, errMsg);
        return {
          success: true,
          queued: true,
          message: `Enregistré hors ligne : ${errMsg}`
        };
      }
    } catch (clientErr: any) {
      const errMsg = clientErr.message || 'Erreur réseau';
      this.queueSubmission(formType, payload, errMsg);
      return {
        success: true,
        queued: true,
        message: 'Enregistrement sécurisé hors ligne (connexion réseau indisponible).'
      };
    }
  }

  // --- Gestion de la file d'attente hors-ligne ---
  // RÈGLE CRITIQUE : Ne jamais écraser les enregistrements existants !
  private queueSubmission(formType: 'ventes' | 'produits' | 'depenses' | 'factures' | 'commercants', payload: any, errorNote?: string) {
    const item: PendingSubmission = {
      id: 'PENDING-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      formType,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      lastError: errorNote
    };

    // Charger l'état actuel directement du localStorage pour ne rien perdre
    const currentQueue = this.loadPendingQueue();
    currentQueue.push(item);
    this.pendingQueue = currentQueue;
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(currentQueue));
  }

  public getPendingQueue(): PendingSubmission[] {
    // Toujours synchroniser avec le localStorage
    this.pendingQueue = this.loadPendingQueue();
    return this.pendingQueue;
  }

  private loadPendingQueue(): PendingSubmission[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored pending queue:', e);
    }
    return [];
  }

  /**
   * Synchronisation de la file d'attente hors-ligne :
   * RÈGLE CRITIQUE : Supprime un enregistrement de la file d'attente UNIQUEMENT
   * après confirmation RÉELLE de son enregistrement dans Google Sheets.
   * Ne vide jamais la file d'attente après un simple envoi.
   */
  public async syncPendingQueue(): Promise<{
    synced: number;
    remaining: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const url = this.getWebAppUrl();
    this.pendingQueue = this.loadPendingQueue();

    if (!url || this.pendingQueue.length === 0) {
      return { synced: 0, remaining: this.pendingQueue.length, errors: [] };
    }

    const remainingItems: PendingSubmission[] = [];
    const errorsList: Array<{ id: string; error: string }> = [];
    let syncedCount = 0;

    for (const item of this.pendingQueue) {
      let isSuccessConfirmed = false;
      let errorOccurred = '';

      // Normalisation uniforme vers 'commercants'
      let formTypeToSend = item.formType;
      if ((formTypeToSend as string) === 'commercant' || (formTypeToSend as string) === 'liste_commercants') {
        formTypeToSend = 'commercants';
      }

      // Tentative 1 : Via notre proxy server (avec vérification réelle de l'enregistrement)
      try {
        const proxyRes = await fetch('/api/sheets/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webAppUrl: url,
            formType: formTypeToSend,
            payload: item.payload
          })
        });

        const contentType = proxyRes.headers.get('content-type') || '';
        if (!proxyRes.ok || !contentType.includes('application/json')) {
          throw new Error(`Proxy non disponible (HTTP ${proxyRes.status})`);
        }

        const proxyData = await proxyRes.json();

        if (proxyData.success === true) {
          isSuccessConfirmed = true;
        } else {
          errorOccurred = proxyData.message || 'Erreur retournée par Google Apps Script';
        }
      } catch (proxyErr: any) {
        // Tentative 2 : Fallback direct
        try {
          const directRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              formType: formTypeToSend,
              timestamp: new Date().toISOString(),
              ...item.payload
            })
          });

          const directText = await directRes.text();
          let directJson: any;
          try {
            directJson = JSON.parse(directText);
          } catch {
            directJson = null;
          }

          if (directJson && directJson.status === 'success') {
            isSuccessConfirmed = true;
          } else {
            errorOccurred = directJson?.message || 'Réponse invalide de Google Sheets';
          }
        } catch (directErr: any) {
          errorOccurred = directErr.message || 'Échec de transmission réseau';
        }
      }

      // Si et seulement si la confirmation est RÉELLE, on retire l'élément de la file
      if (isSuccessConfirmed) {
        syncedCount++;
      } else {
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastError = errorOccurred;
        remainingItems.push(item);
        errorsList.push({ id: item.id, error: errorOccurred });
      }
    }

    // Sauvegarder les éléments restants qui n'ont pas encore été confirmés
    this.pendingQueue = remainingItems;
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(remainingItems));

    return {
      synced: syncedCount,
      remaining: remainingItems.length,
      errors: errorsList
    };
  }

  // --- Helpers de gestion du stock local ---
  private decrementLocalStock(nomProduit: string, qteVendue: number) {
    const normalized = nomProduit.toLowerCase().trim();
    let updated = false;

    this.stockProduits = this.stockProduits.map(p => {
      if (p.nom.toLowerCase().trim() === normalized) {
        updated = true;
        return {
          ...p,
          stockRestant: Math.max(0, p.stockRestant - qteVendue)
        };
      }
      return p;
    });

    if (updated) {
      this.saveStockLocally(this.stockProduits);
    }
  }

  private incrementLocalStock(nomProduit: string, qteRecue: number, prixAchat?: number) {
    const normalized = nomProduit.toLowerCase().trim();
    let found = false;

    this.stockProduits = this.stockProduits.map(p => {
      if (p.nom.toLowerCase().trim() === normalized) {
        found = true;
        return {
          ...p,
          stockRestant: p.stockRestant + qteRecue,
          prixAchat: prixAchat !== undefined ? prixAchat : p.prixAchat
        };
      }
      return p;
    });

    if (!found) {
      this.stockProduits.push({
        nom: nomProduit,
        stockRestant: qteRecue,
        prixAchat: prixAchat || 0,
        prixVente: (prixAchat || 0) * 1.2
      });
    }

    this.saveStockLocally(this.stockProduits);
  }

  private addOrUpdateLocalProduct(nomProduit: string, prixVente: number, prixAchat: number) {
    const normalized = nomProduit.toLowerCase().trim();
    let found = false;

    this.stockProduits = this.stockProduits.map(p => {
      if (p.nom.toLowerCase().trim() === normalized) {
        found = true;
        return {
          ...p,
          prixVente,
          prixAchat
        };
      }
      return p;
    });

    if (!found) {
      this.stockProduits.push({
        nom: nomProduit,
        stockRestant: 0,
        prixVente,
        prixAchat
      });
    }

    this.saveStockLocally(this.stockProduits);
  }

  // --- Historique des enregistrements récents ---
  public getHistory(): any[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveHistory(entry: any) {
    const list = this.getHistory();
    list.unshift({ ...entry, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(list.slice(0, 40)));
  }

  public clearHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  }

  public resetToDefaultDemo(): void {
    this.saveCommercantsLocally(DEFAULT_COMMERCANTS);
    this.saveStockLocally(DEFAULT_STOCK_PRODUITS);
  }
}

// Helpers d'utilitaires exportés
export function generateId(prefix: 'VTE' | 'PRD' | 'DEP' | 'FAC'): string {
  const now = new Date();
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${year}${month}${day}-${random}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatFCFA(value: number | string | undefined): string {
  if (value === undefined || value === null || isNaN(Number(value))) return '0 FCFA';
  return `${Number(value).toLocaleString('fr-FR')} FCFA`;
}
