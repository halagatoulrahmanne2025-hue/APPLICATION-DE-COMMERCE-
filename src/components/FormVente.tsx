import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ShoppingBag,
  Send,
  AlertCircle,
  Calendar,
  User,
  Hash,
  Boxes,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { StockProduit, Commercant, VentePayload } from '../types';
import { generateId, getTodayDateString, formatFCFA } from '../services/googleSheetsService';

interface FormVenteProps {
  commercants: Commercant[];
  produitsEnStock: StockProduit[];
  onBack: () => void;
  onSubmit: (payload: VentePayload) => Promise<{ success: boolean; message: string; queued?: boolean }>;
  onSuccess: (summary: { title: string; details: Array<{ label: string; value: string }>; targetSheet: string }) => void;
}

export const FormVente: React.FC<FormVenteProps> = ({
  commercants,
  produitsEnStock,
  onBack,
  onSubmit,
  onSuccess
}) => {
  // 1. Initialisation des champs
  const [idVente, setIdVente] = useState<string>(() => generateId('VTE'));
  const [dateVente, setDateVente] = useState<string>(() => getTodayDateString());
  const [nomCommercant, setNomCommercant] = useState<string>('');
  const [nomProduit, setNomProduit] = useState<string>('');
  const [quantiteVendue, setQuantiteVendue] = useState<string>('1');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtrage strict : Produits avec stock restant STRICTEMENT > 0
  const availableProducts = useMemo(() => {
    return produitsEnStock.filter(p => p.stockRestant > 0);
  }, [produitsEnStock]);

  // Produit sélectionné
  const selectedProduct = useMemo(() => {
    return availableProducts.find(p => p.nom === nomProduit);
  }, [availableProducts, nomProduit]);

  // Si aucun produit n'est sélectionné mais qu'il y en a de disponibles, présélectionner le premier
  useEffect(() => {
    if (!nomProduit && availableProducts.length > 0) {
      setNomProduit(availableProducts[0].nom);
    }
  }, [availableProducts, nomProduit]);

  // Présélectionner le premier commerçant si disponible
  useEffect(() => {
    if (!nomCommercant && commercants.length > 0) {
      setNomCommercant(commercants[0].nom);
    }
  }, [commercants, nomCommercant]);

  // Calcul du montant estimé si un prix de vente est disponible
  const montantTotalEstime = useMemo(() => {
    const qte = Number(quantiteVendue) || 0;
    if (selectedProduct && selectedProduct.prixVente) {
      return qte * selectedProduct.prixVente;
    }
    return 0;
  }, [quantiteVendue, selectedProduct]);

  // Validation
  const qteNumber = Number(quantiteVendue);
  const isStockExceeded = selectedProduct ? qteNumber > selectedProduct.stockRestant : false;
  const isStockZeroOrNegative = qteNumber <= 0 || isNaN(qteNumber);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!idVente.trim()) {
      setErrorMessage("Le numéro automatique de vente est obligatoire.");
      return;
    }
    if (!dateVente) {
      setErrorMessage("La date de vente est requise.");
      return;
    }
    if (!nomCommercant) {
      setErrorMessage("Veuillez sélectionner un commerçant dans la liste déroulante.");
      return;
    }
    if (!nomProduit) {
      setErrorMessage("Veuillez choisir un produit disponible en stock.");
      return;
    }
    if (isStockZeroOrNegative) {
      setErrorMessage("La quantité vendue doit être un nombre strictement supérieur à 0.");
      return;
    }
    if (isStockExceeded && selectedProduct) {
      setErrorMessage(`Quantité insuffisante en stock ! Il ne reste que ${selectedProduct.stockRestant} unité(s) pour « ${selectedProduct.nom} ».`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: VentePayload = {
        idVente: idVente.trim(),
        dateVente,
        nomCommercant,
        nomProduit,
        quantiteVendue: qteNumber,
        montantTotal: montantTotalEstime,
        prixVenteUnitaire: selectedProduct?.prixVente
      };

      const result = await onSubmit(payload);

      if (result.success) {
        onSuccess({
          title: "Vente Enregistrée avec Succès",
          targetSheet: "les vents",
          details: [
            { label: "Numéro ID Vente", value: idVente },
            { label: "Date de la vente", value: dateVente },
            { label: "Commerçant", value: nomCommercant },
            { label: "Produit vendu", value: nomProduit },
            { label: "Quantité vendue", value: `${qteNumber} ${selectedProduct?.unite || 'unité(s)'}` },
            { label: "Stock restant mis à jour", value: `${Math.max(0, (selectedProduct?.stockRestant || 0) - qteNumber)} dispo` },
            ...(montantTotalEstime > 0 ? [{ label: "Montant estimé", value: formatFCFA(montantTotalEstime) }] : [])
          ]
        });
      } else {
        setErrorMessage(result.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la communication avec Google Sheets.");
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
          Feuille : « les vents »
        </span>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 border-b border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Formulaire des Ventes</h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Enregistrement automatique vers l'onglet <strong className="text-white">« les vents »</strong>
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
          {/* 1. ID_Vente : Numéro automatique et unique */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="idVente" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. ID Vente (Automatique & Unique)
              </label>
              <button
                type="button"
                onClick={() => setIdVente(generateId('VTE'))}
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
                id="idVente"
                value={idVente}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed select-all"
                title="Numéro unique généré automatiquement"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Généré automatiquement pour garantir l'unicité de chaque transaction.
            </p>
          </div>

          {/* 2. Date_Vente : Date du jour par défaut */}
          <div>
            <label htmlFor="dateVente" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Date de la Vente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="date"
                id="dateVente"
                value={dateVente}
                onChange={(e) => setDateVente(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Pré-remplie avec la date du jour. Vous pouvez la modifier si nécessaire.
            </p>
          </div>

          {/* 3. Nom_Commercant : Liste déroulante alimentée par LISTE_COMMERCANTS */}
          <div>
            <label htmlFor="nomCommercant" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Nom du Commerçant (LISTE_COMMERCANTS)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-emerald-700" />
              </div>
              <select
                id="nomCommercant"
                value={nomCommercant}
                onChange={(e) => setNomCommercant(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm appearance-none"
              >
                {commercants.length === 0 ? (
                  <option value="">Aucun commerçant trouvé dans LISTE_COMMERCANTS</option>
                ) : (
                  commercants.map((c) => (
                    <option key={c.nom} value={c.nom}>
                      {c.nom} {c.boutique ? `(${c.boutique})` : ''}
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Synchronisé en direct avec l'onglet « LISTE_COMMERCANTS » de Google Sheets.
            </p>
          </div>

          {/* 4. Nom_Produit : Uniquement les produits dont le stock restant > 0 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="nomProduit" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Produit Disponible (Stock &gt; 0)
              </label>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                {availableProducts.length} référence(s) en stock
              </span>
            </div>

            {availableProducts.length === 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <strong>Aucun produit avec stock disponible (&gt; 0) :</strong> Les produits dont le stock est nul
                  ou négatif sont masqués conformément aux règles. Vous pouvez réceptionner des marchandises via le formulaire des factures pour alimenter le stock.
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Boxes className="w-4 h-4 text-emerald-700" />
                </div>
                <select
                  id="nomProduit"
                  value={nomProduit}
                  onChange={(e) => {
                    setNomProduit(e.target.value);
                    setQuantiteVendue('1');
                  }}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm appearance-none"
                >
                  {availableProducts.map((p) => (
                    <option key={p.nom} value={p.nom}>
                      {p.nom} — (Stock restant : {p.stockRestant} {p.unite || 'unités'})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  ▼
                </div>
              </div>
            )}

            {/* Selected Product Stock Card */}
            {selectedProduct && (
              <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-900 font-medium">
                    Stock actuel disponible : <strong className="text-emerald-800 font-bold">{selectedProduct.stockRestant}</strong>
                  </span>
                </div>
                {selectedProduct.prixVente && selectedProduct.prixVente > 0 && (
                  <span className="text-slate-600 font-medium">
                    Prix unitaire : <strong className="text-slate-900">{formatFCFA(selectedProduct.prixVente)}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 5. Quantite_Vendue : Champ numérique avec vérification du stock */}
          <div>
            <label htmlFor="quantiteVendue" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              5. Quantité Vendue
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantiteVendue(prev => String(Math.max(1, (Number(prev) || 1) - 1)))}
                className="w-12 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center border border-slate-200 transition active:scale-95"
              >
                -
              </button>
              <input
                type="number"
                id="quantiteVendue"
                inputMode="numeric"
                min="1"
                max={selectedProduct?.stockRestant || 9999}
                value={quantiteVendue}
                onChange={(e) => setQuantiteVendue(e.target.value)}
                required
                className={`flex-1 py-2.5 px-4 text-center bg-white border ${
                  isStockExceeded ? 'border-rose-500 ring-2 ring-rose-200' : 'border-slate-300 focus:ring-emerald-600'
                } rounded-xl text-lg font-bold text-slate-800 shadow-sm focus:outline-none`}
              />
              <button
                type="button"
                onClick={() => {
                  const max = selectedProduct?.stockRestant || 9999;
                  setQuantiteVendue(prev => String(Math.min(max, (Number(prev) || 0) + 1)));
                }}
                className="w-12 h-11 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-lg flex items-center justify-center border border-emerald-300 transition active:scale-95"
              >
                +
              </button>
            </div>

            {/* Stock Exceeded Alert */}
            {isStockExceeded && selectedProduct && (
              <p className="text-xs text-rose-600 font-semibold mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Dépassement de stock ! Maximum disponible : {selectedProduct.stockRestant}
              </p>
            )}

            {/* Estimated Total Display */}
            {montantTotalEstime > 0 && !isStockExceeded && (
              <div className="mt-3 p-3 bg-emerald-900 text-white rounded-xl flex items-center justify-between text-xs sm:text-sm">
                <span className="text-emerald-200">Total estimé de la vente :</span>
                <span className="text-base sm:text-lg font-black text-white">
                  {formatFCFA(montantTotalEstime)}
                </span>
              </div>
            )}
          </div>

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
              disabled={isSubmitting || isStockExceeded || isStockZeroOrNegative || availableProducts.length === 0}
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
                  <span>ENREGISTRER DANS « LES VENTS »</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
