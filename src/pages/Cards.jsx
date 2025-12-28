import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Edit, ArrowRight, Settings as SettingsIcon, CheckCircle, XCircle, Shield, Calendar, Star, Download } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import DeviceManager from '../components/DeviceManager';
import CardExportDialog from '../components/cards/CardExportDialog';
import { chunk } from 'lodash';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Cards() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [managerMode, setManagerMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCard, setNewCard] = useState({ title: '', description: '', type: 'routine' });
  const [manageDevices, setManageDevices] = useState(null);
  const [pinCode, setPinCode] = useState('');
  const [deviceToReplace, setDeviceToReplace] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_group: '713', serial_number: '' });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: routineCards = [] } = useQuery({
    queryKey: ['routineCards'],
    queryFn: () => base44.entities.RoutineCard.filter({ is_active: true }, 'order')
  });

  const { data: specialCards = [] } = useQuery({
    queryKey: ['specialCards'],
    queryFn: () => base44.entities.SpecialCard.filter({ is_active: true }, 'order')
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list()
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections_summary'],
    queryFn: () => base44.entities.Inspection.list()
  });

  const { data: checklists = [] } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => base44.entities.InspectionChecklist.list()
  });

  const { data: pinSettings, refetch: refetchPin } = useQuery({
    queryKey: ['system_settings_pin'],
    queryFn: async () => {
      const res = await base44.entities.SystemSettings.filter({ key: 'manager_pin' });
      return res[0];
    },
    enabled: !!(user?.role === 'admin')
  });

  const getCardDeviceProgress = (serial, cardId) => {
    const deviceInspections = inspections.filter((i) =>
    i.device_serial_numbers?.includes(serial) &&
    i.card_id === cardId
    ).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

    if (!deviceInspections.length) return { status: 'none', progress: 0 };

    const latest = deviceInspections[0];

    if (latest.status === 'draft') return { status: 'draft', progress: latest.progress || 0 };

    if (latest.status === 'completed' || !latest.status) {
      if (latest.cavad_status === 'failed') return { status: 'failed', progress: 100 };
      return { status: 'completed', progress: 100 };
    }

    return { status: 'none', progress: 0 };
  };

  const createRoutineMutation = useMutation({
    mutationFn: (data) => base44.entities.RoutineCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCards'] });
      setIsAddOpen(false);
      setNewCard({ title: '', description: '', type: 'routine' });
    }
  });

  const createSpecialMutation = useMutation({
    mutationFn: (data) => base44.entities.SpecialCard.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialCards'] });
      setIsAddOpen(false);
      setNewCard({ title: '', description: '', type: 'routine' });
    }
  });

  const updateRoutineMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RoutineCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routineCards'] });
      setEditingCard(null);
    }
  });

  const updateSpecialMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SpecialCard.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['specialCards'] });
      setEditingCard(null);
    }
  });

  const createDeviceMutation = useMutation({
    mutationFn: (data) => base44.entities.Device.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('המכשיר נוסף');
      setAddDeviceOpen(false);
      setNewDevice({ device_group: '713', serial_number: '' });
    }
  });

  const handleCreateCard = () => {
    const { type, ...cardData } = newCard;
    if (type === 'routine') {
      createRoutineMutation.mutate(cardData);
    } else {
      createSpecialMutation.mutate(cardData);
    }
  };

  const handleUpdateCard = (card, data) => {
    if (card.cardType === 'routine') {
      updateRoutineMutation.mutate({ id: card.id, data });
    } else {
      updateSpecialMutation.mutate({ id: card.id, data });
    }
  };

  const handlePinSubmit = async () => {
    const res = await base44.entities.SystemSettings.filter({ key: 'manager_pin', value: pinCode });
    if (res.length > 0) {
      toast.success("אושר בהצלחה");

      const newPin = Math.floor(1000 + Math.random() * 9000).toString();
      await base44.entities.SystemSettings.update(res[0].id, { value: newPin });

      if (selectedCard) {
        if (selectedCard.cardType === 'routine') {
          await base44.entities.RoutineCard.update(selectedCard.id, { is_active: false });
          queryClient.invalidateQueries({ queryKey: ['routineCards'] });
        } else {
          await base44.entities.SpecialCard.update(selectedCard.id, { is_active: false });
          queryClient.invalidateQueries({ queryKey: ['specialCards'] });
        }
        setSelectedCard(null);
        toast.success("הכרטיס אושר והועבר להיסטוריה");
      }

      refetchPin();
      setPinCode('');
    } else {
      toast.error("קוד שגוי");
    }
  };

  // Combine cards with type indicator
  const allRoutineCards = routineCards.map((c) => ({ ...c, cardType: 'routine' }));
  const allSpecialCards = specialCards.map((c) => ({ ...c, cardType: 'special' }));

  if (selectedCard) {
    const cardDevices = selectedCard.devices || [];
    const allCompleted = cardDevices.length > 0 && cardDevices.every((serial) => {
      const { status } = getCardDeviceProgress(serial, selectedCard.id);
      return status === 'completed';
    });

    return (
      <div className="min-h-screen bg-slate-100 p-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setSelectedCard(null)}
            className="mb-6 rounded-none hover:bg-slate-200">

            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה
          </Button>
          
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedCard.cardType === 'routine' ? 'bg-emerald-100' : 'bg-amber-100'}`
              }>
                {selectedCard.cardType === 'routine' ?
                <Calendar className="w-5 h-5 text-emerald-600" /> :

                <Star className="w-5 h-5 text-amber-600" />
                }
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-800">{selectedCard.title}</h2>
                <p className="text-slate-500 mt-1">{selectedCard.description}</p>
              </div>
              <div className="mr-auto"></div>
              <Button variant="outline" onClick={() => setExportOpen(true)} className="rounded-none">
                <Download className="w-4 h-4 ml-2" />
                ייצוא טבלה
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-4">
              {cardDevices.map((serial) => {
                const { status, progress } = getCardDeviceProgress(serial, selectedCard.id);
                const isCompleted = status === 'completed';
                const isDraft = status === 'draft';
                const isFailed = status === 'failed';

                return (
                  <div
                    key={serial}
                    onClick={() => {
                      if (!managerMode) {
                        if (isFailed) {
                          setDeviceToReplace({ serial, cardId: selectedCard.id, cardType: selectedCard.cardType });
                        } else {
                          navigate(createPageUrl(`DeviceInspection?serial=${serial}&source=${selectedCard.cardType}&cardId=${selectedCard.id}&cardTitle=${encodeURIComponent(selectedCard.title)}`));
                        }
                      }
                    }}
                    className={`p-4 border border-slate-400 flex flex-col items-center justify-center gap-2 text-center shadow-sm cursor-pointer hover:bg-slate-50 ${
                    isCompleted ? 'bg-emerald-50' : isFailed ? 'bg-red-50' : 'bg-white'}`
                    }>

                    <span className="font-mono font-bold text-lg text-slate-800">{serial}</span>
                    
                    <div className="w-full bg-slate-200 h-2 mt-1">
                      <div
                        className={`h-2 transition-all ${isCompleted ? 'bg-emerald-500' : isFailed ? 'bg-red-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}>
                      </div>
                    </div>
                    
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                    isCompleted ? 'text-emerald-700' : isFailed ? 'text-red-700' : isDraft ? 'text-blue-700' : 'text-slate-500'}`
                    }>
                      {isCompleted ?
                      <>
                          <CheckCircle className="w-3 h-3" />
                          <span>הושלם</span>
                        </> :
                      isFailed ?
                      <>
                          <XCircle className="w-3 h-3" />
                          <span>נכשל</span>
                        </> :
                      isDraft ?
                      <>
                           <span>בתהליך {progress}%</span>
                        </> :

                      <span>לביצוע</span>
                      }
                    </div>
                  </div>);

              })}
              
              <Button
                variant="outline"
                onClick={() => setManageDevices(selectedCard)}
                className="h-full min-h-[100px] border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-600 flex flex-col gap-2 rounded-none">

                <Plus className="w-5 h-5" />
                <span className="font-medium">הוסף מכשיר</span>
              </Button>
            </div>

            {allCompleted &&
            <div className="mt-12 p-6 bg-white border border-slate-400 max-w-md mx-auto text-center">
                 <h3 className="text-xl font-bold mb-4 flex items-center justify-center gap-2">
                   <Shield className="w-5 h-5 text-blue-900" />
                   אישור נגד / מנהל
                 </h3>
                 <p className="text-sm text-slate-500 mb-4">כל המכשירים בכרטיס זה נבדקו. נדרש אישור מנהל.</p>
                 
                 {user?.role === 'admin' && pinSettings &&
              <div className="mb-4 p-2 bg-blue-50 text-blue-800 text-sm font-mono border border-blue-200">
                     קוד נוכחי (למנהל בלבד): {pinSettings.value}
                   </div>
              }

                 <div className="flex gap-2 justify-center">
                   <Input
                  type="password"
                  maxLength={4}
                  className="w-32 text-center text-lg tracking-widest rounded-none border-slate-400"
                  placeholder="PIN"
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)} />

                   <Button
                  onClick={handlePinSubmit}
                  className="bg-blue-900 hover:bg-blue-800 rounded-none">

                     אשר
                   </Button>
                 </div>
               </div>
            }
          </div>

          {manageDevices &&
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
                    handleUpdateCard(manageDevices, { devices: updatedDevices });
                    setManageDevices(null);
                    if (selectedCard?.id === manageDevices.id) {
                      setSelectedCard({ ...manageDevices, devices: updatedDevices });
                    }
                  }}
                  onCancel={() => setManageDevices(null)} />

                </div>
              </DialogContent>
            </Dialog>
          }

          {deviceToReplace &&
          <Dialog open={!!deviceToReplace} onOpenChange={() => setDeviceToReplace(null)}>
               <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-4 sm:p-6" dir="rtl">
                 <DialogHeader className="flex-shrink-0">
                    <DialogTitle>החלפת מכשיר {deviceToReplace.serial}</DialogTitle>
                 </DialogHeader>
                 <div className="p-4 bg-amber-50 text-amber-800 rounded-lg mb-2 text-sm">
                    המכשיר הנוכחי נכשל בבדיקה. אנא בחר מכשיר חלופי מהרשימה.
                 </div>
                 <div className="flex-1 overflow-hidden min-h-0 mt-2">
                   <DeviceManager
                  devices={devices}
                  selectedDevices={[deviceToReplace.serial]}
                  onUpdate={(updatedDevices) => {
                    if (updatedDevices.length !== 1) {
                      toast.error("אנא בחר מכשיר אחד בלבד להחלפה");
                      return;
                    }

                    const newSerial = updatedDevices[0];

                    if (newSerial === deviceToReplace.serial) {
                      toast.error("אנא בחר מכשיר אחר");
                      return;
                    }

                    const currentDevices = selectedCard.devices || [];
                    const newDeviceList = currentDevices.map((d) => d === deviceToReplace.serial ? newSerial : d);

                    handleUpdateCard(selectedCard, { devices: newDeviceList });
                    setSelectedCard({ ...selectedCard, devices: newDeviceList });

                    toast.success(`המכשיר הוחלף בהצלחה ל-${newSerial}`);
                    setDeviceToReplace(null);
                  }}
                  onCancel={() => setDeviceToReplace(null)} />

                 </div>
               </DialogContent>
            </Dialog>
          }

          {exportOpen &&
          <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogContent className="max-w-5xl p-4 sm:p-6" dir="rtl">
                <DialogHeader>
                  <DialogTitle>ייצוא טבלה - {selectedCard.title}</DialogTitle>
                </DialogHeader>
                <CardExportDialog card={selectedCard} inspections={inspections} checklists={checklists} />
              </DialogContent>
            </Dialog>
          }
            {user?.role === 'admin' &&
          <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 ml-2" />
                  מכשיר חדש
                </Button>
              </DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader>
                  <DialogTitle>מכשיר חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>סוג מכשיר</Label>
                    <Select value={newDevice.device_group} onValueChange={(val) => setNewDevice({ ...newDevice, device_group: val })}>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר סוג" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="713">713</SelectItem>
                        <SelectItem value="710">710</SelectItem>
                        <SelectItem value="711">711</SelectItem>
                        <SelectItem value="hargol">hargol</SelectItem>
                        <SelectItem value="elal">elal</SelectItem>
                        <SelectItem value="lotus">lotus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>מספר סידורי</Label>
                    <Input value={newDevice.serial_number} onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })} placeholder="לדוגמה: 12345" />
                  </div>
                  <Button
                  onClick={() => createDeviceMutation.mutate({ serial_number: newDevice.serial_number.trim(), device_group: newDevice.device_group })}
                  disabled={!newDevice.serial_number?.trim()}
                  className="w-full">

                    הוסף מכשיר
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          }
            </div>
      </div>);

  }

  const renderCardGrid = (cards, title, icon, bgColor) =>
  <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColor}`}>
          {icon}
        </div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <span className="text-sm text-slate-500">({cards.length})</span>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) =>
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}>

            <div
          className={`cursor-pointer bg-white border border-slate-400 h-40 relative group hover:bg-blue-50 transition-colors p-6 flex flex-col justify-center items-center text-center ${
          managerMode ? 'border-amber-400 border-2' : ''}`
          }
          onClick={() => !managerMode && setSelectedCard(card)}>

                {managerMode &&
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCard(card);
            }}>

                    <Edit className="w-4 h-4" />
                  </Button>
          }
                <h2 className="text-xl font-bold text-slate-800 mb-2">
                  {card.title}
                </h2>
                <p className="text-slate-600 text-sm line-clamp-2">
                  {card.description}
                </p>

                {card.devices?.length > 0 &&
          <div className="w-full mt-4 flex flex-col gap-1">
                     {chunk(card.devices, 10).map((deviceChunk, idx) =>
            <div key={idx} className="flex gap-1 h-1.5 justify-center w-full">
                         {deviceChunk.map((d) => {
                const { status } = getCardDeviceProgress(d, card.id);
                return (
                  <div key={d} className={`flex-1 ${
                  status === 'completed' ? 'bg-emerald-500' :
                  status === 'failed' ? 'bg-red-500' :
                  status === 'draft' ? 'bg-blue-400' : 'bg-slate-200'}`
                  }></div>);

              })}
                       </div>
            )}
                  </div>
          }
            </div>
          </motion.div>
      )}
      </div>
    </div>;


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800">קליטת מכשירים</h1>
          <div className="flex gap-2">
            {user?.role === 'admin' &&
            <Button
              variant={managerMode ? 'default' : 'outline'}
              onClick={() => setManagerMode(!managerMode)}>

                <SettingsIcon className="w-4 h-4 ml-2" />
                {managerMode ? 'סגור ניהול' : 'מצב ניהול'}
              </Button>
            }
            {managerMode && user?.role === 'admin' &&
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
                      <Label>סוג כרטיס</Label>
                      <RadioGroup
                      value={newCard.type}
                      onValueChange={(val) => setNewCard({ ...newCard, type: val })}
                      className="flex gap-4">

                        <div className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 [&:has(:checked)]:bg-emerald-50 [&:has(:checked)]:border-emerald-300">
                          <RadioGroupItem value="routine" id="routine" />
                          <Label htmlFor="routine" className="cursor-pointer flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            שגרה
                          </Label>
                        </div>
                        <div className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 [&:has(:checked)]:bg-amber-50 [&:has(:checked)]:border-amber-300">
                          <RadioGroupItem value="special" id="special" />
                          <Label htmlFor="special" className="cursor-pointer flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-600" />
                            מיוחד
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="space-y-2">
                      <Label>כותרת</Label>
                      <Input
                      value={newCard.title}
                      onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                      placeholder="כותרת הכרטיס" />

                    </div>
                    <div className="space-y-2">
                      <Label>תיאור</Label>
                      <Textarea
                      value={newCard.description}
                      onChange={(e) => setNewCard({ ...newCard, description: e.target.value })}
                      placeholder="תיאור חופשי" />

                    </div>
                    <Button
                    onClick={handleCreateCard}
                    disabled={!newCard.title}
                    className="w-full">

                      צור כרטיס
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            }
          </div>
        </div>

        {renderCardGrid(
          allRoutineCards,
          'שגרה',
          <Calendar className="w-4 h-4 text-emerald-600" />,
          'bg-emerald-100'
        )}

        {renderCardGrid(
          allSpecialCards,
          'מיוחד',
          <Star className="w-4 h-4 text-amber-600" />,
          'bg-amber-100'
        )}

        {editingCard &&
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
                  onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })} />

                </div>
                <div className="space-y-2">
                  <Label>תיאור</Label>
                  <Textarea
                  value={editingCard.description}
                  onChange={(e) => setEditingCard({ ...editingCard, description: e.target.value })} />

                </div>
                <Button
                onClick={() => handleUpdateCard(editingCard, { title: editingCard.title, description: editingCard.description })}
                className="w-full">

                  שמור שינויים
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      </div>
    </div>);

}