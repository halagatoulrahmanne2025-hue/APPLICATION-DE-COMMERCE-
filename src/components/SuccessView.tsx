import React from 'react';
import {
  CheckCircle2,
  PlusCircle,
  Home,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

interface SuccessDetail {
  label: string;
  value: string;
}

interface SuccessViewProps {
  title: string;
  targetSheet: string;
  details: SuccessDetail[];
  onNewRecord: () => void;
  onGoHome: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  title,
  targetSheet,
  details,
  onNewRecord,
  onGoHome
}) => {
  return (
    <div className="py-8 sm:py-12 px-4 max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border-2 border-emerald-100 p-6 sm:p-8 text-center space-y-6">
        {/* Animated Green Badge */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 stroke-[2.5]" />
        </div>

        {/* Title & Status */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Ligne ajoutée dans : <strong className="font-mono">« {targetSheet} »</strong>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Votre enregistrement a été validé et envoyé à votre classeur Google Sheets.
            Aucune ancienne donnée n'a été écrasée.
          </p>
        </div>

        {/* Summary Card / Receipt */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-200">
            Récapitulatif de l'opération
          </div>
          {details.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs sm:text-sm py-1 border-b border-slate-100 last:border-0">
              <span className="text-slate-500 font-medium">{item.label} :</span>
              <span className="text-slate-900 font-bold font-mono text-right truncate max-w-[220px]">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onNewRecord}
            className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>EFFECTUER UN NOUVEL ENREGISTREMENT</span>
          </button>

          <button
            onClick={onGoHome}
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm border border-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Home className="w-4 h-4 text-emerald-800" />
            <span>RETOUR À L'ACCUEIL</span>
          </button>
        </div>
      </div>
    </div>
  );
};
