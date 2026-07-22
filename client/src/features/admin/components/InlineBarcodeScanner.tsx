import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '../../../components/ui/Button';

interface InlineBarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export function InlineBarcodeScanner({ onScanSuccess, onClose }: InlineBarcodeScannerProps) {
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  const stopScanner = async () => {
    if (scannerRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('[InlineScanner Stop Error]', err);
      } finally {
        try {
          const videoElements = document.querySelectorAll<HTMLVideoElement>('#inline-scanner-reader video');
          videoElements.forEach((video) => {
            if (video.srcObject && 'getTracks' in (video.srcObject as MediaStream)) {
              (video.srcObject as MediaStream).getTracks().forEach((track) => track.stop());
            }
          });
        } catch (_) {}

        scannerRef.current = null;
        isStoppingRef.current = false;
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const elementId = 'inline-scanner-reader';

    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
          verbose: false,
        });

        scannerRef.current = scanner;
        isStoppingRef.current = false;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (viewWidth, viewHeight) => {
              const width = Math.min(viewWidth * 0.85, 280);
              const height = Math.min(viewHeight * 0.5, 140);
              return { width: Math.floor(width), height: Math.floor(height) };
            },
          },
          (decodedText) => {
            if (!isMounted) return;

            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate?.([80, 40, 80]);
              } catch (_) {}
            }

            stopScanner().then(() => {
              onScanSuccess(decodedText);
            });
          },
          () => {}
        );

        if (!isMounted) return;

        try {
          const capabilities = scanner.getRunningTrackCapabilities();
          if (capabilities && (capabilities as any).torch) {
            setHasTorchSupport(true);
          } else {
            setHasTorchSupport(false);
          }
        } catch (_) {
          setHasTorchSupport(false);
        }
      } catch (err: any) {
        console.error('[InlineScanner Start Error]', err);
        if (isMounted) {
          setErrorMsg('Error al iniciar la cámara: ' + (err?.message || err));
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, []);

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorchSupport) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error('[InlineScanner Torch Error]', err);
    }
  };

  return (
    <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-black border border-stone-800 flex flex-col justify-between select-none shadow-lg animate-fade-in">
      <style>{`
        #inline-scanner-reader {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
        }
        #inline-scanner-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
      `}</style>

      {/* html5-qrcode Video Container */}
      <div id="inline-scanner-reader" />

      {/* Viewfinder Visual Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
        <div className="absolute inset-0 border-[20px] sm:border-[30px] border-black/50 backdrop-blur-[0.5px] flex items-center justify-center">
          <div className="relative w-[85%] max-w-[260px] h-[130px] border-2 border-emerald-500/90 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] flex flex-col justify-between p-1.5">
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-emerald-400 rounded-tl" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-emerald-400 rounded-tr" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-emerald-400 rounded-bl" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-emerald-400 rounded-br" />

            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_10px_#34d399] animate-pulse my-auto" />
          </div>
        </div>
      </div>

      {/* Top Floating Badge */}
      <div className="relative z-20 flex items-center justify-between p-2.5 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-200">
            Escáners en vivo
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="absolute z-30 inset-x-3 top-1/2 -translate-y-1/2 bg-red-950/90 border border-red-500 text-red-100 p-3 rounded-lg text-center space-y-2 shadow-xl">
          <p className="text-xs font-medium">{errorMsg}</p>
          <Button
            variant="danger"
            size="sm"
            onClick={() => stopScanner().then(onClose)}
            className="w-full py-1 text-xs font-bold"
          >
            Cerrar
          </Button>
        </div>
      )}

      {/* Bottom Floating Controls */}
      <div className="relative z-20 p-2.5 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between gap-2">
        {hasTorchSupport ? (
          <button
            type="button"
            onClick={handleToggleTorch}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
              isTorchOn
                ? 'bg-amber-400 text-stone-950 border-amber-300'
                : 'bg-stone-900/90 text-stone-300 border-stone-700/80 hover:bg-stone-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Linterna
          </button>
        ) : (
          <div />
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={() => stopScanner().then(onClose)}
          className="text-[11px] py-1 px-3 border border-stone-700/80 text-stone-300 font-semibold rounded-lg hover:bg-stone-800"
        >
          Detener Escáner
        </Button>
      </div>
    </div>
  );
}
