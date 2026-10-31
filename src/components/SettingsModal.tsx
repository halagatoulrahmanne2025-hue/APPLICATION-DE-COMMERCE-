import React, { useState } from 'react';
import {
  X,
  Settings,
  Link,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Trash2,
  Wifi,
  Database,
  ShieldAlert,
  HelpCircle,
  Send,
  Boxes,
  Users
} from 'lucide-react';
import { PendingSubmission, DiagnosticResult } from '../types';
import { sanitizeWebAppUrl } from '../services/googleSheetsService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
  onTestConnection: (url?: string) => Promise<DiagnosticResult>;
  isTesting: boolean;
  pendingQueue: PendingSubmission[];
  onSyncPending: () => Promise<void>;
  isSyncingQueue: boolean;
  history: any[];
  onClearHistory: () => void;
  onResetDemoData: () => void;
  connectionFeedback: { status: 'idle' | 'success' | 'error'; message: string; details?: any; errorType?: string };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveUrl,
  onTestConnection,
  isTesting,
  pendingQueue,
  onSyncPending,
  isSyncingQueue,
  history,
  onClearHistory,
  onResetDemoData,
  connectionFeedback
}) => {
  const [urlInput, setUrlInput] = useState(webAppUrl);
  const [savedNotice, setSavedNotice] = useState(false);
  const [urlValidationWarning, setUrlValidationWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    setUrlValidationWarning(null);

    const val = value.trim();
    if (val && val.includes('/edit')) {
      setUrlValidationWarning('Attention : Vous avez collé une URL d\'édition (/edit). Utilisez l\'URL d\'application Web se terminant par /exec.');
    } else if (val && val.endsWith('/dev')) {
      setUrlValidationWarning('Information : L\'URL se termine par /dev (mode test). Elle sera automatiquement convertie en /exec pour la production.');
    }
  };

  const handleSave = () => {
    const sanitized = sanitizeWebAppUrl(urlInput);
    if (!sanitized.valid && sanitized.error) {
      setUrlValidationWarning(sanitized.error);
    }
    onSaveUrl(sanitized.valid ? sanitized.url : urlInput.trim());
    if (sanitized.valid) {
      setUrlInput(sanitized.url);
    }
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTest = async () => {
    handleSave();
    await onTestConnection(urlInput.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Paramètres & Synchronisation</h3>
              <p className="text-xs text-emerald-200/90">
                Diagnostic de connexion Google Sheets & gestion de la file hors-ligne
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* Section 1: URL & Diagnostic de Connexion */}
          <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label htmlFor="scriptUrl" className="block text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Link className="w-4 h-4 text-emerald-700" />
                URL Google Apps Script (Web App /exec)
              </label>
              {savedNotice && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enregistré !
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Collez l'URL de votre application Web Google Apps Script (ex: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800">https://script.google.com/macros/s/.../exec</code>) :
            </p>

            <div className="space-y-2">
              <input
                type="url"
                id="scriptUrl"
                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />

              {urlValidationWarning && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <span>{urlValidationWarning}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Enregistrer l'URL
                </button>
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={isTesting || !urlInput.trim()}
                  className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Diagnostic en cours...' : 'Tester la connexion en direct'}
                </button>
              </div>
            </div>

            {/* Diagnostic Result Display */}
            {connectionFeedback.status !== 'idle' && (
              <div className={`p-4 rounded-xl text-xs space-y-2 ${
                connectionFeedback.status === 'success'
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
                  : 'bg-rose-50 border border-rose-300 text-rose-950'
              }`}>
                <div className="flex items-start gap-2.5">
                  {connectionFeedback.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <strong className="block text-sm font-bold mb-1">
                      {connectionFeedback.status === 'success' ? 'Connexion Validée' : 'Échec du Test'}
                    </strong>
                    <div className="whitespace-pre-line leading-relaxed text-xs">
                      {connectionFeedback.message}
                    </div>
                  </div>
                </div>

                {/* Details Breakdown if success */}
                {connectionFeedback.status === 'success' && connectionFeedback.details && (
                  <div className="mt-2 pt-2 border-t border-emerald-200 flex flex-wrap gap-4 text-xs">
                    {connectionFeedback.details.spreadsheetTitle && (
                      <span className="font-medium">
                        Classeur : <strong>{connectionFeedback.details.spreadsheetTitle}</strong>
                      </span>
                    )}
                    <span className="font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      Commerçants : <strong>{connectionFeedback.details.commercantsCount || 0}</strong>
                    </span>
                    <span className="font-medium flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                      Produits en stock (&gt;0) : <strong>{connectionFeedback.details.stockCount || 0}</strong>
                    </span>
                  </div>
                )}

                {/* Special Advice for AUTH_REQUIRED */}
                {connectionFeedback.errorType === 'AUTH_REQUIRED' && (
                  <div className="mt-2 p-3 bg-white rounded-lg border border-rose-200 text-rose-900 text-xs space-y-1">
                    <strong className="block text-rose-800">Action corrective requise dans Google Apps Script :</strong>
                    <div>1. Ouvrez votre script dans Google Sheets (Extensions &gt; Apps Script).</div>
                    <div>2. Cliquez sur <strong>Déployer</strong> &gt; <strong>Gérer les déploiements</strong>.</div>
                    <div>3. Cliquez sur le <strong>crayon ✏️</strong> (Modifier le déploiement actif).</div>
                    <div>4. À la ligne <strong>Qui a accès</strong>, sélectionnez « <strong>Tout le monde</strong> » (Anyone).</div>
                    <div>5. Cliquez sur <strong>Déployer</strong>, puis recommencez le test ici.</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: File d'attente hors-ligne (Garantie de non-suppression) */}
          <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-700" />
                  File d'attente hors-ligne ({pendingQueue.length})
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Aucun enregistrement n'est supprimé sans confirmation réelle d'écriture dans Google Sheets.
                </p>
              </div>

              {pendingQueue.length > 0 && (
                <button
                  onClick={onSyncPending}
                  disabled={isSyncingQueue || !webAppUrl}
                  className="text-xs font-bold px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
                  {isSyncingQueue ? 'Synchronisation...' : `Synchroniser les ${pendingQueue.length}`}
                </button>
              )}
            </div>

            {pendingQueue.length === 0 ? (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tous vos enregistrements sont synchronisés. Aucun élément en attente.</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <strong>{pendingQueue.length} enregistrement(s) sauvegardé(s) en sécurité dans l'appareil.</strong>
                    <div className="mt-0.5 text-[11px] text-amber-800">
                      Dès que la connexion à Google Sheets est rétablie, cliquez sur « Synchroniser ».
                      Chaque enregistrement sera vérifié individuellement avant d'être retiré de la file.
                    </div>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {pendingQueue.map((item, index) => {
                    const p = item.payload as any;
                    const displayTitle = p.nomProduit
                      ? `${p.quantiteVendue || p.quantiteRecue || ''} ${p.nomProduit}`.trim()
                      : p.motifDepense
                      ? `${p.montantDepense || ''} FCFA - ${p.motifDepense}`
                      : item.id;

                    const dateStr = p.dateVente || p.dateAchat || p.dateDepense || p.dateReception || '';

                    return (
                      <div
                        key={item.id}
                        className="text-xs p-2.5 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            #{index + 1} • {item.formType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900 truncate">
                          {displayTitle}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{p.nomCommercant ? `Commerçant : ${p.nomCommercant}` : dateStr}</span>
                          <span className="font-mono text-[10px]">{p.idVente || p.idProduitAchat || p.idDepense || p.idReception || item.id}</span>
                        </div>

                        {item.lastError && (
                          <div className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 truncate">
                            Dernier essai : {item.lastError}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Historique récent des saisies */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                Historique récent des saisies
              </h4>
              {history.length > 0 && (
                <button
                  onClick={onClearHistory}
                  className="text-[11px] text-slate-500 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Aucun historique récent. Les nouvelles saisies s'afficheront ici.
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {history.map((entry, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {entry.type}
                        </span>
                        <span>{entry.title}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {entry.sub} • {entry.id}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400 shrink-0 ml-2">
                      {entry.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset Demo Data Option */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Réinitialiser les données d'exemple :
            </span>
            <button
              onClick={onResetDemoData}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition cursor-pointer"
            >
              Données de test
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Fermer les paramètres
          </button>
        </div>
      </div>
    </div>
  );
};
