import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, ArrowRight, Settings as SettingsIcon, CheckCircle, XCircle, MinusCircle, Radio, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';

export default function Routine() {
  const queryClient = useQueryClient();
  const [managerMode, setManagerMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', description: '' });
  const [manageDevices, setManageDevices] = useState(null);

  const { data: cards = [] } = useQuery({
    queryKey: ['routineCards'],
    queryFn: () => base44.entities.RoutineCard.filter({ is_active: true }, 'order'),
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });

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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <MinusCircle className="w-6 h-6 text-slate-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'passed':
        return 'עבר';
      case 'failed':
        return 'נכשל';
      default:
        return 'לא בוצע';
    }
  };

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{selectedCard.title}</h2>
                <p className="text-slate-500 mt-2">{selectedCard.description}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setManageDevices(selectedCard)}
              >
                <Radio className="w-4 h-4 ml-2" />
                נהל מכשירים ({(selectedCard.devices || []).length})
              </Button>
            </div>
            {(selectedCard.devices || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedCard.devices.map((serial) => (
                  <Badge key={serial} variant="secondary">{serial}</Badge>
                ))}
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
                  <CardContent className="p-6 text-center space-y-3">
                    {getStatusIcon(sub.status)}
                    <h3 className="font-semibold text-slate-800">{sub.title}</h3>
                    <Badge variant="outline">{getStatusLabel(sub.status)}</Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
                        placeholder="תיאור"
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
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>ניהול מכשירים - {manageDevices.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="flex flex-wrap gap-2 mb-4">
                  {(manageDevices.devices || []).map((serial) => (
                    <Badge
                      key={serial}
                      variant="secondary"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => {
                        const updated = {
                          ...manageDevices,
                          devices: manageDevices.devices.filter(s => s !== serial)
                        };
                        setManageDevices(updated);
                      }}
                    >
                      {serial}
                      <Trash2 className="w-3 h-3 mr-1" />
                    </Badge>
                  ))}
                </div>
                <ScrollArea className="h-96 border rounded-xl p-4">
                  <div className="space-y-2">
                    {devices.map((device) => {
                      const isSelected = (manageDevices.devices || []).includes(device.serial_number);
                      return (
                        <div
                          key={device.id}
                          onClick={() => {
                            const currentDevices = manageDevices.devices || [];
                            const updated = {
                              ...manageDevices,
                              devices: isSelected
                                ? currentDevices.filter(s => s !== device.serial_number)
                                : [...currentDevices, device.serial_number]
                            };
                            setManageDevices(updated);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-slate-50 border-2 border-transparent'
                          }`}
                        >
                          <Checkbox checked={isSelected} className="pointer-events-none" />
                          <div className="flex-1">
                            <p className="font-medium">{device.serial_number}</p>
                            <p className="text-xs text-slate-500">{device.device_name || device.device_group}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <Button
                  onClick={() => {
                    updateMutation.mutate({ 
                      id: manageDevices.id, 
                      data: { devices: manageDevices.devices || [] }
                    });
                    setManageDevices(null);
                    if (selectedCard?.id === manageDevices.id) {
                      setSelectedCard(manageDevices);
                    }
                  }}
                  className="w-full"
                >
                  שמור שינויים
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}