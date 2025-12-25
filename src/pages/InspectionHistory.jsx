import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowRight, 
  Search, 
  ClipboardList,
  Calendar,
  User,
  Radio,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
  Folder,
  FolderOpen,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function InspectionHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null); // 'all', 'general', or card object

  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me().catch(() => null) });

  const { data: inspections = [], isLoading: isLoadingInspections } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
  });

  const { data: routineCards = [] } = useQuery({
    queryKey: ['routineCards_history'],
    queryFn: () => base44.entities.RoutineCard.list(),
  });

  const { data: specialCards = [] } = useQuery({
    queryKey: ['specialCards_history'],
    queryFn: () => base44.entities.SpecialCard.list(),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
       const promises = inspections.map(i => base44.entities.Inspection.delete(i.id));
       await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('כל הבדיקות נמחקו בהצלחה');
    },
    onError: () => toast.error('שגיאה במחיקת הבדיקות')
  });

  // Group cards
  const allCards = useMemo(() => {
    return [
      ...routineCards.map(c => ({ ...c, type: 'routine' })),
      ...specialCards.map(c => ({ ...c, type: 'special' }))
    ].sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [routineCards, specialCards]);

  const filteredInspections = useMemo(() => {
    let filtered = inspections;

    // Folder filtering
    if (selectedFolder) {
      if (selectedFolder === 'general') {
        filtered = filtered.filter(i => !i.card_id);
      } else if (selectedFolder !== 'all') {
        filtered = filtered.filter(i => i.card_id === selectedFolder.id);
      }
    }

    // Search filtering
    const search = searchTerm.toLowerCase();
    if (search) {
      filtered = filtered.filter(insp => 
        (insp.soldier_name || '').toLowerCase().includes(search) ||
        String(insp.inspection_number).includes(search) ||
        (insp.device_serial_numbers || []).some(s => s.toLowerCase().includes(search))
      );
    }
    
    return filtered;
  }, [inspections, selectedFolder, searchTerm]);

  const profileLabels = {
    '710': '710',
    '711': '711',
    '713': '713',
    'hargol_4200': 'חרגול (4200)',
    'hargol_4400': 'חרגול (4400)',
    'elal': 'אל-על',
    'lotus': 'לוטוס',
  };

  const getFolderStats = (cardId) => {
    const count = inspections.filter(i => i.card_id === cardId).length;
    return count;
  };
  
  const generalCount = inspections.filter(i => !i.card_id).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost">
                  <ArrowRight className="w-4 h-4 ml-2" />
                  חזרה
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">היסטוריית בדיקות</h1>
                  <p className="text-sm text-slate-500">
                    {selectedFolder && selectedFolder !== 'all' 
                      ? `תיקייה: ${selectedFolder === 'general' ? 'כללי' : selectedFolder.title}`
                      : 'כל התיקיות'}
                  </p>
                </div>
              </div>
            </div>

            {user?.role === 'admin' && (
               <Button 
                 variant="destructive" 
                 className="gap-2"
                 onClick={() => {
                   if(confirm("פעולה זו תמחק את כל היסטוריית הבדיקות לצמיתות. האם להמשיך?")) {
                      deleteAllMutation.mutate();
                   }
                 }}
                 disabled={deleteAllMutation.isPending}
               >
                 {deleteAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                 מחק הכל
               </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation / Breadcrumbs if inside folder */}
        {selectedFolder && (
          <Button 
            variant="ghost" 
            onClick={() => setSelectedFolder(null)}
            className="mb-4 text-slate-500 hover:text-slate-800"
          >
            <Folder className="w-4 h-4 ml-2" />
            חזרה לתיקיות
          </Button>
        )}

        {/* Search Bar */}
        <Card className="bg-white border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="חפש לפי שם חייל, מספר בדיקה או מספר סידורי..."
                className="h-12 pr-10 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* View Content */}
        {!selectedFolder && !searchTerm ? (
          // Folders View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* General Folder */}
            {generalCount > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-blue-300 group"
                  onClick={() => setSelectedFolder('general')}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <FolderOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">כללי / ללא שיוך</h3>
                      <Badge variant="secondary" className="mt-2">{generalCount} בדיקות</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Cards Folders */}
            {allCards.map((card, idx) => {
              const count = getFolderStats(card.id);
              if (count === 0 && card.is_active) return null; // Skip empty active cards if we want to reduce clutter? Or show all?
              // Let's show all that have data OR are archived.
              if (count === 0 && !card.is_active) {/* Show archived even if empty? sure */}
              
              const isArchived = !card.is_active;

              return (
                <motion.div 
                  key={card.id} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className={`cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${
                      isArchived ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-100 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedFolder(card)}
                  >
                    {isArchived && (
                      <div className="absolute top-0 left-0 bg-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-br-lg font-medium">
                        ארכיון
                      </div>
                    )}
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                        isArchived ? 'bg-slate-200' : 'bg-blue-50 group-hover:bg-blue-100'
                      }`}>
                        {isArchived ? (
                          <Archive className="w-8 h-8 text-slate-500" />
                        ) : (
                          <Folder className="w-8 h-8 text-blue-500" />
                        )}
                      </div>
                      <div className="w-full">
                        <h3 className="font-bold text-lg text-slate-800 truncate" title={card.title}>
                          {card.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{card.type === 'special' ? 'מיוחד' : 'שגרה'}</p>
                        <Badge variant={isArchived ? "outline" : "secondary"} className="mt-2">
                          {count} בדיקות
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          // Inspections List View (Filtered)
          <div>
             {isLoadingInspections ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredInspections.length === 0 ? (
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="text-center py-20 text-slate-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>לא נמצאו בדיקות בתיקייה זו</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredInspections.map((inspection, index) => (
                  <motion.div
                    key={inspection.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="group bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer" onClick={() => setSelectedInspection(inspection)}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors overflow-hidden" title={inspection.inspection_number}>
                            {String(inspection.inspection_number).length > 5 ? '#' + String(inspection.inspection_number).slice(-4) : '#' + inspection.inspection_number}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <h3 className="font-semibold text-slate-900">
                                {inspection.soldier_name}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                {profileLabels[inspection.profile] || inspection.profile}
                              </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-y-1 gap-x-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(inspection.created_date), 'dd/MM/yyyy HH:mm')}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5" />
                                {(inspection.device_serial_numbers || []).length} מכשירים
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {(inspection.device_serial_numbers || []).slice(0, 4).map(serial => (
                                <span key={serial} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-xs rounded-md border border-slate-100 font-mono">
                                  {serial}
                                </span>
                              ))}
                              {(inspection.device_serial_numbers || []).length > 4 && (
                                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-md border border-slate-100">
                                  +{(inspection.device_serial_numbers || []).length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-row md:flex-col items-center md:items-end gap-2 pl-2">
                          <div className="flex gap-2">
                            {inspection.cavad_status === 'passed' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                                <CheckCircle className="w-3.5 h-3.5" />
                                צב"ד
                              </div>
                            ) : inspection.cavad_status === 'failed' ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                                <XCircle className="w-3.5 h-3.5" />
                                צב"ד
                              </div>
                            ) : null}
                            
                            {inspection.fault_description && inspection.fault_description !== 'אין' && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                תקלה
                              </div>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-blue-600">
                            <Eye className="w-4 h-4 ml-1" />
                            פרטים מלאים
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inspection Details Dialog */}
      <Dialog open={!!selectedInspection} onOpenChange={() => setSelectedInspection(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי בדיקה #{selectedInspection?.inspection_number}</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">שם חייל</p>
                    <p className="font-semibold">{selectedInspection.soldier_name}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">פרופיל</p>
                    <p className="font-semibold">{profileLabels[selectedInspection.profile]}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">תאריך</p>
                    <p className="font-semibold">
                      {format(new Date(selectedInspection.created_date), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  {selectedInspection.card_title && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <p className="text-sm text-slate-500">שייך לכרטיס</p>
                      <p className="font-semibold">{selectedInspection.card_title}</p>
                    </div>
                  )}
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <p className="text-sm text-slate-500">סטטוס מסירה</p>
                    <p className="font-semibold">
                      {selectedInspection.delivery_status === 'delivered' ? 'נמסר' : 'לא נמסר'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-500 mb-2">מכשירים</p>
                  <div className="flex flex-wrap gap-2">
                    {(selectedInspection.device_serial_numbers || []).map(serial => (
                      <Badge key={serial} className="bg-blue-100 text-blue-800">
                        {serial}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">חומרה</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">סוג אנטנה:</span> {selectedInspection.antenna_type || '-'}
                    </div>
                    <div>
                      <span className="text-slate-500">סוג מערכת:</span> {selectedInspection.system_type || '-'}
                    </div>
                    <div>
                      <span className="text-slate-500">מצב איטום:</span> {selectedInspection.sealing_status ? '✓' : '✗'}
                    </div>
                    <div>
                      <span className="text-slate-500">ברגי איטום סגורים:</span> {selectedInspection.sealing_screws_closed ? '✓' : '✗'}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">בדיקות צב"ד</h4>
                  <Badge className={
                    selectedInspection.cavad_status === 'passed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {selectedInspection.cavad_status === 'passed' ? 'עבר' : 'נכשל'}
                  </Badge>
                  {selectedInspection.cavad_tests?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedInspection.cavad_tests.map((test, i) => (
                        <div key={i} className="p-3 bg-red-50 rounded-lg text-sm">
                          <span className="font-medium">בדיקה #{test.test_number}:</span>{' '}
                          גבולות: {test.lower_limit} - {test.upper_limit}, נמדד: {test.measured_value}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">בדיקות תפקוד</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {[
                      { key: 'encryption_check', label: 'הצפנה' },
                      { key: 'frequencies_check', label: 'תדרים' },
                      { key: 'side_connector_closed', label: 'מחבר צד' },
                      { key: 'communication_test', label: 'בדיקת קשר' },
                      { key: 'battery_replaced', label: 'סוללה הוחלפה' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        {selectedInspection[key] ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-300" />
                        )}
                        {label}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedInspection.fault_description && selectedInspection.fault_description !== 'אין' && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">תקלות</h4>
                    <p className="p-3 bg-amber-50 rounded-lg">{selectedInspection.fault_description}</p>
                  </div>
                )}

                {selectedInspection.remarks && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">הערות</h4>
                    <p className="p-3 bg-slate-50 rounded-lg">{selectedInspection.remarks}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">חתימות</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {selectedInspection.soldier_signature?.signature_data && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-2">חתימת חייל</p>
                        <p className="font-medium">{selectedInspection.soldier_signature.name}</p>
                        <p className="text-sm text-slate-500">{selectedInspection.soldier_signature.personal_number}</p>
                        <img 
                          src={selectedInspection.soldier_signature.signature_data} 
                          alt="חתימה" 
                          className="mt-2 max-h-16 border rounded"
                        />
                      </div>
                    )}
                    {selectedInspection.supervisor_signature?.signature_data && (
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-sm text-slate-500 mb-2">חתימת מפקח</p>
                        <p className="font-medium">{selectedInspection.supervisor_signature.name}</p>
                        <p className="text-sm text-slate-500">{selectedInspection.supervisor_signature.personal_number}</p>
                        <img 
                          src={selectedInspection.supervisor_signature.signature_data} 
                          alt="חתימה" 
                          className="mt-2 max-h-16 border rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}