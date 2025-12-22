import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BarcodeScanner({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setError(null);

      const html5QrCode = new Html5Qrcode("barcode-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // סריקה נכשלה - זה נורמלי כשאין ברקוד בתמונה
        }
      );
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError('לא ניתן להפעיל את המצלמה. אנא בדוק הרשאות.');
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-6 max-w-lg w-full"
          dir="rtl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">סריקת ברקוד</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-600">{error}</p>
              <Button onClick={handleClose} className="mt-4">סגור</Button>
            </div>
          ) : (
            <>
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden mb-4">
                <div id="barcode-reader" className="w-full"></div>
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-center text-sm text-slate-500">
                מרכז את הברקוד במסגרת לסריקה אוטומטית
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}