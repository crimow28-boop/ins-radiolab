import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SignaturePad from '@/components/ui/SignaturePad';
import { PenTool, User, Hash, ShieldCheck, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignatureSection({ data, onChange, type = 'soldier' }) {
  const [showPad, setShowPad] = useState(false);
  const isSupervisor = type === 'supervisor';
  const fieldPrefix = isSupervisor ? 'supervisor_signature' : 'soldier_signature';
  const signatureData = data[fieldPrefix] || {};

  const handleChange = (field, value) => {
    onChange({
      ...data,
      [fieldPrefix]: { ...signatureData, [field]: value }
    });
  };

  const handleSignatureSave = (signatureDataUrl) => {
    handleChange('signature_data', signatureDataUrl);
    setShowPad(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          isSupervisor ? 'bg-indigo-100' : 'bg-teal-100'
        }`}>
          <PenTool className={`w-5 h-5 ${isSupervisor ? 'text-indigo-600' : 'text-teal-600'}`} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">
          {isSupervisor ? 'חתימת מפקח' : 'חתימת חייל'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4" />
            שם מלא
          </Label>
          <Input
            value={signatureData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="הזן שם מלא"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <Hash className="w-4 h-4" />
            מספר אישי
          </Label>
          <Input
            value={signatureData.personal_number || ''}
            onChange={(e) => handleChange('personal_number', e.target.value)}
            placeholder="הזן מספר אישי"
            className="h-12 rounded-xl"
          />
        </div>
      </div>

      {isSupervisor && (
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <ShieldCheck className="w-4 h-4" />
            קוד אישור
          </Label>
          <Input
            value={signatureData.approval_code || ''}
            onChange={(e) => handleChange('approval_code', e.target.value)}
            placeholder="הזן קוד אישור חד פעמי"
            className="h-12 rounded-xl"
            type="password"
          />
        </div>
      )}

      <div className="space-y-3">
        <Label className="text-slate-700">חתימה דיגיטלית</Label>
        
        {signatureData.signature_data ? (
          <div className="space-y-3">
            <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-center">
              <img 
                src={signatureData.signature_data} 
                alt="חתימה" 
                className="max-h-24"
              />
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm">חתימה נשמרה בהצלחה</span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleChange('signature_data', null)}
              className="w-full"
            >
              החלף חתימה
            </Button>
          </div>
        ) : (
          <>
            {!showPad ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPad(true)}
                className="w-full h-24 border-dashed border-2 rounded-xl"
              >
                <PenTool className="w-5 h-5 ml-2" />
                לחץ לחתימה
              </Button>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <SignaturePad
                    onSave={handleSignatureSave}
                    onClear={() => {}}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </div>
  );
}