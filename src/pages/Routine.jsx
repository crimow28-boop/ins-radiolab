import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, ArrowRight, Settings as SettingsIcon, Radio, CheckCircle, XCircle, Shield } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceManager from '../components/DeviceManager';
import { chunk } from 'lodash';
import { toast } from 'sonner';

export default function Routine() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [managerMode, setManagerMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', description: '' });
  const [manageDevices, setManageDevices] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: cards = [] } = useQuery({
    queryKey: ['routineCards'],
    queryFn: () => base44.entities.RoutineCard.filter({ is_active: true }, 'order'),
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });
  
  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections_summary'],
    queryFn: () => base44.entities.Inspection.list(), // We fetch all for simplicity, or filter by source if possible
  });
  
  const { data: pinSettings, refetch: refetchPin } = useQuery({
    queryKey: ['system_settings_pin'],
    queryFn: async () => {
       const res = await base44.entities.SystemSettings.filter({ key: 'manager_pin' });
       return res[0];
    },
    enabled: !!(user?.role === 'admin') // Only fetch if admin/manager
  });

  const getDeviceProgress = (serial, cardIdToData = null) => {
    // Find latest inspection scoped to the card
    let relevantInspections = inspections.filter(i => i.device_serial_numbers?.includes(serial));
    
    const targetCardId = cardIdToData || selectedCard?.id;
    if (targetCardId) {
       relevantInspections = relevantInspections.filter(i => i.card_id === targetCardId);
    }

    if (!relevantInspections.length) return { status: 'none', progress: 0 };
    
    // Check for draft
    const draft = relevantInspections.find(i => i.status === 'draft');
    if (draft) return { status: 'draft', progress: draft.progress || 0 };
    
    // Check for completed
    const completed = relevantInspections.filter(i => i.status === 'completed' || !i.status);
    if (completed.length > 0) return { status: 'completed', progress: 100 };
    
    return { status: 'none', progress: 0 };
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RoutineCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCards'] });
      setIsAddOpen(false);
      setNewCard({ title: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RoutineCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCards'] });
      setEditingCard(null);
    },
  });

  const handlePinSubmit = async () => {
    // Verify PIN
    const res = await base44.entities.SystemSettings.filter({ key: 'manager_pin', value: pinCode });
    if (res.length > 0) {
      // Correct PIN
      toast.success("אושר בהצלחה");
      setPinError(false);
      
      // Rotate PIN
      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      await base44.entities.SystemSettings.update(res[0].id, { value: newPin });
      
      // Archive the card
      if (selectedCard) {
        await base44.entities.RoutineCard.update(selectedCard.id, { is_active: false });
        queryClient.invalidateQueries({ queryKey: ['routineCards'] });
        setSelectedCard(null);
        toast.success("הכרטיס אושר והועבר להיסטוריה");
      }

      refetchPin();
      setPinCode('');
    } else {
      setPinError(true);
      toast.error("קוד שגוי");
    }
  };

  if (selectedCard) {
    const cardDevices = selectedCard.devices || [];
    const allCompleted = cardDevices.length > 0 && cardDevices.every(serial => {
       const { status } = getDeviceProgress(serial);
       return status === 'completed';
    });

    return (
      <div className="min-h-screen bg-slate-100 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedCard(null)}
            className="mb-6 rounded-none hover:bg-slate-200"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-slate-800">{selectedCard.title}</h2>
              <p className="text-slate-500 mt-1">{selectedCard.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              {cardDevices.map((serial) => {
                const { status, progress } = getDeviceProgress(serial);
                const isCompleted = status === 'completed';
                const isDraft = status === 'draft';
                
                return (
                  <div 
                    key={serial} 
                    onClick={() => {
                      if (!managerMode) {
                        navigate(createPageUrl(`DeviceInspection?serial=${serial}&source=routine&cardId=${selectedCard.id}&cardTitle=${encodeURIComponent(selectedCard.title)}`));
                      }
                    }}
                    className={`p-4 border border-slate-400 flex flex-col items-center justify-center gap-2 text-center shadow-sm cursor-pointer hover:bg-slate-50 ${
                      isCompleted ? 'bg-emerald-50' : 'bg-white'
                    }`}
                  >
                    <span className="font-mono font-bold text-lg text-slate-800">{serial}</span>
                    
                    <div className="w-full bg-slate-200 h-2 mt-1">
                      <div 
                        className={`h-2 transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      isCompleted ? 'text-emerald-700' : (isDraft ? 'text-blue-700' : 'text-slate-500')
                    }`}>
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>הושלם</span>
                        </>
                      ) : isDraft ? (
                        <>
                           <span>בתהליך {progress}%</span>
                        </>
                      ) : (
                        <span>לביצוע</span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setManageDevices(selectedCard)}
                className="h-full min-h-[100px] border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 flex flex-col gap-2 rounded-none"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">הוסף מכשיר</span>
              </Button>
            </div>

            {/* Manager Approval Section */}
            {allCompleted && (
               <div className="mt-12 p-6 bg-white border border-slate-400 max-w-md mx-auto text-center">
                 <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
                   <Shield className="w-5 h-5 text-blue-900" />
                   אישור נגד / מנהל
                 </h3>
                 <p className="text-sm text-slate-500 mb-4">כל המכשירים בכרטיס זה נבדקו. נדרש אישור מנהל.</p>
                 
                 {user?.role === 'admin' && pinSettings && (
                   <div className="mb-4 p-2 bg-blue-50 text-blue-800 text-sm font-mono border border-blue-200">
                     קוד נוכחי (למנהל בלבד): {pinSettings.value}
                   </div>
                 )}

                 <div className="flex gap-2 justify-center">
                   <Input 
                      type="password" 
                      maxLength={4}
                      className="w-32 text-center text-lg tracking-widest rounded-none border-slate-400"
                      placeholder="PIN"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                   />
                   <Button 
                     onClick={handlePinSubmit}
                     className="bg-blue-900 hover:bg-blue-800 rounded-none"
                   >
                     אשר
                   </Button>
                 </div>
               </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(selectedCard.sub_cards || []).map((sub, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-400">
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-slate-800">{sub.title}</h3>
                    {sub.status && (
                      <p className="text-xs text-slate-500 mt-2">{sub.status}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {manageDevices && (
            <Dialog open={!!manageDevices} onOpenChange={() => setManageDevices(null)}>
              <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-4 sm:p-6" dir="rtl">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>ניהול מכשירים - {manageDevices.title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden min-h-0 mt-2">
                  <DeviceManager
                    devices={devices}
                    selectedDevices={manageDevices.devices || []}
                    onUpdate={(updatedDevices) => {
                      updateMutation.mutate({ 
                        id: manageDevices.id, 
                        data: { devices: updatedDevices }
                      });
                      setManageDevices(null);
                      if (selectedCard?.id === manageDevices.id) {
                        setSelectedCard({ ...manageDevices, devices: updatedDevices });
                      }
                    }}
                    onCancel={() => setManageDevices(null)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">שגרה</h1>
          <div className="flex gap-2">
            {user?.role === 'admin' && (
              <Button
                variant={managerMode ? 'default' : 'outline'}
                onClick={() => setManagerMode(!managerMode)}
              >
                <SettingsIcon className="w-4 h-4 ml-2" />
                {managerMode ? 'סגור ניהול' : 'מצב ניהול'}
              </Button>
            )}
            {managerMode && user?.role === 'admin' && (
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 ml-2" />
                    כרטיס חדש
                  </Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader>
                    <DialogTitle>כרטיס חדש</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>כותרת</Label>
                      <Input
                        value={newCard.title}
                        onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                        placeholder="כותרת הכרטיס"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>תיאור</Label>
                      <Textarea
                        value={newCard.description}
                        onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                        placeholder="תיאור חופשי"
                      />
                    </div>
                    <Button
                      onClick={() => createMutation.mutate(newCard)}
                      disabled={!newCard.title}
                      className="w-full"
                    >
                      צור כרטיס
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div
                className={`cursor-pointer bg-white border border-slate-400 h-40 relative group hover:bg-blue-50 transition-colors p-6 flex flex-col justify-center items-center text-center ${
                  managerMode ? 'border-amber-400 border-2' : ''
                }`}
                onClick={() => !managerMode && setSelectedCard(card)}
              >
                  {managerMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCard(card);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <h2 className="text-xl font-bold text-slate-800 mb-2">
                    {card.title}
                  </h2>
                  <p className="text-slate-600 text-sm line-clamp-2">
                    {card.description}
                  </p>

                  {/* Summary Progress */}
                  {card.devices?.length > 0 && (
                    <div className="w-full mt-4 flex flex-col gap-1">
                       {chunk(card.devices, 10).map((deviceChunk, idx) => (
                         <div key={idx} className="flex gap-1 h-1.5 justify-center w-full">
                           {deviceChunk.map(d => {
                             const { status } = getDeviceProgress(d, card.id);
                             return (
                               <div key={d} className={`flex-1 ${
                                 status === 'completed' ? 'bg-emerald-500' : 
                                 status === 'draft' ? 'bg-blue-400' : 'bg-slate-200'
                               }`}></div>
                             )
                           })}
                         </div>
                       ))}
                    </div>
                  )}
                  </div>
                  </motion.div>
                  ))}
                  </div>

        {editingCard && (
          <Dialog open={!!editingCard} onOpenChange={() => setEditingCard(null)}>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>עריכת כרטיס</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>כותרת</Label>
                  <Input
                    value={editingCard.title}
                    onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea
                    value={editingCard.description}
                    onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => updateMutation.mutate({ id: editingCard.id, data: editingCard })}
                  className="w-full"
                >
                  שמור שינויים
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {manageDevices && (
          <Dialog open={!!manageDevices} onOpenChange={() => setManageDevices(null)}>
            <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-4 sm:p-6" dir="rtl">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>ניהול מכשירים - {manageDevices.title}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden min-h-0 mt-2">
                <DeviceManager
                devices={devices}
                selectedDevices={manageDevices.devices || []}
                onUpdate={(updatedDevices) => {
                  updateMutation.mutate({ 
                    id: manageDevices.id, 
                    data: { devices: updatedDevices }
                  });
                  setManageDevices(null);
                  if (selectedCard?.id === manageDevices.id) {
                    setSelectedCard({ ...manageDevices, devices: updatedDevices });
                  }
                }}
                onCancel={() => setManageDevices(null)}
              />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}