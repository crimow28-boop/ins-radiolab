import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SignaturePad from '@/components/ui/SignaturePad';
import { Truck, User, PenTool, Check, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeliverySection({ data, onChange }) {
  const [showPad, setShowPad] = useState(false);

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleSignatureSave = (signatureDataUrl) => {
    handleChange('delivery_signature', signatureDataUrl);
    setShowPad(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Truck className="w-5 h-5 text-orange-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">סטטוס מסירה</h3>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-slate-700">
          <Package className="w-4 h-4" />
          סטטוס
        </Label>
        <Select
          value={data.delivery_status || ''}
          onValueChange={(v) => handleChange('delivery_status', v)}
        >
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="בחר סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="delivered">נמסר</SelectItem>
            <SelectItem value="not_delivered">לא נמסר</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {data.delivery_status === 'delivered' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4" />
                שם החייל המקבל
              </Label>
              <Input
                value={data.delivery_soldier_name || ''}
                onChange={(e) => handleChange('delivery_soldier_name', e.target.value)}
                placeholder="הזן שם חייל"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-700">חתימת קבלה</Label>
              
              {data.delivery_signature ? (
                <div className="space-y-3">
                  <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 flex items-center justify-center">
                    <img 
                      src={data.delivery_signature} 
                      alt="חתימה" 
                      className="max-h-20"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">חתימה נשמרה</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleChange('delivery_signature', null)}
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
                      className="w-full h-20 border-dashed border-2 rounded-xl"
                    >
                      <PenTool className="w-5 h-5 ml-2" />
                      לחץ לחתימה
                    </Button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <SignaturePad
                        onSave={handleSignatureSave}
                        onClear={() => {}}
                      />
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}