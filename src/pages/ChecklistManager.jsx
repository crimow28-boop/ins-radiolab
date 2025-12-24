import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Save, GripVertical, Settings, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

export default function ChecklistManager() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('710_no_amp');
  const [items, setItems] = useState([]);
  const [currentChecklistId, setCurrentChecklistId] = useState(null);

  const { data: checklists = [], isLoading } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => base44.entities.InspectionChecklist.list(),
    onSuccess: (data) => {
      const current = data.find(c => c.code === selectedType);
      if (current) {
        setItems(current.items || []);
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
      setItems(current.items || []);
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
      options: []
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

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    setItems(newItems);
  };

  const handleSave = () => {
    const checklistName = CHECKLIST_TYPES.find(t => t.code === selectedType)?.name;
    saveMutation.mutate({
      code: selectedType,
      name: checklistName,
      items: items
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost">
                <ArrowRight className="w-4 h-4 ml-2" />
                חזרה
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-800">ניהול רשימות בדיקה</h1>
          </div>
          <Button 
            onClick={handleSave} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Save className="w-4 h-4 ml-2" />}
            שמור שינויים
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-2">
            <Label>בחר סוג מכשיר</Label>
            <div className="flex flex-col gap-2 bg-white p-2 rounded-xl border">
              {CHECKLIST_TYPES.map(type => (
                <Button
                  key={type.code}
                  variant={selectedType === type.code ? "secondary" : "ghost"}
                  className={`justify-start ${selectedType === type.code ? 'bg-blue-50 text-blue-700' : ''}`}
                  onClick={() => setSelectedType(type.code)}
                >
                  {type.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>עריכת סעיפים - {CHECKLIST_TYPES.find(t => t.code === selectedType)?.name}</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף סעיף
                </Button>
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
                                            value={item.options?.join(', ') || ''}
                                            onChange={(e) => handleUpdateItem(index, 'options', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
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