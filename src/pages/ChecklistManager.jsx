import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, GripVertical, ArrowRight, Loader2, Copy, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

const CHECKLIST_TYPES = [
  { code: '710_no_amp', name: '710 ללא מגבר' },
  { code: '710_amp', name: '710 עם מגבר' },
  { code: '711_no_amp', name: '711 ללא מגבר' },
  { code: '711_amp', name: '711 עם מגבר' },
  { code: '713_no_amp', name: '713 ללא מגבר' },
  { code: '713_amp', name: '713 עם מגבר' },
  { code: 'hargol', name: 'חרגול (4200/4400)' },
  { code: 'elal', name: 'אל-על' },
  { code: 'lotus', name: 'לוטוס' }
];

const FIELD_TYPES = [
  { value: 'checkbox', label: 'תיבת סימון (כן/לא)' },
  { value: 'text', label: 'טקסט חופשי' },
  { value: 'select', label: 'בחירה מרשימה' }
];

const TZABAD_FAULTS = {
  '710_no_amp': [
    'בדיקה עצמית-קליטה', 'בדיקה עצמית-שידור', 'הספק שידור בינוני', 'הספק שידור גבוה',
    'דיוק תדר', 'סטיית תדר', 'דיוק תדר 150 הרץ', 'סטיית תדר 150 הרץ',
    'עיוותי שמע בשידור', 'ניחות שמיעה עצמית', 'רגישות קליטה',
    'רגישות משקט 150 הרץ', 'עוצמת שמע במוצא אוזניה', 'עיוותי שמע במוצא אוזניה', 'תוקף סוללת גיבוי'
  ],
  '710_amp': [
    'בדיקה עצמית-קליטה', 'בדיקה עצמית-שידור', 'הספק שידור בינוני', 'הספק שידור גבוה',
    'דיוק תדר', 'סטיית תדר', 'דיוק תדר 150 הרץ', 'סטיית תדר 150 הרץ',
    'עיוותי שמע בשידור', 'ניחות שמיעה עצמית', 'רגישות קליטה',
    'רגישות משקט 150 הרץ', 'עוצמת שמע במוצא אוזניה', 'עיוותי שמע במוצא אוזניה', 'תוקף סוללת גיבוי'
  ],
  '711_no_amp': [
    'בדיקה עצמית-קליטה', 'בדיקה עצמית-שידור', 'הספק שידור בינוני', 'הספק שידור גבוה את״ד', 'הספק שידור גבוה את״ן',
    'דיוק תדר', 'סטיית תדר', 'דיוק תדר 150 הרץ', 'סטיית תדר 150 הרץ', 'עומק אפנון',
    'עיוותי שמע בשידור את״ד', 'עיוותי שמע בשידור את״ן', 'ניחות שמיעה עצמית',
    'רגישות קליטה את״ד', 'רגישות קליטה את״ן', 'רגישות משקט 150 הרץ', 'רגישות משקט רחש',
    'רגישות משקט את״ד ישן', 'עוצמת שמע במוצא אוזניה', 'עיוותי שמע במוצא אוזניה', 'תוקף סוללת גיבוי'
  ],
  '711_amp': [
    'בדיקה עצמית-קליטה', 'בדיקה עצמית-שידור', 'הספק שידור גבוה את״ד',
    'דיוק תדר', 'סטיית תדר', 'דיוק תדר 150 הרץ', 'סטיית תדר 150 הרץ',
    'עיוותי שמע בשידור את״ד', 'ניחות שמיעה עצמית', 'רגישות קליטה את״ד',
    'רגישות משקט 150 הרץ', 'רגישות משקט את״ד ישן', 'עוצמת שמע במוצא אוזניה',
    'עיוותי שמע במוצא אוזניה', 'תוקף סוללת גיבוי'
  ],
  '713_no_amp': [
    'בדיקה עצמית-קליטה', 'בדיקה עצמית-שידור', 'הספק שידור בינוני את״ד', 'הספק שידור גבוה את״ד', 'הספק שידור גבוה את״ן',
    'דיוק תדר', 'סטיית תדר', 'דיוק תדר 150 הרץ', 'סטיית תדר 150 הרץ', 'עומק אפנון',
    'עיוותי שמע בשידור את״ד', 'עיוותי שמע בשידור את״ן', 'ניחות שמיעה עצמית',
    'רגישות קליטה את״ד', 'רגישות קליטה את״ן', 'רגישות משקט 150 הרץ', 'רגישות משקט רחש',
    'רגישות משקט את״ד ישן', 'עוצמת שמע במוצא אוזניה', 'עיוותי שמע במוצא אוזניה', 'תוקף סוללת גיבוי'
  ],
  '713_amp': [
    'בדיקה עצמית-קליטה', 'בדיקה עצמית-שידור', 'הספק שידור גבוה את״ד',
    'דיוק תדר', 'סטיית תדר', 'דיוק תדר 150 הרץ', 'סטיית תדר 150 הרץ',
    'עיוותי שמע בשידור את״ד', 'ניחות שמיעה עצמית', 'רגישות קליטה את״ד',
    'רגישות משקט 150 הרץ', 'רגישות משקט את״ד ישן', 'עוצמת שמע במוצא אוזניה',
    'עיוותי שמע במוצא אוזניה', 'תוקף סוללת גיבוי'
  ]
};

const PREDEFINED_ITEMS = [
  { label: 'סודר', type: 'text' },
  { label: 'שם', type: 'text' },
  { label: 'מספר צ’', type: 'text' },
  { label: 'אנטנה', type: 'select', options: 'תקין, לא תקין, חסר' },
  { label: 'מער״ש', type: 'select', options: 'תקין, לא תקין, חסר' },
  { label: 'צב"ד', type: 'special_tzabad' }, // Marker type
  { label: 'הצפנה', type: 'checkbox' },
  { label: 'תדרים', type: 'checkbox' },
  { label: 'בדיקות קשר', type: 'checkbox' },
  { label: 'החלפת סוללה', type: 'checkbox' },
  { label: 'אטימות', type: 'checkbox' },
  { label: 'ציוד נוסף', type: 'text' },
  { label: 'הערות', type: 'text' }
];

export default function ChecklistManager() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('710_no_amp');
  const [items, setItems] = useState([]);
  const [currentChecklistId, setCurrentChecklistId] = useState(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [sourceChecklistCode, setSourceChecklistCode] = useState('');

  // Helper to process items from DB (array options -> string options)
  const processItemsFromDb = (items) => {
    return (items || []).map(item => ({
      ...item,
      options: Array.isArray(item.options) ? item.options.join(', ') : (item.options || ''),
      subItems: (item.subItems || []).map(sub => ({
        ...sub,
        options: Array.isArray(sub.options) ? sub.options.join(', ') : (sub.options || '')
      }))
    }));
  };

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => base44.entities.InspectionChecklist.list(),
    onSuccess: (data) => {
      const current = data.find(c => c.code === selectedType);
      if (current) {
        setItems(processItemsFromDb(current.items));
        setCurrentChecklistId(current.id);
      } else {
        setItems([]);
        setCurrentChecklistId(null);
      }
    }
  });

  // Effect to update local state when selectedType changes or data loads
  React.useEffect(() => {
    const current = checklists.find(c => c.code === selectedType);
    if (current) {
      setItems(processItemsFromDb(current.items));
      setCurrentChecklistId(current.id);
    } else {
      setItems([]);
      setCurrentChecklistId(null);
    }
  }, [selectedType, checklists]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (currentChecklistId) {
        return base44.entities.InspectionChecklist.update(currentChecklistId, data);
      } else {
        return base44.entities.InspectionChecklist.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast.success('הרשימה נשמרה בהצלחה');
    },
    onError: () => {
      toast.error('שגיאה בשמירת הרשימה');
    }
  });

  const handleAddItem = () => {
    const newItem = {
      id: `field_${Date.now()}`,
      label: '',
      type: 'checkbox',
      required: true,
      options: ''
    };
    setItems([...items, newItem]);
  };

  const handleAddQuickItem = (predefined) => {
    const newItem = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: predefined.label,
      type: predefined.type,
      required: true,
      options: predefined.options || ''
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleAddSubItem = (parentIndex) => {
    const newItems = [...items];
    const parentItem = newItems[parentIndex];
    const subItems = parentItem.subItems || [];
    
    subItems.push({
      id: `field_${Date.now()}`,
      label: '',
      type: 'text', // Default to text for sub-explanation usually
      required: true,
      options: ''
    });
    
    newItems[parentIndex] = { ...parentItem, subItems };
    setItems(newItems);
  };

  const handleRemoveSubItem = (parentIndex, subIndex) => {
    const newItems = [...items];
    const parentItem = newItems[parentIndex];
    const subItems = [...(parentItem.subItems || [])];
    subItems.splice(subIndex, 1);
    newItems[parentIndex] = { ...parentItem, subItems };
    setItems(newItems);
  };

  const handleUpdateSubItem = (parentIndex, subIndex, field, value) => {
    const newItems = [...items];
    const parentItem = newItems[parentIndex];
    const subItems = [...(parentItem.subItems || [])];
    subItems[subIndex] = { ...subItems[subIndex], [field]: value };
    newItems[parentIndex] = { ...parentItem, subItems };
    setItems(newItems);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  // Helper to process items for DB (string options -> array options)
  const processItemsForDb = (items) => {
    return items.map(item => ({
      ...item,
      options: typeof item.options === 'string' 
        ? item.options.split(',').map(s => s.trim()).filter(Boolean)
        : (item.options || []),
      subItems: (item.subItems || []).map(sub => ({
        ...sub,
        options: typeof sub.options === 'string'
          ? sub.options.split(',').map(s => s.trim()).filter(Boolean)
          : (sub.options || [])
      }))
    }));
  };

  const handleSave = () => {
    const checklistName = CHECKLIST_TYPES.find(t => t.code === selectedType)?.name;
    const itemsForDb = processItemsForDb(items);
    
    saveMutation.mutate({
      code: selectedType,
      name: checklistName,
      items: itemsForDb
    });
  };

  const handleDuplicate = () => {
    if (!sourceChecklistCode) return;
    const sourceChecklist = checklists.find(c => c.code === sourceChecklistCode);
    if (sourceChecklist && sourceChecklist.items) {
        // Deep copy and generate new IDs to avoid conflicts
        const newItems = JSON.parse(JSON.stringify(sourceChecklist.items)).map(item => ({
            ...item,
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            options: Array.isArray(item.options) ? item.options.join(', ') : (item.options || ''), // Convert to string for UI
            subItems: (item.subItems || []).map(sub => ({
                ...sub,
                id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                options: Array.isArray(sub.options) ? sub.options.join(', ') : (sub.options || '')
            }))
        }));
        setItems(newItems);
        toast.success(`רשימה שוכפלה מ-${CHECKLIST_TYPES.find(t => t.code === sourceChecklistCode)?.name}`);
        setDuplicateDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50" dir="rtl">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 rounded-full w-10 h-10 p-0">
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">ניהול רשימות בדיקה</h1>
              <p className="text-sm text-slate-500 hidden md:block">הגדר ונהל את סעיפי הבדיקה עבור כל סוג מכשיר</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 hidden md:flex">
                        <Copy className="w-4 h-4" />
                        שכפל רשימה
                    </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>שכפול רשימת בדיקה</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>בחר רשימה למקור</Label>
                        <Select onValueChange={setSourceChecklistCode} value={sourceChecklistCode}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="בחר רשימה..." />
                            </SelectTrigger>
                            <SelectContent>
                                {CHECKLIST_TYPES.filter(t => t.code !== selectedType).map(type => (
                                    <SelectItem key={type.code} value={type.code}>{type.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-slate-500 mt-2">
                            פעולה זו תחליף את כל הסעיפים ברשימה הנוכחית ({CHECKLIST_TYPES.find(t => t.code === selectedType)?.name}).
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>ביטול</Button>
                        <Button onClick={handleDuplicate} disabled={!sourceChecklistCode}>שכפל</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button 
                onClick={handleSave} 
                className="bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-200"
                disabled={saveMutation.isPending}
            >
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
                שמור שינויים
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-semibold text-slate-700">סוג מכשיר</h3>
              </div>
              <div className="p-2 overflow-y-auto flex-1 space-y-1">
                {CHECKLIST_TYPES.map(type => (
                  <button
                    key={type.code}
                    onClick={() => setSelectedType(type.code)}
                    className={`w-full text-right px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedType === type.code 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
            
            <Button variant="outline" className="md:hidden w-full gap-2" onClick={() => setDuplicateDialogOpen(true)}>
               <Copy className="w-4 h-4" />
               שכפל רשימה
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>עריכת סעיפים - {CHECKLIST_TYPES.find(t => t.code === selectedType)?.name}</CardTitle>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm">
                                <Zap className="w-4 h-4 ml-2" />
                                הוספה מהירה
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="h-96 overflow-y-auto">
                            {PREDEFINED_ITEMS.map((item, idx) => (
                                <DropdownMenuItem key={idx} onClick={() => handleAddQuickItem(item)}>
                                    {item.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" onClick={handleAddItem}>
                        <Plus className="w-4 h-4 ml-2" />
                        הוסף סעיף
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    אין סעיפים ברשימה זו. לחץ על "הוסף סעיף" כדי להתחיל.
                  </div>
                ) : (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="checklist-items">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-3"
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="bg-white border rounded-xl p-4 shadow-sm group hover:border-blue-200 transition-colors"
                                >
                                  <div className="flex items-start gap-3">
                                    <div {...provided.dragHandleProps} className="mt-3 cursor-move text-slate-400 hover:text-slate-600">
                                      <GripVertical className="w-5 h-5" />
                                    </div>
                                    
                                    <div className="flex-1 space-y-3">
                                      <div className="flex gap-3">
                                        <div className="flex-1">
                                          <Label className="text-xs text-slate-500 mb-1">תיאור הבדיקה</Label>
                                          <Input
                                            value={item.label}
                                            onChange={(e) => handleUpdateItem(index, 'label', e.target.value)}
                                            placeholder="לדוגמה: תקינות מסך"
                                          />
                                        </div>
                                        <div className="w-48">
                                          <Label className="text-xs text-slate-500 mb-1">סוג שדה</Label>
                                          <Select
                                            value={item.type}
                                            onValueChange={(value) => handleUpdateItem(index, 'type', value)}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {FIELD_TYPES.map(ft => (
                                                <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>

                                      {item.type === 'select' && (
                                        <div>
                                          <Label className="text-xs text-slate-500 mb-1">אפשרויות (מופרדות בפסיקים)</Label>
                                          <Input
                                            value={item.options || ''}
                                            onChange={(e) => handleUpdateItem(index, 'options', e.target.value)}
                                            placeholder="תקין, לא תקין, חסר"
                                          />
                                        </div>
                                      )}

                                      <div className="flex items-center gap-2">
                                        <Switch
                                          checked={item.required}
                                          onCheckedChange={(checked) => handleUpdateItem(index, 'required', checked)}
                                          id={`req-${item.id}`}
                                        />
                                        <Label htmlFor={`req-${item.id}`} className="text-sm cursor-pointer">שדה חובה</Label>
                                      </div>

                                      {/* Sub-items Section (for checkbox 'No' case) */}
                                      {item.type === 'checkbox' && (
                                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                                          <div className="flex items-center justify-between mb-2">
                                            <Label className="text-xs font-semibold text-red-800">אם סומן "לא תקין" (X):</Label>
                                            <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
                                              onClick={() => handleAddSubItem(index)}
                                            >
                                              <Plus className="w-3 h-3 ml-1" />
                                              הוסף תנאי
                                            </Button>
                                          </div>
                                          
                                          <div className="space-y-3 pl-2 border-r-2 border-red-200 mr-1">
                                            {(item.subItems || []).map((subItem, subIndex) => (
                                              <div key={subItem.id} className="bg-white p-2 rounded border border-red-100 relative group/sub">
                                                 <div className="flex gap-2 items-start">
                                                   <div className="flex-1 space-y-2">
                                                     <Input
                                                        value={subItem.label}
                                                        onChange={(e) => handleUpdateSubItem(index, subIndex, 'label', e.target.value)}
                                                        placeholder="שדה נוסף (למשל: פרט תקלה)"
                                                        className="h-8 text-sm"
                                                      />
                                                      <div className="flex gap-2">
                                                        <Select
                                                          value={subItem.type}
                                                          onValueChange={(value) => handleUpdateSubItem(index, subIndex, 'type', value)}
                                                        >
                                                          <SelectTrigger className="h-8 text-xs w-32">
                                                            <SelectValue />
                                                          </SelectTrigger>
                                                          <SelectContent>
                                                            {FIELD_TYPES.map(ft => (
                                                              <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                                            ))}
                                                          </SelectContent>
                                                        </Select>
                                                        {subItem.type === 'select' && (
                                                          <Input
                                                            value={subItem.options || ''}
                                                            onChange={(e) => handleUpdateSubItem(index, subIndex, 'options', e.target.value)}
                                                            placeholder="אפשרויות..."
                                                            className="h-8 text-sm flex-1"
                                                          />
                                                        )}
                                                      </div>
                                                   </div>
                                                   <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-6 w-6 text-slate-400 hover:text-red-600"
                                                      onClick={() => handleRemoveSubItem(index, subIndex)}
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                 </div>
                                              </div>
                                            ))}
                                            {(!item.subItems || item.subItems.length === 0) && (
                                              <p className="text-xs text-slate-400 italic">לא הוגדרו שדות נוספים למקרה של תקלה</p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-slate-400 hover:text-red-600 mt-1"
                                      onClick={() => handleRemoveItem(index)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}