import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Edit, ArrowRight, Settings as SettingsIcon, Radio, CheckCircle, XCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import DeviceManager from '../components/DeviceManager';

export default function Special() {
  const queryClient = useQueryClient();
  const [managerMode, setManagerMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', description: '' });
  const [manageDevices, setManageDevices] = useState(null);

  const { data: cards = [] } = useQuery({
    queryKey: ['specialCards'],
    queryFn: () => base44.entities.SpecialCard.filter({ is_active: true }, 'order'),
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SpecialCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialCards'] });
      setIsAddOpen(false);
      setNewCard({ title: '', description: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SpecialCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialCards'] });
      setEditingCard(null);
    },
  });

  if (selectedCard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedCard(null)}
            className="mb-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          
          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-3xl font-bold text-slate-800">{selectedCard.title}</h2>
              <p className="text-slate-500 mt-1">{selectedCard.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {(selectedCard.devices || []).map((serial) => {
                const device = devices.find(d => d.serial_number === serial);
                const isCompleted = (device?.total_inspections || 0) > 0;
                
                return (
                  <div 
                    key={serial} 
                    onClick={() => {
                      if (!managerMode) {
                        // Navigate to checklist
                        window.location.href = createPageUrl(`DeviceInspection?serial=${serial}&source=special`);
                      }
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 text-center shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                      isCompleted 
                        ? 'bg-emerald-50 border-emerald-100 hover:shadow-emerald-100' 
                        : 'bg-red-50 border-red-100 hover:shadow-red-100'
                    }`}
                  >
                    <span className="font-mono font-bold text-lg text-slate-800">{serial}</span>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      isCompleted ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          <span>הושלם</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>לביצוע</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              
              <Button
                variant="outline"
                onClick={() => setManageDevices(selectedCard)}
                className="h-auto min-h-[80px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 flex flex-col gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium">הוסף</span>
              </Button>
            </div>
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
          <h1 className="text-3xl font-bold text-slate-800">מיוחד</h1>
          <div className="flex gap-2">
            <Button
              variant={managerMode ? 'default' : 'outline'}
              onClick={() => setManagerMode(!managerMode)}
            >
              <SettingsIcon className="w-4 h-4 ml-2" />
              {managerMode ? 'סגור ניהול' : 'מצב ניהול'}
            </Button>
            {managerMode && (
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-xl transition-all h-48 relative group ${
                  managerMode ? 'border-2 border-amber-200' : ''
                }`}
                onClick={() => !managerMode && setSelectedCard(card)}
              >
                <CardContent className="p-6 h-full flex flex-col justify-center">
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
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
                    {card.title}
                  </h2>
                  <p className="text-slate-600 text-center text-sm line-clamp-3">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
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