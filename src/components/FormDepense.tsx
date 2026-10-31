import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wallet,
  Send,
  AlertCircle,
  Calendar,
  User,
  Hash,
  Coins,
  FileText,
  RefreshCw,
  Tag
} from 'lucide-react';
import { Commercant, DepensePayload } from '../types';
import { generateId, getTodayDateString, formatFCFA } from '../services/googleSheetsService';
import { POPULAR_EXPENSE_MOTIFS } from '../services/defaultData';

interface FormDepenseProps {
  commercants: Commercant[];
  onBack: () => void;
  onSubmit: (payload: DepensePayload) => Promise<{ success: boolean; message: string; queued?: boolean }>;
  onSuccess: (summary: { title: string; details: Array<{ label: string; value: string }>; targetSheet: string }) => void;
}

export const FormDepense: React.FC<FormDepenseProps> = ({
  commercants,
  onBack,
  onSubmit,
  onSuccess
}) => {
  const [idDepense, setIdDepense] = useState<string>(() => generateId('DEP'));
  const [dateDepense, setDateDepense] = useState<string>(() => getTodayDateString());
  const [nomCommercant, setNomCommercant] = useState<string>('');
  const [montantDepense, setMontantDepense] = useState<string>('');
  const [motifDepense, setMotifDepense] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!nomCommercant && commercants.length > 0) {
      setNomCommercant(commercants[0].nom);
    }
  }, [commercants, nomCommercant]);

  const montantNum = Number(montantDepense) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!idDepense.trim()) {
      setErrorMessage("Le numéro automatique de dépense est obligatoire.");
      return;
    }
    if (!dateDepense) {
      setErrorMessage("La date de la dépense est obligatoire.");
      return;
    }
    if (!nomCommercant) {
      setErrorMessage("Veuillez sélectionner un commerçant dans la liste déroulante.");
      return;
    }
    if (montantNum <= 0) {
      setErrorMessage("Le montant de la dépense doit être supérieur à zéro (en FCFA).");
      return;
    }
    if (!motifDepense.trim()) {
      setErrorMessage("Veuillez préciser le motif de la dépense.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: DepensePayload = {
        idDepense: idDepense.trim(),
        dateDepense,
        nomCommercant,
        montantDepense: montantNum,
        motifDepense: motifDepense.trim()
      };

      const result = await onSubmit(payload);

      if (result.success) {
        onSuccess({
          title: "Dépense Enregistrée avec Succès",
          targetSheet: "les depence",
          details: [
            { label: "Numéro ID Dépense", value: idDepense },
            { label: "Date de la dépense", value: dateDepense },
            { label: "Commerçant", value: nomCommercant },
            { label: "Montant décaissé", value: formatFCFA(montantNum) },
            { label: "Motif déclaré", value: motifDepense.trim() }
          ]
        });
      } else {
        setErrorMessage(result.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de transmission.");
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
          Feuille : « les depence »
        </span>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden">
        {/* Form Header */}
        <div className="bg-emerald-900 text-white p-5 sm:p-6 border-b border-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-600/90 border border-amber-400/50 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Formulaire des Dépenses</h2>
              <p className="text-xs text-emerald-200/90 mt-0.5">
                Enregistrement automatique vers l'onglet <strong className="text-white">« les depence »</strong>
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
          {/* 1. ID_Depense : automatique et unique */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="idDepense" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                1. ID Dépense (Automatique & Unique)
              </label>
              <button
                type="button"
                onClick={() => setIdDepense(generateId('DEP'))}
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
                id="idDepense"
                value={idDepense}
                readOnly
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed select-all"
              />
            </div>
          </div>

          {/* 2. Date_Depense */}
          <div>
            <label htmlFor="dateDepense" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              2. Date de la Dépense
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="date"
                id="dateDepense"
                value={dateDepense}
                onChange={(e) => setDateDepense(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
            </div>
          </div>

          {/* 3. Nom_Commercant : liste déroulante alimentée par LISTE_COMMERCANTS */}
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
                  <option value="">Aucun commerçant disponible</option>
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
          </div>

          {/* 4. Montant_Depense en FCFA */}
          <div>
            <label htmlFor="montantDepense" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              4. Montant de la Dépense (FCFA)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Coins className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="number"
                id="montantDepense"
                inputMode="numeric"
                min="0"
                step="50"
                placeholder="Ex: 5000"
                value={montantDepense}
                onChange={(e) => setMontantDepense(e.target.value)}
                required
                className="w-full pl-10 pr-16 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                FCFA
              </div>
            </div>
          </div>

          {/* 5. Motif_Depense : texte avec suggestions rapides */}
          <div>
            <label htmlFor="motifDepense" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              5. Motif de la Dépense
            </label>
            <div className="relative mb-2">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <FileText className="w-4 h-4 text-emerald-700" />
              </div>
              <input
                type="text"
                id="motifDepense"
                value={motifDepense}
                onChange={(e) => setMotifDepense(e.target.value)}
                placeholder="Ex: Transport livraison, Facture d'électricité, Achat emballages..."
                required
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-sm"
              />
            </div>

            {/* Quick motif suggestions */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1.5">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>Suggestions rapides (cliquez pour sélectionner) :</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_EXPENSE_MOTIFS.slice(0, 6).map((motif) => (
                  <button
                    key={motif}
                    type="button"
                    onClick={() => setMotifDepense(motif)}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition"
                  >
                    {motif}
                  </button>
                ))}
              </div>
            </div>
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
              disabled={isSubmitting || montantNum <= 0 || !motifDepense.trim()}
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
                  <span>ENREGISTRER DANS « LES DEPENCE »</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
