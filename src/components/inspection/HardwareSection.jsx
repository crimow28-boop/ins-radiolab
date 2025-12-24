import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Antenna, Settings, Lock, Wrench } from 'lucide-react';

const ANTENNA_OPTIONS = ['תגם רגיל', 'תגם-G', 'שוט', 'עלה', 'סגמנטים'];
const SYSTEM_OPTIONS = ['MSA', 'אטום', 'יבש', 'קלרוס', 'אינוביציו'];

export default function HardwareSection({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Wrench className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">חומרה</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <Antenna className="w-4 h-4" />
            סוג אנטנה
          </Label>
          <Select
            value={data.antenna_type || ''}
            onValueChange={(v) => handleChange('antenna_type', v)}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="בחר סוג אנטנה" />
            </SelectTrigger>
            <SelectContent>
              {ANTENNA_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
          {data.antenna_type === 'other' && (
            <Input
              placeholder="פרט סוג אנטנה"
              value={data.antenna_type_custom || ''}
              onChange={(e) => handleChange('antenna_type_custom', e.target.value)}
              className="h-12 rounded-xl mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <Settings className="w-4 h-4" />
            סוג מערכת
          </Label>
          <Select
            value={data.system_type || ''}
            onValueChange={(v) => handleChange('system_type', v)}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="בחר סוג מערכת" />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
          {data.system_type === 'other' && (
            <Input
              placeholder="פרט סוג מערכת"
              value={data.system_type_custom || ''}
              onChange={(e) => handleChange('system_type_custom', e.target.value)}
              className="h-12 rounded-xl mt-2"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-slate-700">
            <Lock className="w-4 h-4" />
            מצב איטום
          </Label>
          <Select
            value={data.sealing_status || ''}
            onValueChange={(v) => handleChange('sealing_status', v)}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="בחר מצב" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="passed">עבר</SelectItem>
              <SelectItem value="not_passed">לא עבר</SelectItem>
              <SelectItem value="not_required">לא נדרש</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <Label className="flex items-center gap-2 text-slate-700">
            <Lock className="w-4 h-4" />
            ברגי איטום סגורים
          </Label>
          <Switch
            checked={data.sealing_screws_closed || false}
            onCheckedChange={(v) => handleChange('sealing_screws_closed', v)}
          />
        </div>
      </div>
    </div>
  );
}