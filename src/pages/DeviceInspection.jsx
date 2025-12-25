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
import { ArrowRight, Save, CheckCircle2, AlertTriangle, Loader2, Check, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
  const [draftId, setDraftId] = useState(null);

  // Fetch existing draft
  const { data: existingDraft } = useQuery({
    queryKey: ['inspection_draft', serialNumber],
    queryFn: async () => {
       const res = await base44.entities.Inspection.filter({ 
         status: 'draft',
         // We need to filter by serial number manually or use a more complex query if supported
         // Assuming device_serial_numbers is an array, exact match might be tricky in basic filter if not handled
         // We will filter client side if needed or rely on the fact we usually have one draft per device
       });
       // Filter for this specific device
       return res.find(d => d.device_serial_numbers?.includes(serialNumber));
    },
    enabled: !!serialNumber,
  });

  useEffect(() => {
    if (existingDraft) {
      setDraftId(existingDraft.id);
      setSubtype(existingDraft.profile || '');
      setRemarks(existingDraft.remarks?.split('\n')[1] || ''); // Simple extraction, or just keep full remarks
      try {
        if (existingDraft.checklist_answers) {
          setChecklistData(JSON.parse(existingDraft.checklist_answers));
        }
      } catch (e) {
        console.error("Failed to parse draft answers", e);
      }
    }
  }, [existingDraft]);

  // Fetch device
  const { data: device, isLoading: isLoadingDevice } = useQuery({
    queryKey: ['device', serialNumber],
    queryFn: async () => {
      const res = await base44.entities.Device.filter({ serial_number: serialNumber });
      return res[0];
    },
    enabled: !!serialNumber,
  });

  // Fetch user
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  // Fetch checklists
  const { data: checklists = [], isLoading: isLoadingChecklists } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => base44.entities.InspectionChecklist.list(),
  });

  const { data: latestInspections = [] } = useQuery({
    queryKey: ['latest_inspections_seq'],
    // Fetch inspections with reasonable ID range (not timestamps) to continue sequence
    // Timestamps are > 1,000,000,000,000, valid sequential IDs are likely < 1,000,000,000
    queryFn: () => base44.entities.Inspection.filter({ inspection_number: { $lt: 1000000000 } }, '-inspection_number', 1),
  });

  const nextInspectionNumber = latestInspections.length > 0
    ? (latestInspections[0].inspection_number || 0) + 1
    : 1;

  const getDeviceChecklistType = () => {
    if (!device) return null;
    
    // Automatic mapping where possible
    if (device.device_group === 'elal') return 'elal';
    if (device.device_group === 'lotus') return 'lotus';
    if (device.device_group === 'hargol') return 'hargol'; 
    
    // For others, we need user input
    if (subtype) return subtype;
    
    return null;
  };

  const currentChecklistType = getDeviceChecklistType();
  const currentChecklistObj = checklists.find(c => c.code === currentChecklistType);
  const currentChecklistItems = currentChecklistObj?.items || [];

  const handleValueChange = (id, value) => {
    setChecklistData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const calculateProgress = () => {
    if (!currentChecklistItems.length) return 0;
    const answeredCount = currentChecklistItems.filter(item => {
      const val = checklistData[item.id];
      if (item.type === 'checkbox') return val === true;
      return !!val;
    }).length;
    return Math.round((answeredCount / currentChecklistItems.length) * 100);
  };

  const handleSaveDraft = async (exit = false) => {
    if (!currentChecklistType) return;
    
    setIsSubmitting(true);
    try {
      const progress = calculateProgress();
      
      const inspectionData = {
        device_serial_numbers: [device.serial_number],
        soldier_name: user?.display_name || user?.full_name || 'Anonymous',
        profile: currentChecklistType,
        inspection_date: new Date().toISOString(),
        status: 'draft',
        progress: progress,
        checklist_answers: JSON.stringify(checklistData),
        remarks: remarks
      };

      if (draftId) {
        await base44.entities.Inspection.update(draftId, inspectionData);
      } else {
        const newDraft = await base44.entities.Inspection.create({
          ...inspectionData,
          inspection_number: nextInspectionNumber
        });
        setDraftId(newDraft.id);
      }

      toast.success('טיוטה נשמרה');
      
      if (exit) {
        if (source === 'special') navigate(createPageUrl('Special'));
        else if (source === 'routine') navigate(createPageUrl('Routine'));
        else navigate(createPageUrl('Home'));
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('שגיאה בשמירת טיוטה');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to check if item is visible based on parent conditions
  const renderItem = (item, isSubItem = false) => {
    return (
      <div 
        key={item.id}
        className={`p-4 bg-white border rounded-xl hover:bg-slate-50 transition-colors ${isSubItem ? 'mr-6 border-red-200 bg-red-50/30' : ''}`}
      >
        <div className="flex items-center justify-between mb-2">
          <Label className={`font-medium ${item.required ? 'after:content-["*"] after:text-red-500 after:mr-1' : ''} ${isSubItem ? 'text-sm' : ''}`}>
            {item.label}
          </Label>
        </div>

        {item.type === 'checkbox' && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleValueChange(item.id, true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                checklistData[item.id] === true
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-700 font-medium ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Check className={`w-5 h-5 ${checklistData[item.id] === true ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>תקין</span>
            </button>

            <button
              type="button"
              onClick={() => handleValueChange(item.id, false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                checklistData[item.id] === false
                  ? 'bg-red-100 border-red-500 text-red-700 font-medium ring-1 ring-red-500'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <X className={`w-5 h-5 ${checklistData[item.id] === false ? 'text-red-600' : 'text-slate-400'}`} />
              <span>לא תקין</span>
            </button>
          </div>
        )}

        {item.type === 'text' && (
          <Input 
            value={checklistData[item.id] || ''}
            onChange={(e) => handleValueChange(item.id, e.target.value)}
            placeholder="הזן טקסט..."
            className="bg-white text-right"
          />
        )}

        {item.type === 'select' && (
          <Select 
            value={checklistData[item.id]} 
            onValueChange={(val) => handleValueChange(item.id, val)}
          >
            <SelectTrigger className="bg-white text-right">
              <SelectValue placeholder="בחר אפשרות" />
            </SelectTrigger>
            <SelectContent>
              {(item.options || []).map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!currentChecklistType) return;
    
    // Validation
    const collectMissingFields = (items) => {
       let missing = [];
       items.forEach(item => {
           const val = checklistData[item.id];

           // Check if item is required and empty
           // For checkbox: required means it must be checked (true)? 
           // Actually in previous logic: if (item.required && !checklistData[item.id])
           // This implies checkbox must be true if required.
           // But wait, if I mark "Not OK", it is false. 
           // If a checkbox is required, does it mean "Must be OK"? 
           // In the renderItem for checkbox:
           // <button ... onClick={() => handleValueChange(item.id, true)}>...
           // <button ... onClick={() => handleValueChange(item.id, false)}>...
           // checklistData[item.id] is boolean.
           // If required=true, validation fails if value is false/undefined.
           // This forces the user to mark it as "OK" to pass validation?
           // Or just to answer it?
           // The previous code: .filter(item => item.required && !checklistData[item.id])
           // If I answer "false" (Not OK), !false is true => missing.
           // So yes, previously "required" meant "Must be OK".
           // BUT, for text/select, it means "Must have value".

           // However, for sub-items (text inputs mostly), we just want them to be filled.
           // Let's stick to "has value" for non-checkbox, and "true" for checkbox?
           // Wait, if I have a checklist item "Screen", and I mark it "Not OK", I am forced to fill sub-items.
           // But the main item "Screen" is "Not OK". If "Screen" is required, I cannot submit "Not OK"?
           // That seems strict. Maybe "required" for checkbox means "Must be answered"?
           // But checklistData[item.id] is undefined if not answered?
           // Let's check handleValueChange.

           // If I haven't clicked anything, checklistData[item.id] is undefined.
           // If I click "Not OK", it becomes false.
           // If I click "OK", it becomes true.

           // Previous validation: !checklistData[item.id]
           // If undefined -> !undefined -> true (Missing)
           // If false -> !false -> true (Missing!) -> This means you CANNOT submit a failure for a required field?
           // That sounds wrong for an inspection app. You should be able to report failures.
           // But maybe "required" implies "Must be passed" for the main checklist?
           // Or maybe the previous code was buggy/strict.

           // Let's assume for now we want to check if it has a value (defined).
           // But !false is true.
           // If I change it to `checklistData[item.id] === undefined`, then "Not OK" (false) is valid.
           // BUT, `!checklistData[item.id]` was the code.
           // If the intention of "required" on a checkbox is "Must be Pass", then OK.
           // If the intention is "Must be answered", then the previous code was blocking "Not OK".

           // Let's look at renderItem logic for checkbox:
           /*
            <button ... onClick={() => handleValueChange(item.id, true)} ... >תקין</button>
            <button ... onClick={() => handleValueChange(item.id, false)} ... >לא תקין</button>
           */
           // If I click "Not OK", value is `false`.

           // Let's refine validation to:
           // 1. If checkbox: must be not undefined (must be answered).
           // 2. If text/select: must be truthy (not empty string).

           // BUT I should be careful not to break existing behavior if "Must be Pass" was intended.
           // Given it's an inspection, usually you record failures. So blocking "Not OK" seems wrong.
           // I will assume "Required" means "Must be answered".

           const isDefined = val !== undefined && val !== null && val !== '';
           const isCheckbox = item.type === 'checkbox';

           // If it is a checkbox, we accept true or false. undefined is missing.
           // If it is text/select, we need a value.

           if (item.required) {
               if (isCheckbox) {
                   if (val === undefined) missing.push(item.label);
               } else {
                   if (!val) missing.push(item.label);
               }
           }

           // Check sub-items if condition is met
           const conditionVal = item.conditionValue !== undefined ? item.conditionValue : (item.type === 'checkbox' ? false : 'נכשל');
           const isMatch = val === conditionVal;

           if (isMatch && item.subItems && item.subItems.length > 0) {
               missing = [...missing, ...collectMissingFields(item.subItems)];
           }
       });
       return missing;
    };

    const missingFields = collectMissingFields(currentChecklistItems);

    if (missingFields.length > 0) {
      toast.error(`אנא מלא את שדות החובה: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const allPassed = currentChecklistItems.every(item => {
        if (item.type === 'checkbox' && item.required) return checklistData[item.id] === true;
        if (item.required) return !!checklistData[item.id];
        return true;
      });
      
      const resultsSummary = currentChecklistItems.map(item => {
        let val = checklistData[item.id];
        if (item.type === 'checkbox') val = val ? 'V' : 'X';
        return `${item.label}: ${val}`;
      }).join('\n');

      const inspectionData = {
        inspection_number: existingDraft?.inspection_number || nextInspectionNumber,
        device_serial_numbers: [device.serial_number],
        soldier_name: user?.display_name || user?.full_name || 'Anonymous',
        profile: currentChecklistType,
        inspection_date: new Date().toISOString(),
        cavad_status: allPassed ? 'passed' : 'failed',
        remarks: `סוג בדיקה: ${currentChecklistObj?.name || currentChecklistType}\n${remarks}\n\nתוצאות:\n${resultsSummary}`,
        status: 'completed',
        progress: 100,
        checklist_answers: JSON.stringify(checklistData)
      };

      if (draftId) {
        await base44.entities.Inspection.update(draftId, inspectionData);
      } else {
        await base44.entities.Inspection.create(inspectionData);
      }

      // Update device stats
      const encryptionItem = currentChecklistItems.find(i => i.label.includes('הצפנה') || i.label.includes('הצפנות'));
      const isEncrypted = encryptionItem && checklistData[encryptionItem.id] === true;

      await base44.entities.Device.update(device.id, {
        total_inspections: (device.total_inspections || 0) + 1,
        last_inspection_date: new Date().toISOString().split('T')[0],
        ...(isEncrypted ? { encryption_status: 'encrypted' } : {})
      });

      toast.success('הבדיקה נשמרה בהצלחה');
      
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

  if (isLoadingDevice || isLoadingChecklists) {
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
                    מבצע בדיקה עבור: {currentChecklistObj?.name || device.device_group}
                  </span>
                  {['710', '711', '713'].includes(device.device_group) && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => setSubtype('')}
                      className="mr-auto text-blue-600"
                    >
                      שנה
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {currentChecklistItems.length === 0 && (
                     <div className="text-center p-4 text-slate-500 border border-dashed rounded-xl">
                       לא הוגדרו סעיפי בדיקה לרשימה זו.
                       <br/>
                       אנא פנה למנהל המערכת להגדרת רשימת הבדיקה.
                     </div>
                  )}
                  {currentChecklistItems.map((item) => (
                    <React.Fragment key={item.id}>
                      {renderItem(item)}
                      {/* Render sub-items conditions */}
                      {(() => {
                        const val = checklistData[item.id];
                        const conditionVal = item.conditionValue !== undefined ? item.conditionValue : (item.type === 'checkbox' ? false : 'נכשל');
                        const isMatch = val === conditionVal;

                        if (isMatch && item.subItems && item.subItems.length > 0) {
                          return (
                            <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                               {item.subItems.map(subItem => renderItem(subItem, true))}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </React.Fragment>
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

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button 
                    variant="outline"
                    className="h-12 text-lg border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => handleSaveDraft(true)}
                    disabled={isSubmitting}
                  >
                    שמור ויציאה
                  </Button>
                  <Button 
                    className="h-12 text-lg bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleSubmit}
                    disabled={isSubmitting || currentChecklistItems.length === 0}
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Save className="w-5 h-5 ml-2" />
                        סיום והגשה
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}