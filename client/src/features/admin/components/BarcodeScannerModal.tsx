import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, type CameraDevice } from 'html5-qrcode';
import { Button } from '../../../components/ui/Button';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  // Fetch cameras on open
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);

          // Buscar preferentemente la cámara trasera principal (evitando ultrawide/0.5x/front)
          const preferredRear = devices.find((device) => {
            const label = device.label.toLowerCase();
            const isRear = label.includes('back') || label.includes('rear') || label.includes('trasera') || label.includes('0');
            const isUltraWide = label.includes('ultra') || label.includes('wide') || label.includes('0.5') || label.includes('macro');
            return isRear && !isUltraWide;
          }) || devices.find((device) => {
            const label = device.label.toLowerCase();
            return !label.includes('front') && !label.includes('selfie');
          }) || devices[0];

          setSelectedCameraId(preferredRear.id);
        } else {
          setErrorMsg('No se detectaron cámaras en tu dispositivo.');
        }
      })
      .catch((err) => {
        console.error('[getCameras Error]', err);
        setErrorMsg('No se pudo acceder a la lista de cámaras. Verificá los permisos del navegador.');
      });
  }, [isOpen]);

  // Start scanner lifecycle
  useEffect(() => {
    let isMounted = true;
    if (!isOpen) return;

    const elementId = 'fullscreen-scanner-reader';

    const timer = setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13],
          verbose: false,
        });

        scannerRef.current = scanner;
        isStoppingRef.current = false;

        const cameraConfig = selectedCameraId
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' };

        await scanner.start(
          cameraConfig,
          {
            fps: 15,
            qrbox: (viewWidth, viewHeight) => {
              const width = Math.min(viewWidth * 0.85, 340);
              const height = Math.min(viewHeight * 0.45, 180);
              return { width: Math.floor(width), height: Math.floor(height) };
            },
          },
          (decodedText) => {
            if (!isMounted) return;

            // Vibración háptica al escanear
            if (typeof window !== 'undefined' && 'vibrate' in navigator) {
              try {
                navigator.vibrate?.([80, 40, 80]);
              } catch (_) {}
            }

            // Detener y retornar
            stopScanner().then(() => {
              onScanSuccess(decodedText);
              onClose();
            });
          },
          () => {}
        );

        // Check torch support
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
        console.error('[Scanner Start Error]', err);
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
  }, [isOpen, selectedCameraId]);

  const stopScanner = async () => {
    if (scannerRef.current && !isStoppingRef.current) {
      isStoppingRef.current = true;
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error('[Scanner Stop Error]', err);
      } finally {
        scannerRef.current = null;
        isStoppingRef.current = false;
      }
    }
  };

  const handleToggleTorch = async () => {
    if (!scannerRef.current || !hasTorchSupport) return;
    try {
      const nextState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error('[Torch Toggle Error]', err);
    }
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    stopScanner().then(() => {
      setSelectedCameraId(newId);
      setIsTorchOn(false);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-stone-100 flex flex-col justify-between overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-bold tracking-wide uppercase font-serif">
            Escáner de Código EAN-13
          </h2>
        </div>
        <button
          type="button"
          onClick={() => {
            stopScanner().then(onClose);
          }}
          className="p-2 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-200 transition-colors cursor-pointer"
          title="Cerrar escáner"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main Viewport Container */}
      <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
        <div id="fullscreen-scanner-reader" className="w-full h-full object-cover" />

        {/* HUD Scanner Visual Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
          {/* Top/Bottom Dark Backdrop */}
          <div className="absolute top-0 left-0 right-0 bottom-0 border-[40px] sm:border-[80px] border-black/60 backdrop-blur-[1px] flex items-center justify-center">
            {/* Center Frame */}
            <div className="relative w-[85%] max-w-[340px] h-[180px] border-2 border-emerald-500/80 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] flex flex-col justify-between p-2">
              {/* Corner crosshairs */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br" />

              {/* Animated Laser Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-pulse my-auto" />
            </div>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 text-center px-4">
            <p className="text-xs font-semibold text-stone-200 bg-stone-900/80 backdrop-blur px-4 py-2 rounded-full border border-stone-700/60 shadow-lg">
              Alineá el código de barras dentro del recuadro verde
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="absolute z-30 inset-x-6 top-1/2 -translate-y-1/2 bg-red-950/90 border border-red-500 text-red-100 p-6 rounded-2xl text-center space-y-4 shadow-2xl">
            <svg className="w-10 h-10 text-red-400 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <p className="text-sm font-medium">{errorMsg}</p>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                stopScanner().then(onClose);
              }}
              className="w-full py-2 font-bold"
            >
              Cerrar
            </Button>
          </div>
        )}
      </div>

      {/* Footer Toolbar: Controls */}
      <div className="relative z-20 p-4 bg-stone-900/90 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Selector de Cámaras */}
        {cameras.length > 1 ? (
          <div className="w-full sm:w-auto flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            </svg>
            <select
              value={selectedCameraId}
              onChange={handleCameraChange}
              className="flex-1 bg-stone-800 border border-stone-700 text-stone-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {cameras.map((cam, idx) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `Cámara ${idx + 1}`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xs text-stone-400">
            Cámara activa: Standard
          </div>
        )}

        {/* Linterna / Cancelar */}
        <div className="w-full sm:w-auto flex items-center justify-end gap-2">
          {hasTorchSupport && (
            <button
              type="button"
              onClick={handleToggleTorch}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isTorchOn
                  ? 'bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                  : 'bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Linterna {isTorchOn ? 'ON' : 'OFF'}
            </button>
          )}

          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              stopScanner().then(onClose);
            }}
            className="text-xs py-2 px-4 border border-stone-700 text-stone-300 font-semibold"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
