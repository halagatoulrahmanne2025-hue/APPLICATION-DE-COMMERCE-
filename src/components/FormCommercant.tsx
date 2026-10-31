import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Send,
  AlertCircle,
  Hash,
  Phone,
  FileText,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Building2
} from 'lucide-react';
import { Commercant, CommercantPayload } from '../types';

interface FormCommercantProps {
  commercants: Commercant[];
  onBack: () => void;
  onSubmit: (payload: CommercantPayload) => Promise<{ success: boolean; message: string; queued?: boolean }>;
  onSuccess: (summary: { title: string; details: Array<{ label: string; value: string }>; targetSheet: string }) => void;
}

export const FormCommercant: React.FC<FormCommercantProps> = ({
  commercants,
  onBack,
  onSubmit,
  onSuccess
}) => {
  // Calcul du prochain numéro
  const nextNumero = useMemo(() => {
    return commercants.length + 1;
  }, [commercants]);

  // États du formulaire d'ajout
  const [numero] = useState<number>(nextNumero);
  const [nomPrenom, setNomPrenom] = useState<string>('');
  const [telephone, setTelephone] = useState<string>('');
  const [observation, setObservation] = useState<string>('');

  // État de recherche pour la liste existante
  const [searchQuery, setSearchQuery] = useState<string>('');

  // États d'envoi et d'erreur
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Vérification de doublon en temps réel (insensible à la casse et aux espaces)
  const isDuplicate = useMemo(() => {
    const cleanInput = nomPrenom.trim().toLowerCase();
    if (!cleanInput) return false;
    return commercants.some(c => (c.nom || c.nomPrenom || '').trim().toLowerCase() === cleanInput);
  }, [nomPrenom, commercants]);

  // Filtrage des commerçants existants selon la recherche
  const filteredCommercants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return commercants;
    return commercants.filter(c => {
      const name = (c.nom || c.nomPrenom || '').toLowerCase();
      const phone = (c.telephone || '').toLowerCase();
      const obs = (c.observation || c.boutique || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || obs.includes(q);
    });
  }, [commercants, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = nomPrenom.trim();

    if (!cleanName) {
      setErrorMessage("Le nom et prénom du commerçant est obligatoire.");
      return;
    }

    if (isDuplicate) {
      setErrorMessage(`Le commerçant « ${cleanName} » existe déjà dans la liste. Les doublons ne sont pas autorisés.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CommercantPayload = {
        numero,
        nomPrenom: cleanName,
        telephone: telephone.trim(),
        observation: observation.trim()
      };

      const result = await onSubmit(payload);

      if (result.success) {
        onSuccess({
          title: "Commerçant Enregistré avec Succès",
          targetSheet: "liste_commercants",
          details: [
            { label: "N° attribué", value: `N° ${numero}` },
            { label: "Nom et prénom", value: cleanName },
            { label: "Téléphone", value: telephone.trim() || "Non renseigné" },
            { label: "Observation", value: observation.trim() || "Aucune observation" },
            { label: "Impact immédiat", value: "Disponible dans Ventes & Dépenses" }
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
    <div className="py-6 sm:py-8 px-4 max-w-4xl mx-auto space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition border border-emerald-200 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETOUR À L'ACCUEIL</span>
        </button>

        <span className="text-xs font-mono font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md border border-emerald-300">
          Feuille : « liste_commercants »
        </span>
      </div>

      {/* Grid: Formulaire d'ajout + Liste des commerçants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulaire d'ajout (Gauche / 6 ou 7 colonnes) */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-lg border-2 border-emerald-100 overflow-hidden flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="bg-emerald-900 text-white p-5 border-b border-emerald-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shrink-0">
                  <UserPlus className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Nouveau Commerçant</h2>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Enregistrement dans l'onglet <strong className="text-white">« liste_commercants »</strong>
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-600 text-emerald-100">
                N° {nextNumero}
              </span>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="m-5 mb-0 p-3.5 bg-rose-50 border-l-4 border-rose-500 rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div className="text-xs text-rose-900 font-medium whitespace-pre-line">
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Anti-Duplicate Live Warning */}
            {isDuplicate && (
              <div className="m-5 mb-0 p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900 font-semibold">
                  Attention : Un commerçant portant exactement ce nom existe déjà. Veuillez préciser son prénom ou un signe distinctif pour éviter les doublons.
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {/* 1. N° automatique */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  1. Numéro (N°)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4 text-emerald-700" />
                  </div>
                  <input
                    type="text"
                    value={`N° ${numero}`}
                    readOnly
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Numérotation incrémentielle automatique dans le tableau.
                </p>
              </div>

              {/* 2. Nom et prénom du commerçant */}
              <div>
                <label htmlFor="nomPrenom" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  2. Nom et Prénom du Commerçant *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Users className="w-4 h-4 text-emerald-700" />
                  </div>
                  <input
                    type="text"
                    id="nomPrenom"
                    value={nomPrenom}
                    onChange={(e) => setNomPrenom(e.target.value)}
                    placeholder="Ex: Mamadou Bah, Aminata Diallo..."
                    required
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border ${
                      isDuplicate ? 'border-amber-400 ring-2 ring-amber-100' : 'border-slate-300 focus:ring-2 focus:ring-emerald-600'
                    } rounded-xl text-sm font-semibold text-slate-800 focus:outline-none shadow-sm`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Ce nom apparaîtra immédiatement dans les menus déroulants des ventes et dépenses.
                </p>
              </div>

              {/* 3. Téléphone */}
              <div>
                <label htmlFor="telephone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  3. Téléphone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4 text-emerald-700" />
                  </div>
                  <input
                    type="tel"
                    id="telephone"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="Ex: +221 77 123 45 67, 07 89 12 34..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm"
                  />
                </div>
              </div>

              {/* 4. Observation */}
              <div>
                <label htmlFor="observation" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  4. Observation (Facultatif)
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3.5 pointer-events-none text-slate-400">
                    <FileText className="w-4 h-4 text-emerald-700" />
                  </div>
                  <textarea
                    id="observation"
                    rows={2}
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Ex: Boutique n°12 au grand marché, Grossiste alimentation, Dépôt central..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-sm resize-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !nomPrenom.trim() || isDuplicate}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enregistrement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ENREGISTRER DANS « LISTE_COMMERCANTS »</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sync indicator */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Chaque ajout enrichit automatiquement les listes déroulantes de toute l'application.</span>
          </div>
        </div>

        {/* Liste des commerçants déjà enregistrés (Droite / 5 colonnes) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-lg border-2 border-emerald-100 p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                Commerçants Enregistrés
              </h3>
              <p className="text-[11px] text-slate-500">
                {commercants.length} commerçant{commercants.length > 1 ? 's' : ''} actif{commercants.length > 1 ? 's' : ''}
              </p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
              {commercants.length}
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Rechercher par nom, téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Cards List */}
          <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
            {filteredCommercants.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                {searchQuery ? "Aucun commerçant ne correspond à votre recherche." : "Aucun commerçant enregistré pour le moment."}
              </div>
            ) : (
              filteredCommercants.map((c, idx) => {
                const displayName = c.nomPrenom || c.nom;
                const num = c.numero || (idx + 1);
                const displayObs = c.observation || c.boutique;

                return (
                  <div
                    key={`${displayName}-${idx}`}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 hover:border-emerald-300 transition space-y-1.5 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {num}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 group-hover:text-emerald-950">
                          {displayName}
                        </h4>
                      </div>

                      <span className="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                        Actif
                      </span>
                    </div>

                    {c.telephone && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 pl-8">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{c.telephone}</span>
                      </div>
                    )}

                    {displayObs && (
                      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pl-8">
                        <Building2 className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                        <span className="italic truncate">{displayObs}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
