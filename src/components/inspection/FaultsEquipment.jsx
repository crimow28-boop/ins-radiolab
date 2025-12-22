import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Package, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EQUIPMENT_OPTIONS = [
  { value: 'sealed_amplifier', label: 'מגבר אטום' },
  { value: 'dry_amplifier', label: 'מגבר יבש' },
  { value: 'bnc_cable', label: 'כבל BNC' },
  { value: 'bag', label: 'תיק' },
];

export default function FaultsEquipment({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const toggleEquipment = (value) => {
    const equipment = data.additional_equipment || [];
    if (equipment.includes(value)) {
      handleChange('additional_equipment', equipment.filter(e => e !== value));
    } else {
      handleChange('additional_equipment', [...equipment, value]);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">תקלות וציוד</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <FileText className="w-4 h-4" />
            תיאור תקלה
          </Label>
          <Textarea
            value={data.fault_description || ''}
            onChange={(e) => handleChange('fault_description', e.target.value)}
            placeholder='תאר את התקלה או כתוב "אין"'
            className="min-h-24 rounded-xl resize-none"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <Label className="flex items-center gap-2 text-slate-700">
            <RefreshCw className="w-4 h-4" />
            מכשיר הוחלף
          </Label>
          <Switch
            checked={data.device_replaced || false}
            onCheckedChange={(v) => handleChange('device_replaced', v)}
          />
        </div>

        <AnimatePresence>
          {data.device_replaced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label className="text-slate-700">מספר סידורי של מכשיר חלופי</Label>
              <Input
                value={data.replaced_device_serial || ''}
                onChange={(e) => handleChange('replaced_device_serial', e.target.value)}
                placeholder="הזן מספר סידורי"
                className="h-12 rounded-xl"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-100">
        <Label className="flex items-center gap-2 text-slate-700">
          <Package className="w-4 h-4" />
          ציוד נוסף שהתקבל
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EQUIPMENT_OPTIONS.map(({ value, label }) => (
            <div
              key={value}
              onClick={() => toggleEquipment(value)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                (data.additional_equipment || []).includes(value)
                  ? 'bg-blue-50 border-2 border-blue-200'
                  : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
              }`}
            >
              <Checkbox
                checked={(data.additional_equipment || []).includes(value)}
                className="pointer-events-none"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </div>
          ))}
        </div>
        <Input
          value={data.additional_equipment_other || ''}
          onChange={(e) => handleChange('additional_equipment_other', e.target.value)}
          placeholder="ציוד נוסף (טקסט חופשי)"
          className="h-12 rounded-xl"
        />
      </div>

      <div className="space-y-2 pt-4 border-t border-slate-100">
        <Label className="text-slate-700">הערות</Label>
        <Textarea
          value={data.remarks || ''}
          onChange={(e) => handleChange('remarks', e.target.value)}
          placeholder="הערות נוספות..."
          className="min-h-20 rounded-xl resize-none"
        />
      </div>
    </div>
  );
}