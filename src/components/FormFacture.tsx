import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Receipt,
  Send,
  AlertCircle,
  Calendar,
  Hash,
  Boxes,
  Coins,
  RefreshCw,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';
import { StockProduit, FacturePayload } from '../types';
import { generateId, getTodayDateString, formatFCFA } from '../services/googleSheetsService';

interface FormFactureProps {
  stockProduits: StockProduit[];
  onBack: () => void;
  onSubmit: (payload: FacturePayload) => Promise<{ success: boolean; message: string; queued?: boolean }>;
  onSuccess: (summary: { title: string; details: Array<{ label: string; value: string }>; targetSheet: string }) => void;
}

export const FormFacture: React.FC<FormFactureProps> = ({
  stockProduits,
  onBack,
  onSubmit,
  onSuccess
}) => {
  const [idReception, setIdReception] = useState<string>(() => generateId('FAC'));
  const [dateReception, setDateReception] = useState<string>(() => getTodayDateString());
  const [nomProduit, setNomProduit] = useState<string>('');
  const [customNomProduit, setCustomNomProduit] = useState<string>('');
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);
  const [quantiteRecue, setQuantiteRecue] = useState<string>('10');
  const [prixAchatUnitaire, setPrixAchatUnitaire] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialiser avec le premier produit disponible
  useEffect(() => {
    if (!nomProduit && stockProduits.length > 0 && !isCustomProduct) {
      const first = stockProduits[0];
      setNomProduit(first.nom);
      if (first.prixAchat) {
        setPrixAchatUnitaire(String(first.prixAchat));
      }
    }
  }, [stockProduits, nomProduit, isCustomProduct]);

  // Si on sélectionne un produit dans la liste déroulante, préremplir son prix d'achat
  const handleProductSelect = (selectedName: string) => {
    if (selectedName === '__NOUVEAU__') {
      setIsCustomProduct(true);
      setNomProduit('');
      setPrixAchatUnitaire('');
    } else {
      setIsCustomProduct(false);
      setNomProduit(selectedName);
      const match = stockProduits.find(p => p.nom === selectedName);
      if (match && match.prixAchat) {
        setPrixAchatUnitaire(String(match.prixAchat));
      }
    }
  };

  const finalProductName = isCustomProduct ? customNomProduit.trim() : nomProduit;
  const qteNumber = Number(quantiteRecue) || 0;
  const paNumber = Number(prixAchatUnitaire) || 0;
  const totalFacture = qteNumber * paNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!idReception.trim()) {
      setErrorMessage("Le numéro automatique de réception est obligatoire.");
      return;
    }
    if (!dateReception) {
      setErrorMessage("La date de réception est requise.");
      return;
    }
    if (!finalProductName) {
      setErrorMessage("Veuillez sélectionner ou saisir le nom du produit réceptionné.");
      return;
    }
    if (qteNumber <= 0) {
      setErrorMessage("La quantité reçue doit être strictement supérieure à 0.");
      return;
    }
    if (paNumber <= 0) {
      setErrorMessage("Le prix d'achat unitaire doit être supérieur à zéro (en FCFA).");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: FacturePayload = {
        idReception: idReception.trim(),
        dateReception,
        nomProduit: finalProductName,
        quantiteRecue: qteNumber,
        prixAchatUnitaire: paNumber,
        montantTotal: totalFacture
      };

      const result = await onSubmit(payload);

      if (result.success) {
        onSuccess({
          title: "Facture / Reçu Enregistré avec Succès",
          targetSheet: "les factur",
          details: [
            { label: "Numéro ID Réception", value: idReception },
            { label: "Date de réception", value: dateReception },
            { label: "Produit réceptionné", value: finalProductName },
            { label: "Quantité reçue", value: `${qteNumber} unité(s)` },
            { label: "Prix d'achat unitaire", value: formatFCFA(paNumber) },
            { label: "Total facture / reçu", value: formatFCFA(totalFacture) }
          ]
        });
      } else {
        setErrorMessage(result.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la communication.");
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
          Feuille : « les factur »
        </span>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 border-b border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-600/90 border border-teal-400/50 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Formulaire Factures & Reçus</h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Enregistrement automatique vers l'onglet <strong className="text-white">« les factur »</strong>
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
          {/* 1. ID_Reception : automatique et unique */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="idReception" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. ID Réception (Automatique & Unique)
              </label>
              <button
                type="button"
                onClick={() => setIdReception(generateId('FAC'))}
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
                id="idReception"
                value={idReception}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed select-all"
              />
            </div>
          </div>

          {/* 2. Date_Reception */}
          <div>
            <label htmlFor="dateReception" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Date de Réception
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="date"
                id="dateReception"
                value={dateReception}
                onChange={(e) => setDateReception(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
            </div>
          </div>

          {/* 3. Nom_Produit : liste déroulante alimentée par la liste des produits */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="nomProduitSelect" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Nom du Produit Réceptionné
              </label>
              {!isCustomProduct ? (
                <button
                  type="button"
                  onClick={() => setIsCustomProduct(true)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline"
                >
                  <PlusCircle className="w-3 h-3" />
                  Saisir un autre produit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomProduct(false)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 font-semibold hover:underline"
                >
                  Choisir dans la liste existante
                </button>
              )}
            </div>

            {!isCustomProduct ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Boxes className="w-4 h-4 text-emerald-700" />
                </div>
                <select
                  id="nomProduitSelect"
                  value={nomProduit}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm appearance-none"
                >
                  {stockProduits.map((p) => (
                    <option key={p.nom} value={p.nom}>
                      {p.nom} {p.stockRestant !== undefined ? `(Actuel: ${p.stockRestant})` : ''}
                    </option>
                  ))}
                  <option value="__NOUVEAU__">+ Saisir un nouveau produit non listé...</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  id="customNomProduit"
                  value={customNomProduit}
                  onChange={(e) => setCustomNomProduit(e.target.value)}
                  placeholder="Tapez le nom exact du produit reçu..."
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
                />
                <p className="text-[11px] text-slate-500">
                  Ce produit sera automatiquement ajouté ou comptabilisé dans votre stock Google Sheets.
                </p>
              </div>
            )}
          </div>

          {/* 4. Quantite_Recue : champ numérique */}
          <div>
            <label htmlFor="quantiteRecue" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              4. Quantité Reçue (Unités / Colis)
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantiteRecue(prev => String(Math.max(1, (Number(prev) || 1) - 1)))}
                className="w-12 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center border border-slate-200 transition active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                id="quantiteRecue"
                inputMode="numeric"
                min="1"
                value={quantiteRecue}
                onChange={(e) => setQuantiteRecue(e.target.value)}
                required
                className="flex-1 py-2.5 px-4 text-center bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantiteRecue(prev => String((Number(prev) || 0) + 1))}
                className="w-12 h-11 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-900 font-bold text-lg flex items-center justify-center border border-teal-300 transition active:scale-95"
              >
                +
              </button>
            </div>
          </div>

          {/* 5. Prix_Achat_Unitaire : montant en FCFA */}
          <div>
            <label htmlFor="prixAchatFacture" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              5. Prix d'Achat Unitaire (FCFA)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Coins className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="number"
                id="prixAchatFacture"
                inputMode="numeric"
                min="0"
                step="50"
                placeholder="Ex: 12500"
                value={prixAchatUnitaire}
                onChange={(e) => setPrixAchatUnitaire(e.target.value)}
                required
                className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                FCFA
              </div>
            </div>
          </div>

          {/* Total Facture Helper Display */}
          {totalFacture > 0 && (
            <div className="p-4 bg-teal-900 text-white rounded-xl flex items-center justify-between text-sm shadow-inner">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-300" />
                <span className="text-teal-100">Total global de la facture / du reçu :</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white">
                {formatFCFA(totalFacture)}
              </span>
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
              disabled={isSubmitting || !finalProductName || qteNumber <= 0 || paNumber <= 0}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-base shadow-lg shadow-teal-950/20 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Envoi vers Google Sheets...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>ENREGISTRER DANS « LES FACTUR »</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
