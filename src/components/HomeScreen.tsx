import React from 'react';
import {
  ShoppingBag,
  PackagePlus,
  Wallet,
  Receipt,
  ArrowRight,
  ShieldCheck,
  Package,
  Users,
  CheckCircle2,
  Sparkles,
  Link2
} from 'lucide-react';
import { FormType, StockProduit, Commercant } from '../types';
import { RefreshCw, Clock, Database, CloudCheck, AlertTriangle } from 'lucide-react';

interface HomeScreenProps {
  onSelectForm: (type: FormType) => void;
  produitsEnStock: StockProduit[];
  commercants: Commercant[];
  hasWebAppUrl: boolean;
  onOpenSettings: () => void;
  onOpenAppsScriptGuide: () => void;
  pendingCount: number;
  onRefreshData?: () => void;
  onSyncPending?: () => void;
  isSyncing?: boolean;
  isSyncingQueue?: boolean;
  lastSyncFormatted?: string;
  lastSyncTimeAgo?: string;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectForm,
  produitsEnStock,
  commercants,
  hasWebAppUrl,
  onOpenSettings,
  onOpenAppsScriptGuide,
  pendingCount,
  onRefreshData,
  onSyncPending,
  isSyncing = false,
  isSyncingQueue = false,
  lastSyncFormatted,
  lastSyncTimeAgo
}) => {
  const cards = [
    {
      id: 'ventes' as FormType,
      number: '1',
      title: 'LES VENTES',
      description: 'Enregistrer une nouvelle vente avec vérification instantanée du stock disponible.',
      icon: ShoppingBag,
      sheetTarget: 'les vents',
      badge: `${produitsEnStock.length} produits en stock`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentColor: 'from-emerald-700 to-emerald-900',
      iconBg: 'bg-emerald-600 text-white',
      hoverBorder: 'hover:border-emerald-500'
    },
    {
      id: 'produits' as FormType,
      number: '2',
      title: 'LES PRODUITS',
      description: 'Ajouter ou référencer un produit, fixer le prix d\'achat et le prix de vente unitaire.',
      icon: PackagePlus,
      sheetTarget: 'les produit',
      badge: 'Création & Tarification',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentColor: 'from-emerald-800 to-teal-950',
      iconBg: 'bg-emerald-700 text-white',
      hoverBorder: 'hover:border-emerald-500'
    },
    {
      id: 'depenses' as FormType,
      number: '3',
      title: 'LES DÉPENSES',
      description: 'Déclarer les frais d\'exploitation : transport, boutique, électricité, fournitures.',
      icon: Wallet,
      sheetTarget: 'les depence',
      badge: 'Gestion des charges',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      accentColor: 'from-emerald-900 to-emerald-950',
      iconBg: 'bg-amber-700 text-white',
      hoverBorder: 'hover:border-emerald-500'
    },
    {
      id: 'factures' as FormType,
      number: '4',
      title: 'LES FACTURES / REÇUS',
      description: 'Enregistrer la réception des marchandises et actualiser automatiquement le stock.',
      icon: Receipt,
      sheetTarget: 'les factur',
      badge: 'Réceptions marchandises',
      badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
      accentColor: 'from-teal-900 to-emerald-950',
      iconBg: 'bg-teal-700 text-white',
      hoverBorder: 'hover:border-emerald-500'
    },
    {
      id: 'commercants' as FormType,
      number: '5',
      title: 'LISTE DES COMMERÇANTS',
      description: 'Ajouter un nouveau commerçant, consulter le répertoire et alimenter automatiquement les formulaires.',
      icon: Users,
      sheetTarget: 'liste_commercants',
      badge: `${commercants.length} commerçants enregistrés`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentColor: 'from-emerald-700 to-emerald-900',
      iconBg: 'bg-emerald-800 text-white',
      hoverBorder: 'hover:border-emerald-500'
    }
  ];

  return (
    <div className="py-6 sm:py-8 px-4 max-w-5xl mx-auto space-y-6">
      {/* Welcome / Context Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-700/60 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-44 h-44 rounded-full bg-emerald-500/10 pointer-events-none blur-xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-44 h-44 rounded-full bg-emerald-400/10 pointer-events-none blur-xl"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Collecte Directe Sans Intermédiaire
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Portail de Saisie Commerciale
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-5">
            Sélectionnez l'opération à effectuer. Chaque formulaire envoie vos données
            instantanément vers l'onglet dédié de votre classeur Google Sheets.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-700/60">
            <div className="flex items-center gap-2.5 bg-emerald-950/40 rounded-xl p-2.5 px-3 border border-emerald-700/40">
              <Package className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-emerald-300/80 block leading-tight">Stock disponible</span>
                <span className="text-sm font-bold text-white truncate block">
                  {produitsEnStock.length} produit{produitsEnStock.length > 1 ? 's' : ''} (&gt; 0)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-emerald-950/40 rounded-xl p-2.5 px-3 border border-emerald-700/40">
              <Users className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-emerald-300/80 block leading-tight">Commerçants</span>
                <span className="text-sm font-bold text-white truncate block">
                  {commercants.length} enregistré{commercants.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2.5 bg-emerald-950/40 rounded-xl p-2.5 px-3 border border-emerald-700/40">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-emerald-300/80 block leading-tight">Mode Stockage</span>
                <span className="text-sm font-bold text-white truncate block">
                  {hasWebAppUrl ? 'Google Sheets En Direct' : 'Préparation Locale'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Notice if Not Yet Configured */}
      {!hasWebAppUrl && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Link2 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Connexion Google Sheets à finaliser
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Vous pouvez déjà tester les 4 formulaires avec les données d'exemple. Pour envoyer
                les lignes directement dans votre fichier Google Sheets existant, collez le script fourni.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={onOpenAppsScriptGuide}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm transition"
            >
              Voir le script (gratuit)
            </button>
            <button
              onClick={onOpenSettings}
              className="text-xs font-semibold px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition"
            >
              Coller l'URL
            </button>
          </div>
        </div>
      )}

      {/* Barre de Synchronisation Bidirectionnelle Google Sheets */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 text-emerald-800">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasWebAppUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {hasWebAppUrl ? 'Synchronisation Google Sheets Active' : 'Mode Autonome (Données locales)'}
              </span>
              {lastSyncTimeAgo && hasWebAppUrl && (
                <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  {lastSyncTimeAgo}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Dernière actualisation : <strong className="text-slate-700 font-semibold">{lastSyncFormatted || 'Aucune actualisation encore effectuée'}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          {pendingCount > 0 && onSyncPending && (
            <button
              onClick={onSyncPending}
              disabled={isSyncingQueue}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingQueue ? 'animate-spin' : ''}`} />
              <span>Synchroniser la file ({pendingCount})</span>
            </button>
          )}

          {onRefreshData && (
            <button
              onClick={onRefreshData}
              disabled={isSyncing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer border border-emerald-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Actualisation...' : 'Actualiser les données'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 GRANDES CARTES OBLIGATOIRES */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
            Sélectionnez une opération de collecte
          </h3>
          <span className="text-xs text-slate-500">5 formulaires et tableaux</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            const isFullWidth = card.id === 'commercants';
            return (
              <button
                key={card.id}
                onClick={() => onSelectForm(card.id)}
                className={`group relative text-left bg-white rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-xl border-2 border-emerald-100/80 ${card.hoverBorder} ${isFullWidth ? 'md:col-span-2' : ''} transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.99]`}
              >
                {/* Top card bar accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.accentColor}`}></div>

                {/* Card Header with Big Icon and Badge */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                        <Icon className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Formulaire {card.number}
                        </span>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight group-hover:text-emerald-900 transition-colors mt-0.5">
                          {card.title}
                        </h4>
                      </div>
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">
                    {card.description}
                  </p>
                </div>

                {/* Card Footer: Target Sheet & Action Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span>Enregistre dans :</span>
                    <code className="font-mono text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200/60 font-semibold">
                      « {card.sheetTarget} »
                    </code>
                  </div>

                  <div className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 group-hover:text-emerald-900 group-hover:translate-x-1 transition-all">
                    <span>Ouvrir</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Security & Integrity Note */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs text-slate-600 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <p>
          <strong className="text-slate-800">Garantie d'intégrité des données :</strong> Chaque enregistrement est ajouté
          sur une <strong>nouvelle ligne</strong> sans jamais écraser vos données existantes.
          Les numéros d'enregistrement (IDs) sont générés automatiquement et uniques.
        </p>
      </div>
    </div>
  );
};
