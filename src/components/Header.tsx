import React from 'react';
import {
  FileSpreadsheet,
  Settings,
  Code2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface HeaderProps {
  hasWebAppUrl: boolean;
  isSyncing: boolean;
  onRefreshData: () => void;
  onOpenSettings: () => void;
  onOpenAppsScriptGuide: () => void;
  pendingCount: number;
  lastSyncFormatted?: string;
  lastSyncTimeAgo?: string;
}

export const Header: React.FC<HeaderProps> = ({
  hasWebAppUrl,
  isSyncing,
  onRefreshData,
  onOpenSettings,
  onOpenAppsScriptGuide,
  pendingCount,
  lastSyncFormatted,
  lastSyncTimeAgo
}) => {
  return (
    <header className="bg-emerald-900 text-white shadow-md sticky top-0 z-30 border-b border-emerald-800">
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
        {/* Logo and Titles */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-700/80 border border-emerald-500/50 flex items-center justify-center shrink-0 shadow-inner">
            <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white truncate flex items-center gap-2">
              Collecte Commerciale
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-700 px-2 py-0.5 rounded-full text-emerald-100 border border-emerald-600">
                Google Sheets
              </span>
            </h1>
            <p className="text-xs text-emerald-200/90 truncate hidden sm:block">
              Saisie directe pour commerçants • Synchronisation bidirectionnelle
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Connection Status Badge */}
          <button
            onClick={onOpenSettings}
            title={hasWebAppUrl ? 'Connecté à Google Apps Script' : 'Mode Démo (Cliquez pour lier Google Sheets)'}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
              hasWebAppUrl
                ? 'bg-emerald-800/80 border-emerald-600 text-emerald-100 hover:bg-emerald-800'
                : 'bg-amber-900/60 border-amber-600/80 text-amber-200 hover:bg-amber-900/80'
            }`}
          >
            {hasWebAppUrl ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline font-medium">Sheets Relié</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline font-medium">Lier Sheets</span>
              </>
            )}
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-amber-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full ml-1" title={`${pendingCount} enregistrement(s) dans la file hors-ligne`}>
                {pendingCount}
              </span>
            )}
          </button>

          {/* Bouton Actualiser les données Google Sheets */}
          <button
            onClick={onRefreshData}
            disabled={isSyncing}
            title={`Actualiser commerçants et stocks depuis Google Sheets\nDernière synchro : ${lastSyncFormatted || 'Aucune'}`}
            aria-label="Actualiser les données depuis Google Sheets"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-800/90 hover:bg-emerald-700 text-emerald-100 hover:text-white border border-emerald-600 shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-300' : 'text-emerald-300'}`} />
            <span className="hidden sm:inline font-medium">
              {isSyncing ? 'Actualisation...' : 'Actualiser'}
            </span>
          </button>

          {/* Apps Script Guide Button */}
          <button
            onClick={onOpenAppsScriptGuide}
            title="Code Google Apps Script & Guide"
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium border border-emerald-400 shadow-sm transition"
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Script & Guide</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            title="Paramètres de connexion"
            aria-label="Paramètres de connexion"
            className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 hover:text-white border border-emerald-700 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
