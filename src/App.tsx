/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FormType, Commercant, StockProduit, PendingSubmission } from './types';
import { GoogleSheetsService } from './services/googleSheetsService';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { FormVente } from './components/FormVente';
import { FormProduit } from './components/FormProduit';
import { FormDepense } from './components/FormDepense';
import { FormFacture } from './components/FormFacture';
import { FormCommercant } from './components/FormCommercant';
import { SuccessView } from './components/SuccessView';
import { AppsScriptModal } from './components/AppsScriptModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const service = GoogleSheetsService.getInstance();

  // Navigation State
  const [currentView, setCurrentView] = useState<FormType>('home');
  const [lastFormType, setLastFormType] = useState<FormType>('ventes');
  const [successInfo, setSuccessInfo] = useState<{
    title: string;
    targetSheet: string;
    details: Array<{ label: string; value: string }>;
  } | null>(null);

  // Data State
  const [webAppUrl, setWebAppUrl] = useState<string>(() => service.getWebAppUrl());
  const [commercants, setCommercants] = useState<Commercant[]>(() => service.getCommercants());
  const [stockProduits, setStockProduits] = useState<StockProduit[]>(() => service.getAllStockProduits());
  const [pendingQueue, setPendingQueue] = useState<PendingSubmission[]>(() => service.getPendingQueue());
  const [history, setHistory] = useState<any[]>(() => service.getHistory());

  // UI Modals State
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [lastSyncFormatted, setLastSyncFormatted] = useState<string>(() => service.getLastSyncFormatted());
  const [lastSyncTimeAgo, setLastSyncTimeAgo] = useState<string>(() => service.getLastSyncTimeAgo());

  const [connectionFeedback, setConnectionFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    details?: any;
    errorType?: string;
  }>({ status: 'idle', message: '' });

  // Rafraîchir les listes locales depuis le service
  const refreshLocalState = useCallback(() => {
    setCommercants(service.getCommercants());
    setStockProduits(service.getAllStockProduits());
    setPendingQueue(service.getPendingQueue());
    setHistory(service.getHistory());
    setWebAppUrl(service.getWebAppUrl());
    setLastSyncFormatted(service.getLastSyncFormatted());
    setLastSyncTimeAgo(service.getLastSyncTimeAgo());
  }, [service]);

  // Synchronisation distante depuis Google Sheets
  const handleRefreshRemote = async () => {
    setIsSyncing(true);
    try {
      const res = await service.fetchRemoteData();
      refreshLocalState();
      setConnectionFeedback({
        status: res.success ? 'success' : 'error',
        message: res.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // C. Actualisation automatique à l'ouverture, périodique et lors de reconnexion Internet
  useEffect(() => {
    // 1. Actualisation à l'ouverture de l'application
    if (service.getWebAppUrl() && navigator.onLine) {
      service.fetchRemoteData()
        .then(() => refreshLocalState())
        .catch(err => console.warn('Échec actualisation initiale :', err));
    }

    // 2. Actualisation périodique toutes les 60 secondes si l'application est ouverte et connectée
    const periodicInterval = setInterval(() => {
      if (service.getWebAppUrl() && navigator.onLine) {
        service.fetchRemoteData()
          .then(() => refreshLocalState())
          .catch(err => console.warn('Échec actualisation périodique :', err));
      }
      setLastSyncTimeAgo(service.getLastSyncTimeAgo());
    }, 60000);

    // Mettre à jour l'affichage de temps relatif toutes les 15 secondes
    const timeAgoInterval = setInterval(() => {
      setLastSyncTimeAgo(service.getLastSyncTimeAgo());
    }, 15000);

    // 3. Détection de reconnexion internet : envoi de la file puis actualisation des données
    const handleOnline = () => {
      if (service.getWebAppUrl()) {
        service.syncAll()
          .then(() => refreshLocalState())
          .catch(err => console.warn('Échec synchronisation reconnexion :', err));
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(periodicInterval);
      clearInterval(timeAgoInterval);
      window.removeEventListener('online', handleOnline);
    };
  }, [service, refreshLocalState]);

  // Test de connexion direct avec diagnostic complet
  const handleTestConnection = async (customUrl?: string) => {
    setIsTestingUrl(true);
    setConnectionFeedback({ status: 'idle', message: '' });
    try {
      const res = await service.testConnection(customUrl);
      refreshLocalState();
      setConnectionFeedback({
        status: res.success ? 'success' : 'error',
        message: res.message,
        details: res.details,
        errorType: res.errorType
      });
      return res;
    } finally {
      setIsTestingUrl(false);
    }
  };

  // Synchronisation de la file hors-ligne (Garantie de confirmation réelle)
  const handleSyncPending = async () => {
    setIsSyncingQueue(true);
    try {
      const res = await service.syncPendingQueue();
      refreshLocalState();
      if (res.synced > 0 && res.remaining === 0) {
        setConnectionFeedback({
          status: 'success',
          message: `Félicitations ! Les ${res.synced} enregistrement(s) ont été confirmés et ajoutés dans Google Sheets.`
        });
      } else if (res.synced > 0 && res.remaining > 0) {
        setConnectionFeedback({
          status: 'success',
          message: `${res.synced} enregistrement(s) synchronisé(s). Il reste ${res.remaining} élément(s) en attente.`
        });
      } else {
        const firstError = res.errors.length > 0 ? res.errors[0].error : 'Erreur de transmission';
        setConnectionFeedback({
          status: 'error',
          message: `La synchronisation n'a pas pu aboutir pour les ${res.remaining} élément(s) : ${firstError}`
        });
      }
    } finally {
      setIsSyncingQueue(false);
    }
  };

  // Sauvegarde de l'URL Google Apps Script
  const handleSaveUrl = (url: string) => {
    service.setWebAppUrl(url);
    setWebAppUrl(url);
  };

  // Gestion des soumissions
  const handleSuccessScreen = (summary: {
    title: string;
    details: Array<{ label: string; value: string }>;
    targetSheet: string;
  }) => {
    refreshLocalState();
    setSuccessInfo(summary);
  };

  // Navigation vers un formulaire avec actualisation des listes déroulantes
  const handleSelectForm = (type: FormType) => {
    setLastFormType(type);
    setCurrentView(type);
    setSuccessInfo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Actualiser les listes déroulantes lorsqu'on ouvre les formulaires
    if (service.getWebAppUrl() && navigator.onLine) {
      service.fetchRemoteData()
        .then(() => refreshLocalState())
        .catch(err => console.warn('Actualisation ouverture formulaire :', err));
    }
  };

  // Retour à l'accueil
  const handleGoHome = () => {
    setCurrentView('home');
    setSuccessInfo(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLastSyncTimeAgo(service.getLastSyncTimeAgo());
  };

  // Nouvel enregistrement
  const handleNewRecord = () => {
    setSuccessInfo(null);
    setCurrentView(lastFormType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Produits dont le stock restant est STRICTEMENT > 0
  const produitsEnStockStrict = stockProduits.filter(p => p.stockRestant > 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white antialiased">
      {/* 1. Header Global */}
      <Header
        hasWebAppUrl={Boolean(webAppUrl)}
        isSyncing={isSyncing}
        onRefreshData={handleRefreshRemote}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAppsScriptGuide={() => setIsAppsScriptModalOpen(true)}
        pendingCount={pendingQueue.length}
        lastSyncFormatted={lastSyncFormatted}
        lastSyncTimeAgo={lastSyncTimeAgo}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Écran de succès après enregistrement */}
        {successInfo ? (
          <SuccessView
            title={successInfo.title}
            targetSheet={successInfo.targetSheet}
            details={successInfo.details}
            onNewRecord={handleNewRecord}
            onGoHome={handleGoHome}
          />
        ) : (
          <>
            {/* PAGE D'ACCUEIL AVEC LES 4 GRANDS BOUTONS */}
            {currentView === 'home' && (
              <HomeScreen
                onSelectForm={handleSelectForm}
                produitsEnStock={produitsEnStockStrict}
                commercants={commercants}
                hasWebAppUrl={Boolean(webAppUrl)}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
                onOpenAppsScriptGuide={() => setIsAppsScriptModalOpen(true)}
                pendingCount={pendingQueue.length}
                onRefreshData={handleRefreshRemote}
                onSyncPending={handleSyncPending}
                isSyncing={isSyncing}
                isSyncingQueue={isSyncingQueue}
                lastSyncFormatted={lastSyncFormatted}
                lastSyncTimeAgo={lastSyncTimeAgo}
              />
            )}

            {/* FORMULAIRE 1 : LES VENTES */}
            {currentView === 'ventes' && (
              <FormVente
                commercants={commercants}
                produitsEnStock={produitsEnStockStrict}
                onBack={handleGoHome}
                onSubmit={async (payload) => {
                  const res = await service.submitVente(payload);
                  refreshLocalState();
                  return res;
                }}
                onSuccess={handleSuccessScreen}
              />
            )}

            {/* FORMULAIRE 2 : LES PRODUITS */}
            {currentView === 'produits' && (
              <FormProduit
                onBack={handleGoHome}
                onSubmit={async (payload) => {
                  const res = await service.submitProduit(payload);
                  refreshLocalState();
                  return res;
                }}
                onSuccess={handleSuccessScreen}
              />
            )}

            {/* FORMULAIRE 3 : LES DÉPENSES */}
            {currentView === 'depenses' && (
              <FormDepense
                commercants={commercants}
                onBack={handleGoHome}
                onSubmit={async (payload) => {
                  const res = await service.submitDepense(payload);
                  refreshLocalState();
                  return res;
                }}
                onSuccess={handleSuccessScreen}
              />
            )}

            {/* FORMULAIRE 4 : LES FACTURES / REÇUS */}
            {currentView === 'factures' && (
              <FormFacture
                stockProduits={stockProduits}
                onBack={handleGoHome}
                onSubmit={async (payload) => {
                  const res = await service.submitFacture(payload);
                  refreshLocalState();
                  return res;
                }}
                onSuccess={handleSuccessScreen}
              />
            )}

            {/* FORMULAIRE 5 : LISTE DES COMMERÇANTS */}
            {currentView === 'commercants' && (
              <FormCommercant
                commercants={commercants}
                onBack={handleGoHome}
                onSubmit={async (payload) => {
                  const res = await service.submitCommercant(payload);
                  refreshLocalState();
                  return res;
                }}
                onSuccess={handleSuccessScreen}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Footer Bar */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Collecte Commerciale • Connectée à Google Sheets (onglets : <em>les vents, les produit, les depence, les factur, liste_commercants</em>)
          </span>
          <button
            onClick={() => setIsAppsScriptModalOpen(true)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
          >
            Guide d'installation Google Apps Script (Gratuit)
          </button>
        </div>
      </footer>

      {/* 4. Modales */}
      <AppsScriptModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        webAppUrl={webAppUrl}
        onSaveUrl={handleSaveUrl}
        onTestConnection={handleTestConnection}
        isTesting={isTestingUrl}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        webAppUrl={webAppUrl}
        onSaveUrl={handleSaveUrl}
        onTestConnection={handleTestConnection}
        isTesting={isTestingUrl}
        pendingQueue={pendingQueue}
        onSyncPending={handleSyncPending}
        isSyncingQueue={isSyncingQueue}
        history={history}
        onClearHistory={() => {
          service.clearHistory();
          refreshLocalState();
        }}
        onResetDemoData={() => {
          service.resetToDefaultDemo();
          refreshLocalState();
        }}
        connectionFeedback={connectionFeedback}
      />
    </div>
  );
}
