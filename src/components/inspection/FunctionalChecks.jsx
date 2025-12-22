import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield, Radio, Cable, MessageSquare, Battery, CheckCircle, XCircle } from 'lucide-react';

const CHECKS = [
  { key: 'encryption_check', label: 'הצפנה', icon: Shield },
  { key: 'frequencies_check', label: 'תדרים', icon: Radio },
  { key: 'side_connector_closed', label: 'מחבר צד סגור', icon: Cable },
  { key: 'communication_test', label: 'בדיקת קשר', icon: MessageSquare },
  { key: 'battery_replaced', label: 'סוללה הוחלפה', icon: Battery },
];

export default function FunctionalChecks({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">בדיקות תפקוד</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHECKS.map(({ key, label, icon: Icon }) => (
          <div
            key={key}
            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
              data[key] 
                ? 'bg-green-50 border-2 border-green-200' 
                : 'bg-slate-50 border-2 border-transparent'
            }`}
          >
            <Label className="flex items-center gap-3 text-slate-700 cursor-pointer">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                data[key] ? 'bg-green-200' : 'bg-slate-200'
              }`}>
                <Icon className={`w-4 h-4 ${data[key] ? 'text-green-700' : 'text-slate-500'}`} />
              </div>
              {label}
            </Label>
            <div className="flex items-center gap-2">
              {data[key] ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-300" />
              )}
              <Switch
                checked={data[key] || false}
                onCheckedChange={(v) => handleChange(key, v)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}