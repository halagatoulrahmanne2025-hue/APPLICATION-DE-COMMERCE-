import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  PackagePlus,
  Send,
  AlertCircle,
  Calendar,
  Hash,
  Coins,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { ProduitPayload } from '../types';
import { generateId, getTodayDateString, formatFCFA } from '../services/googleSheetsService';

interface FormProduitProps {
  onBack: () => void;
  onSubmit: (payload: ProduitPayload) => Promise<{ success: boolean; message: string; queued?: boolean }>;
  onSuccess: (summary: { title: string; details: Array<{ label: string; value: string }>; targetSheet: string }) => void;
}

export const FormProduit: React.FC<FormProduitProps> = ({
  onBack,
  onSubmit,
  onSuccess
}) => {
  const [idProduitAchat, setIdProduitAchat] = useState<string>(() => generateId('PRD'));
  const [dateAchat, setDateAchat] = useState<string>(() => getTodayDateString());
  const [nomProduit, setNomProduit] = useState<string>('');
  const [prixAchatUnitaire, setPrixAchatUnitaire] = useState<string>('');
  const [prixVenteUnitaire, setPrixVenteUnitaire] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Marge unitaire estimée
  const paNum = Number(prixAchatUnitaire) || 0;
  const pvNum = Number(prixVenteUnitaire) || 0;
  const margeUnitaire = pvNum - paNum;
  const margePourcentage = paNum > 0 ? ((margeUnitaire / paNum) * 100).toFixed(1) : null;
  const isVenteInferieurAchat = pvNum > 0 && paNum > 0 && pvNum < paNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!idProduitAchat.trim()) {
      setErrorMessage("Le numéro automatique de produit est obligatoire.");
      return;
    }
    if (!dateAchat) {
      setErrorMessage("La date d'achat est requise.");
      return;
    }
    if (!nomProduit.trim()) {
      setErrorMessage("Le nom du produit est obligatoire.");
      return;
    }
    if (paNum <= 0) {
      setErrorMessage("Le prix d'achat unitaire doit être supérieur à zéro (en FCFA).");
      return;
    }
    if (pvNum <= 0) {
      setErrorMessage("Le prix de vente unitaire doit être supérieur à zéro (en FCFA).");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: ProduitPayload = {
        idProduitAchat: idProduitAchat.trim(),
        dateAchat,
        nomProduit: nomProduit.trim(),
        prixAchatUnitaire: paNum,
        prixVenteUnitaire: pvNum
      };

      const result = await onSubmit(payload);

      if (result.success) {
        onSuccess({
          title: "Produit Référencé avec Succès",
          targetSheet: "les produit",
          details: [
            { label: "Numéro ID Achat", value: idProduitAchat },
            { label: "Date d'achat", value: dateAchat },
            { label: "Nom du produit", value: nomProduit.trim() },
            { label: "Prix d'achat unitaire", value: formatFCFA(paNum) },
            { label: "Prix de vente unitaire", value: formatFCFA(pvNum) },
            { label: "Marge brute estimée", value: `${formatFCFA(margeUnitaire)} (${margePourcentage}%)` }
          ]
        });
      } else {
        setErrorMessage(result.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-6 sm:py-8 px-4 max-w-2xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition border border-emerald-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETOUR À L'ACCUEIL</span>
        </button>

        <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-300">
          Feuille : « les produit »
        </span>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 border-b border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
              <PackagePlus className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Formulaire des Produits</h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Enregistrement automatique vers l'onglet <strong className="text-white">« les produit »</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="m-5 sm:m-6 mb-0 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div className="text-xs sm:text-sm text-rose-900 leading-relaxed font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
          {/* 1. ID_Produit_Achat : automatique et unique */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="idProduitAchat" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. ID Produit Achat (Automatique & Unique)
              </label>
              <button
                type="button"
                onClick={() => setIdProduitAchat(generateId('PRD'))}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" />
                Régénérer
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="text"
                id="idProduitAchat"
                value={idProduitAchat}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed select-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Code de référence unique attribué à ce nouvel article ou achat.
            </p>
          </div>

          {/* 2. Date_Achat */}
          <div>
            <label htmlFor="dateAchat" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Date de l'Achat
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="date"
                id="dateAchat"
                value={dateAchat}
                onChange={(e) => setDateAchat(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
            </div>
          </div>

          {/* 3. Nom_Produit */}
          <div>
            <label htmlFor="nomProduit" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Nom du Produit
            </label>
            <input
              type="text"
              id="nomProduit"
              value={nomProduit}
              onChange={(e) => setNomProduit(e.target.value)}
              placeholder="Ex: Riz Parfumé 50kg, Huile Dinor 5L, Savon BF..."
              required
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
            />
          </div>

          {/* Tarification : Prix Achat et Prix Vente en FCFA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 4. Prix_Achat_Unitaire */}
            <div>
              <label htmlFor="prixAchatUnitaire" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                4. Prix d'Achat Unitaire (FCFA)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Coins className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="number"
                  id="prixAchatUnitaire"
                  inputMode="numeric"
                  min="0"
                  step="50"
                  placeholder="Ex: 15000"
                  value={prixAchatUnitaire}
                  onChange={(e) => setPrixAchatUnitaire(e.target.value)}
                  required
                  className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  FCFA
                </div>
              </div>
            </div>

            {/* 5. Prix_Vente_Unitaire */}
            <div>
              <label htmlFor="prixVenteUnitaire" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                5. Prix de Vente Unitaire (FCFA)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Coins className="w-4 h-4 text-emerald-700" />
                </div>
                <input
                  type="number"
                  id="prixVenteUnitaire"
                  inputMode="numeric"
                  min="0"
                  step="50"
                  placeholder="Ex: 17500"
                  value={prixVenteUnitaire}
                  onChange={(e) => setPrixVenteUnitaire(e.target.value)}
                  required
                  className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                  FCFA
                </div>
              </div>
            </div>
          </div>

          {/* Margin helper pill */}
          {paNum > 0 && pvNum > 0 && (
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
              isVenteInferieurAchat
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}>
              <div className="flex items-center gap-2">
                {isVenteInferieurAchat ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>
                  {isVenteInferieurAchat ? (
                    <strong>Attention : Prix de vente inférieur au prix d'achat !</strong>
                  ) : (
                    <span>Marge unitaire calculée :</span>
                  )}
                </span>
              </div>
              <div className="font-bold">
                {formatFCFA(margeUnitaire)} {margePourcentage && `(${margePourcentage}%)`}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nomProduit.trim() || paNum <= 0 || pvNum <= 0}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-base shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Envoi vers Google Sheets...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>ENREGISTRER DANS « LES PRODUIT »</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
