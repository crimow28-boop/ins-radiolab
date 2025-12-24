import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowRight, Save, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const CHECKLISTS = {
  '710_no_amp': [
    { id: 'visual', label: 'בדיקה ויזואלית (שברים/סדקים)' },
    { id: 'connectors', label: 'תקינות מחברים' },
    { id: 'battery', label: 'תקינות בית סוללה' },
    { id: 'ptt', label: 'תקינות לחצן PTT' },
    { id: 'audio', label: 'בדיקת שמע ודיבור' },
  ],
  '710_amp': [
    { id: 'visual', label: 'בדיקה ויזואלית (שברים/סדקים)' },
    { id: 'connectors', label: 'תקינות מחברים' },
    { id: 'battery', label: 'תקינות בית סוללה' },
    { id: 'ptt', label: 'תקינות לחצן PTT' },
    { id: 'audio', label: 'בדיקת שמע ודיבור' },
    { id: 'amp_conn', label: 'חיבור תקין למגבר' },
    { id: 'amp_power', label: 'הספק שידור עם מגבר' },
  ],
  '711_no_amp': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'display', label: 'תקינות צג' },
    { id: 'keypad', label: 'תקינות מקשים' },
    { id: 'audio', label: 'בדיקת שמע' },
  ],
  '711_amp': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'display', label: 'תקינות צג' },
    { id: 'keypad', label: 'תקינות מקשים' },
    { id: 'audio', label: 'בדיקת שמע' },
    { id: 'amp_check', label: 'בדיקת מגבר' },
  ],
  '713_no_amp': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'switches', label: 'תקינות בוררים' },
    { id: 'ant', label: 'תקינות אנטנה' },
  ],
  '713_amp': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'switches', label: 'תקינות בוררים' },
    { id: 'ant', label: 'תקינות אנטנה' },
    { id: 'amp_integ', label: 'אינטגרציה עם מגבר' },
  ],
  'hargol_4200': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'cables', label: 'תקינות כבלים' },
    { id: 'gps', label: 'נעילת GPS' },
    { id: 'comm', label: 'בדיקת תקשורת' },
  ],
  'hargol_4400': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'cables', label: 'תקינות כבלים' },
    { id: 'gps', label: 'נעילת GPS' },
    { id: 'comm', label: 'בדיקת תקשורת' },
    { id: 'wideband', label: 'בדיקת רחב סרט' },
  ],
  'elal': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'leds', label: 'תקינות נוריות' },
    { id: 'func', label: 'בדיקה פונקציונלית' },
  ],
  'lotus': [
    { id: 'visual', label: 'בדיקה ויזואלית' },
    { id: 'screen', label: 'תקינות מסך מגע' },
    { id: 'app', label: 'עליית אפליקציה' },
  ]
};

export default function DeviceInspection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const serialNumber = searchParams.get('serial');
  const source = searchParams.get('source'); // 'special' or 'routine'
  
  const [subtype, setSubtype] = useState('');
  const [checklistData, setChecklistData] = useState({});
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: device, isLoading } = useQuery({
    queryKey: ['device', serialNumber],
    queryFn: async () => {
      const res = await base44.entities.Device.list({ serial_number: serialNumber });
      return res[0];
    },
    enabled: !!serialNumber,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const getDeviceChecklistType = () => {
    if (!device) return null;
    
    // Automatic mapping where possible
    if (device.device_group === 'elal') return 'elal';
    if (device.device_group === 'lotus') return 'lotus';
    
    // For others, we might need user input if not already selected
    if (subtype) return subtype;
    
    return null;
  };

  const currentChecklistType = getDeviceChecklistType();
  const currentChecklist = currentChecklistType ? CHECKLISTS[currentChecklistType] : [];

  const handleToggle = (id) => {
    setChecklistData(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = async () => {
    if (!currentChecklistType) return;
    
    setIsSubmitting(true);
    try {
      // Create inspection record
      const passed = currentChecklist.every(item => checklistData[item.id]);
      
      const inspectionData = {
        inspection_number: Date.now(), // Simple ID generation
        device_serial_numbers: [device.serial_number],
        soldier_name: user?.full_name || 'Anonymous',
        profile: device.device_group === 'hargol' ? (subtype === 'hargol_4200' ? 'hargol_4200' : 'hargol_4400') : '710', // Default mapping
        inspection_date: new Date().toISOString(),
        cavad_status: passed ? 'passed' : 'failed',
        remarks: `סוג בדיקה: ${currentChecklistType}\n${remarks}\n\nתוצאות:\n${currentChecklist.map(item => `${item.label}: ${checklistData[item.id] ? 'V' : 'X'}`).join('\n')}`
      };

      await base44.entities.Inspection.create(inspectionData);

      // Update device stats
      await base44.entities.Device.update(device.id, {
        total_inspections: (device.total_inspections || 0) + 1,
        last_inspection_date: new Date().toISOString().split('T')[0]
      });

      toast.success('הבדיקה נשמרה בהצלחה');
      
      // Navigate back
      if (source === 'special') navigate(createPageUrl('Special'));
      else if (source === 'routine') navigate(createPageUrl('Routine'));
      else navigate(createPageUrl('Home'));

    } catch (error) {
      console.error('Error saving inspection:', error);
      toast.error('שגיאה בשמירת הבדיקה');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">מכשיר לא נמצא</h2>
        <Button onClick={() => navigate(-1)} className="mt-4">חזור</Button>
      </div>
    );
  }

  const renderSubtypeSelection = () => {
    if (['710', '711', '713'].includes(device.device_group)) {
      return (
        <div className="space-y-4 mb-6">
          <Label className="text-lg font-medium">בחר תצורה:</Label>
          <RadioGroup value={subtype} onValueChange={setSubtype} className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-4 cursor-pointer hover:bg-slate-50 [&:has(:checked)]:bg-blue-50 [&:has(:checked)]:border-blue-200">
              <RadioGroupItem value={`${device.device_group}_no_amp`} id="no_amp" />
              <Label htmlFor="no_amp" className="cursor-pointer mr-2">ללא מגבר</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-4 cursor-pointer hover:bg-slate-50 [&:has(:checked)]:bg-blue-50 [&:has(:checked)]:border-blue-200">
              <RadioGroupItem value={`${device.device_group}_amp`} id="amp" />
              <Label htmlFor="amp" className="cursor-pointer mr-2">עם מגבר</Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    if (device.device_group === 'hargol') {
      return (
        <div className="space-y-4 mb-6">
          <Label className="text-lg font-medium">בחר דגם:</Label>
          <RadioGroup value={subtype} onValueChange={setSubtype} className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-4 cursor-pointer hover:bg-slate-50 [&:has(:checked)]:bg-blue-50 [&:has(:checked)]:border-blue-200">
              <RadioGroupItem value="hargol_4200" id="4200" />
              <Label htmlFor="4200" className="cursor-pointer mr-2">4200</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse border rounded-xl p-4 cursor-pointer hover:bg-slate-50 [&:has(:checked)]:bg-blue-50 [&:has(:checked)]:border-blue-200">
              <RadioGroupItem value="hargol_4400" id="4400" />
              <Label htmlFor="4400" className="cursor-pointer mr-2">4400</Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">בדיקת מכשיר {device.serial_number}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>פרטי בדיקה</CardTitle>
          </CardHeader>
          <CardContent>
            {!currentChecklistType ? (
              renderSubtypeSelection()
            ) : (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-xl mb-4 flex items-center gap-2 text-blue-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    מבצע בדיקה עבור: {CHECKLISTS[currentChecklistType]?.[0]?.label ? subtype.replace('_', ' ') : device.device_group}
                  </span>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => setSubtype('')}
                    className="mr-auto text-blue-600"
                  >
                    שנה
                  </Button>
                </div>

                <div className="space-y-4">
                  {currentChecklist.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center space-x-3 space-x-reverse p-4 bg-white border rounded-xl hover:bg-slate-50 transition-colors"
                      onClick={() => handleToggle(item.id)}
                    >
                      <Checkbox 
                        checked={checklistData[item.id] || false}
                        onCheckedChange={() => handleToggle(item.id)}
                        id={item.id}
                      />
                      <Label htmlFor={item.id} className="cursor-pointer mr-3 flex-1">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>הערות נוספות</Label>
                  <Textarea 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="פרט הערות במידת הצורך..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  className="w-full h-12 text-lg mt-6 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !currentChecklist.length}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      שמור בדיקה
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}