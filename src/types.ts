export interface Commercant {
  numero?: number | string;
  nom: string;
  nomPrenom?: string;
  telephone?: string;
  observation?: string;
  boutique?: string;
}

export interface StockProduit {
  nom: string;
  stockRestant: number;
  prixVente?: number;
  prixAchat?: number;
  unite?: string;
}

export interface VentePayload {
  idVente: string;
  dateVente: string;
  nomCommercant: string;
  nomProduit: string;
  quantiteVendue: number;
  // Optionnels / calculés
  montantTotal?: number;
  prixVenteUnitaire?: number;
}

export interface ProduitPayload {
  idProduitAchat: string;
  dateAchat: string;
  nomProduit: string;
  prixAchatUnitaire: number;
  prixVenteUnitaire: number;
}

export interface DepensePayload {
  idDepense: string;
  dateDepense: string;
  nomCommercant: string;
  montantDepense: number;
  motifDepense: string;
}

export interface FacturePayload {
  idReception: string;
  dateReception: string;
  nomProduit: string;
  quantiteRecue: number;
  prixAchatUnitaire: number;
  montantTotal?: number;
}

export interface CommercantPayload {
  numero: number | string;
  nomPrenom: string;
  telephone: string;
  observation?: string;
}

export type FormType = 'home' | 'ventes' | 'produits' | 'depenses' | 'factures' | 'commercants';

export interface PendingSubmission {
  id: string;
  formType: 'ventes' | 'produits' | 'depenses' | 'factures' | 'commercants';
  payload: VentePayload | ProduitPayload | DepensePayload | FacturePayload | CommercantPayload;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface DiagnosticResult {
  success: boolean;
  message: string;
  errorType?: 'INVALID_URL' | 'AUTH_REQUIRED' | 'NOT_JSON' | 'SCRIPT_ERROR' | 'NETWORK_ERROR' | 'CORS_ERROR';
  details?: {
    spreadsheetTitle?: string;
    commercantsCount?: number;
    stockCount?: number;
    sheets?: Record<string, { existe: boolean; lignes: number }>;
  };
}

export interface AppConfig {
  webAppUrl: string;
  sheetNameVentes: string;
  sheetNameProduits: string;
  sheetNameDepenses: string;
  sheetNameFactures: string;
  sheetNameCommercants: string;
  sheetNameStock: string;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTimestamp: number | null;
  lastSyncFormatted: string;
  lastSyncStatus: 'idle' | 'success' | 'error';
  lastSyncMessage: string;
  isOnline: boolean;
}

