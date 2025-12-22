import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Activity, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CavadSection({ data, onChange }) {
  const handleStatusChange = (status) => {
    onChange({ 
      ...data, 
      cavad_status: status,
      cavad_tests: status === 'failed' ? (data.cavad_tests || []) : []
    });
  };

  const addTest = () => {
    const tests = data.cavad_tests || [];
    onChange({
      ...data,
      cavad_tests: [...tests, { test_number: tests.length + 1, lower_limit: '', upper_limit: '', measured_value: '' }]
    });
  };

  const updateTest = (index, field, value) => {
    const tests = [...(data.cavad_tests || [])];
    tests[index] = { ...tests[index], [field]: value };
    onChange({ ...data, cavad_tests: tests });
  };

  const removeTest = (index) => {
    const tests = (data.cavad_tests || []).filter((_, i) => i !== index);
    onChange({ ...data, cavad_tests: tests });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">בדיקות CAVAD</h3>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-700">סטטוס בדיקה</Label>
        <Select
          value={data.cavad_status || ''}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="בחר סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="passed">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                עבר
              </span>
            </SelectItem>
            <SelectItem value="failed">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                נכשל
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <AnimatePresence>
        {data.cavad_status === 'failed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                נא לפרט את הבדיקות שנכשלו
              </p>
            </div>

            {(data.cavad_tests || []).map((test, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">בדיקה #{test.test_number}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTest(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">מספר בדיקה</Label>
                    <Select
                      value={String(test.test_number)}
                      onValueChange={(v) => updateTest(index, 'test_number', Number(v))}
                    >
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 18 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">גבול תחתון</Label>
                    <Input
                      value={test.lower_limit}
                      onChange={(e) => updateTest(index, 'lower_limit', e.target.value)}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">גבול עליון</Label>
                    <Input
                      value={test.upper_limit}
                      onChange={(e) => updateTest(index, 'upper_limit', e.target.value)}
                      className="h-10 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">ערך נמדד</Label>
                    <Input
                      value={test.measured_value}
                      onChange={(e) => updateTest(index, 'measured_value', e.target.value)}
                      className="h-10 rounded-lg"
                    />
                  </div>
                </div>
              </motion.div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addTest}
              className="w-full h-12 rounded-xl border-dashed border-2"
            >
              <Plus className="w-4 h-4 ml-2" />
              הוסף בדיקה
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}