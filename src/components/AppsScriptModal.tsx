import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Code2,
  FileSpreadsheet,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/appsScriptCode';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  webAppUrl: string;
  onSaveUrl: (url: string) => void;
  onTestConnection: (url?: string) => Promise<any>;
  isTesting: boolean;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({
  isOpen,
  onClose,
  webAppUrl,
  onSaveUrl,
  onTestConnection,
  isTesting
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'code' | 'structure'>('guide');
  const [tempUrl, setTempUrl] = useState(webAppUrl);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveAndTest = async () => {
    onSaveUrl(tempUrl);
    await onTestConnection();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Guide de Connexion Google Sheets</h3>
              <p className="text-xs text-emerald-200/90">
                Installation 100% gratuite via Google Apps Script (aucun abonnement requis)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            1. Guide Pas-à-Pas
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>2. Code Google Apps Script (Code.gs)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
              Prêt
            </span>
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap ${
              activeTab === 'structure'
                ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            3. Structure des Onglets
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700">
          {/* TAB 1: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              {/* Quick Summary Pill */}
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs sm:text-sm text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <strong>Zéro Frais • 100% Quotas Gratuits Google :</strong> Vous n'avez besoin
                  d'aucun serveur payant ni abonnement. Google Apps Script s'exécute directement dans votre
                  compte Google et transfère chaque soumission vers votre fichier Sheets.
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Ouvrez votre fichier Google Sheets existant
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Accédez au classeur contenant vos tableaux de ventes, produits, dépenses et factures.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Ouvrez l'éditeur Apps Script
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Dans le menu supérieur de Google Sheets, cliquez sur <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.
                      Un nouvel onglet s'ouvrira.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                      <span>Collez le code complet fourni</span>
                      <button
                        onClick={handleCopy}
                        className="text-xs font-semibold px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex items-center gap-1"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'Copié !' : 'Copier le code'}
                      </button>
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Supprimez le code par défaut présent dans l'éditeur (<code>myFunction</code>),
                      puis collez l'intégralité du script (accessible dans l'onglet <strong>« 2. Code Google Apps Script »</strong>).
                      Cliquez sur la disquette 💾 pour enregistrer.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Déployez en tant qu'Application Web
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      En haut à droite de l'éditeur Apps Script, cliquez sur le bouton bleu <strong>Déployer</strong>.
                    </p>
                    <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-2">
                      <div className="font-semibold text-emerald-900">👉 Si vous mettez à jour votre script existant :</div>
                      <div className="pl-2 space-y-1 text-slate-700">
                        <div>1. Cliquez sur <strong>Déployer &gt; Gérer les déploiements</strong>.</div>
                        <div>2. Cliquez sur l'icône <strong>Crayon ✏️ (Modifier)</strong>.</div>
                        <div>3. Dans la liste déroulante <strong>Version</strong>, choisissez impérativement <strong>« Nouvelle version »</strong>.</div>
                        <div>4. Vérifiez que <em>« Qui a accès »</em> est bien sur <strong>« Tout le monde »</strong>, puis cliquez sur <strong>Déployer</strong>.</div>
                      </div>
                      <div className="font-semibold text-emerald-900 pt-1">👉 S'il s'agit de votre premier déploiement :</div>
                      <div className="pl-2 space-y-1 text-slate-700">
                        <div>1. Cliquez sur <strong>Déployer &gt; Nouveau déploiement</strong>.</div>
                        <div>2. Cliquez sur la roue crantée ⚙️ à gauche et choisissez <strong>Application Web</strong>.</div>
                        <div>3. <strong>Exécuter en tant que :</strong> « Moi (votre adresse email) ».</div>
                        <div>4. <strong>Qui a accès :</strong> « <strong>Tout le monde</strong> » (Anyone).</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    5
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Autorisez l'accès Google et copiez l'URL
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Lors du premier déploiement ou d'un changement de permissions, Google affiche une invite de sécurité :
                    </p>
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5 text-amber-950">
                      <div>1. Cliquez sur <strong>« Autoriser l'accès »</strong>.</div>
                      <div>2. Choisissez votre compte Google.</div>
                      <div>3. Cliquez sur le lien en bas <strong>« Paramètres avancés »</strong> (ou « Advanced »).</div>
                      <div>4. Cliquez sur <strong>« Accéder à [Nom du script] (non sécurisé) »</strong>.</div>
                      <div>5. Cliquez sur <strong>« Autoriser »</strong>.</div>
                      <div className="pt-1 font-semibold text-emerald-900">
                        ✓ Copiez ensuite l'<strong>URL de l'application Web</strong> se terminant par <code>/exec</code>.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    6
                  </span>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">
                      Collez votre URL ci-dessous pour activer la connexion
                    </h4>
                    <div className="mt-2 flex gap-2">
                      <input
                        type="url"
                        placeholder="https://script.google.com/macros/s/.../exec"
                        value={tempUrl}
                        onChange={(e) => setTempUrl(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      />
                      <button
                        onClick={handleSaveAndTest}
                        disabled={isTesting || !tempUrl.trim()}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 shrink-0"
                      >
                        {isTesting ? 'Test...' : 'Enregistrer & Tester'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CODE APPS SCRIPT */}
          {activeTab === 'code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Fichier Code.gs (Google Apps Script Version 3.0)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Synchronisation bidirectionnelle dans les 2 sens, 5 onglets, stocks &gt; 0 et protection anti-doublons.
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Code copié dans le presse-papier !' : 'Copier tout le code'}
                </button>
              </div>

              <div className="relative bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-[380px] border border-slate-800 shadow-inner">
                <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
              </div>

              <p className="text-[11px] text-slate-500">
                💡 <em>Astuce :</em> Lorsque vous mettez à jour le code dans Google Apps Script,
                cliquez sur <strong>Déployer</strong> &gt; <strong>Gérer les déploiements</strong> &gt; crayon ✏️ &gt;
                Version « <strong>Nouvelle version</strong> » pour que les modifications soient actives.
              </p>
            </div>
          )}

          {/* TAB 3: STRUCTURE DES ONGLETS */}
          {activeTab === 'structure' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Voici le détail des onglets existants et des colonnes attendues dans votre Google Sheets :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. les vents */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Onglet 1 : « les vents »</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      Ventes
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                    <div>1. ID_Vente</div>
                    <div>2. Date_Vente</div>
                    <div>3. Nom_Commercant</div>
                    <div>4. Nom_Produit</div>
                    <div>5. Quantite_Vendue</div>
                  </div>
                </div>

                {/* 2. les produit */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Onglet 2 : « les produit »</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      Achats & Références
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                    <div>1. ID_Produit_Achat</div>
                    <div>2. Date_Achat</div>
                    <div>3. Nom_Produit</div>
                    <div>4. Prix_Achat_Unitaire</div>
                    <div>5. Prix_Vente_Unitaire</div>
                  </div>
                </div>

                {/* 3. les depence */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Onglet 3 : « les depence »</span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      Dépenses
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                    <div>1. ID_Depense</div>
                    <div>2. Date_Depense</div>
                    <div>3. Nom_Commercant</div>
                    <div>4. Montant_Depense</div>
                    <div>5. Motif_Depense</div>
                  </div>
                </div>

                {/* 4. les factur */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">Onglet 4 : « les factur »</span>
                    <span className="text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.2 rounded font-mono font-bold">
                      Réceptions
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                    <div>1. ID_Reception</div>
                    <div>2. Date_Reception</div>
                    <div>3. Nom_Produit</div>
                    <div>4. Quantite_Recue</div>
                    <div>5. Prix_Achat_Unitaire</div>
                  </div>
                </div>

                {/* 5. liste_commercants */}
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950">Onglet 5 : « liste_commercants »</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                      Commerçants
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                    <div>1. N°</div>
                    <div>2. Nom et prénom du commerçant</div>
                    <div>3. Téléphone</div>
                    <div>4. Observation</div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Alimente automatiquement les listes déroulantes des ventes et dépenses. Contrôle strict anti-doublon.
                  </p>
                </div>

                {/* 6. stock */}
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950">Source : « stock »</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-bold">
                      Stock &gt; 0
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Colonne A : <strong>Nom_Produit</strong> | Colonne B : <strong>Stock_Restant</strong>.
                    L'application filtre automatiquement pour n'afficher que les produits avec <strong>Stock &gt; 0</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Conforme aux noms exacts de vos feuilles de calcul.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition"
          >
            Fermer le guide
          </button>
        </div>
      </div>
    </div>
  );
};
