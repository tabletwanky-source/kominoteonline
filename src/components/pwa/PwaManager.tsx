import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, X, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaManager: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check standalone display mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Check for existing waiting worker
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setShowUpdateToast(true);
          }

          // Listen for new installed worker waiting
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowUpdateToast(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[SW] Registration failed:', err);
        });

      // Reload when the new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    // Listen for BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show subtle prompt if user hasn't dismissed it this session
      const dismissed = sessionStorage.getItem('kominote_pwa_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Update Application
  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      setShowUpdateToast(false);
    }
  };

  // Trigger Native Install Prompt
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('kominote_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* 1. Subtle PWA Update Banner */}
      {showUpdateToast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm w-[calc(100vw-40px)] bg-slate-900/95 border border-blue-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-tight">
                Mizajou Disponib
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Gen yon nouvo vèsyon Kominote Online ki disponib.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Mete Ajou
                </button>
                <button
                  type="button"
                  onClick={() => setShowUpdateToast(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Pita
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUpdateToast(false)}
              className="text-slate-400 hover:text-white p-1"
              aria-label="Fèmen"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Non-Aggressive Install Banner (When available & not installed) */}
      {showInstallBanner && !isStandalone && (
        <div className="fixed bottom-5 left-5 z-40 max-w-sm w-[calc(100vw-40px)] sm:w-auto bg-slate-900/95 border border-white/15 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div className="min-w-0 pr-1">
            <div className="text-xs font-bold text-white truncate">
              Enstale Kominote Online
            </div>
            <div className="text-[11px] text-slate-400 truncate">
              Aksè rapid sou aparèy ou
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer"
          >
            Enstale
          </button>
          <button
            type="button"
            onClick={handleDismissInstall}
            className="text-slate-400 hover:text-white p-1 shrink-0"
            aria-label="Fèmen notifikasyon enstalasyon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};
