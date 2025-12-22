import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowRight, 
  Plus, 
  Search, 
  Package, 
  Radio,
  Edit,
  Trash2,
  History,
  Shield,
  AlertTriangle,
  Wifi,
  Loader2,
  Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import BarcodeScanner from '../components/BarcodeScanner';

const GROUP_OPTIONS = [
  { value: '713', label: '713' },
  { value: '710', label: '710' },
  { value: '711', label: '711' },
  { value: 'hargol', label: 'חרגול' },
  { value: 'elal', label: 'אל-על' },
  { value: 'lotus', label: 'לוטוס' },
];

export default function Devices() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [newDevice, setNewDevice] = useState({
    serial_number: '',
    device_group: '',
    device_name: '',
    ip_address: '',
    status: 'active',
    encryption_status: 'not_encrypted',
  });

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['faults'],
    queryFn: () => base44.entities.FaultHistory.filter({ resolved: false }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Device.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsAddOpen(false);
      setNewDevice({
        serial_number: '',
        device_group: '',
        device_name: '',
        ip_address: '',
        status: 'active',
        encryption_status: 'not_encrypted',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Device.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setEditingDevice(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Device.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.device_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || device.device_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const getDeviceFaults = (serialNumber) => {
    return faults.filter(f => f.device_serial_number === serialNumber);
  };

  const groupLabels = {
    '713': '713',
    '710': '710',
    '711': '711',
    'hargol': 'חרגול',
    'elal': 'אל-על',
    'lotus': 'לוטוס'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20 lg:pb-0" dir="rtl">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
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
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">מלאי מכשירים</h1>
                  <p className="text-sm text-slate-500">{devices.length} מכשירים במערכת</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="bg-white border-0 shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חפש לפי מספר סידורי..."
                  className="h-12 pr-10 rounded-xl"
                />
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl">
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף מכשיר
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>הוספת מכשיר חדש</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>מספר סידורי (צ')</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newDevice.serial_number}
                          onChange={(e) => setNewDevice({ ...newDevice, serial_number: e.target.value })}
                          placeholder="הזן מספר סידורי"
                          className="h-12 rounded-xl flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 px-4 rounded-xl"
                          onClick={() => setShowScanner(true)}
                        >
                          <Camera className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>קבוצת מכשיר</Label>
                      <Select
                        value={newDevice.device_group}
                        onValueChange={(v) => setNewDevice({ ...newDevice, device_group: v })}
                      >
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="בחר קבוצה" />
                        </SelectTrigger>
                        <SelectContent>
                          {GROUP_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>שם מכשיר (אופציונלי)</Label>
                      <Input
                        value={newDevice.device_name}
                        onChange={(e) => setNewDevice({ ...newDevice, device_name: e.target.value })}
                        placeholder="שם מכשיר"
                        className="h-12 rounded-xl"
                      />
                    </div>
                    {(newDevice.device_group === 'hargol') && (
                      <div className="space-y-2">
                        <Label>כתובת IP</Label>
                        <Input
                          value={newDevice.ip_address}
                          onChange={(e) => setNewDevice({ ...newDevice, ip_address: e.target.value })}
                          placeholder="192.168.X.X"
                          className="h-12 rounded-xl"
                        />
                      </div>
                    )}
                    <Button
                      onClick={() => createMutation.mutate(newDevice)}
                      disabled={!newDevice.serial_number || !newDevice.device_group || createMutation.isPending}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'הוסף מכשיר'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterGroup === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterGroup('all')}
                  className="rounded-full"
                >
                  הכל
                </Button>
                {GROUP_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={filterGroup === opt.value ? 'default' : 'outline'}
                    onClick={() => setFilterGroup(opt.value)}
                    className="rounded-full"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>לא נמצאו מכשירים</p>
            </div>
          ) : (
            filteredDevices.map((device, index) => {
              const deviceFaults = getDeviceFaults(device.serial_number);
              return (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-blue-600">
                            <Radio className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-lg font-mono">{device.serial_number}</div>
                            <div className="text-sm text-slate-500">{device.device_name || 'ללא שם'}</div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-white">
                          {groupLabels[device.device_group] || device.device_group}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block text-xs mb-1">סטטוס</span>
                          <div className={`flex items-center gap-1.5 font-medium ${
                            device.status === 'active' ? 'text-emerald-600' : 'text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              device.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {device.status === 'active' ? 'פעיל' : device.status}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg">
                          <span className="text-slate-400 block text-xs mb-1">הצפנה</span>
                          {device.encryption_status === 'encrypted' ? (
                            <div className="flex items-center gap-1 text-indigo-600 font-medium">
                              <Shield className="w-3 h-3" />
                              מוצפן
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-slate-500">
                              <Shield className="w-3 h-3 opacity-50" />
                              לא מוצפן
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span>{device.total_inspections || 0} בדיקות</span>
                          {deviceFaults.length > 0 && (
                            <span className="text-red-500 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {deviceFaults.length} תקלות
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Link to={createPageUrl(`DeviceHistory?serial=${device.serial_number}`)}>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                              <History className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-slate-500"
                            onClick={() => setEditingDevice(device)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block bg-white border-0 shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>לא נמצאו מכשירים</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="text-right font-semibold text-slate-900">מספר סידורי</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">קבוצה</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">שם</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">סטטוס</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">הצפנה</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">בדיקות</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">תקלות</TableHead>
                    <TableHead className="text-right font-semibold text-slate-900">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device, index) => {
                    const deviceFaults = getDeviceFaults(device.serial_number);
                    return (
                      <motion.tr
                        key={device.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }}
                        className="hover:bg-blue-50/30 transition-colors border-b border-slate-50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                              <Radio className="w-4 h-4" />
                            </div>
                            <span className="font-mono text-base">{device.serial_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal bg-white">
                            {groupLabels[device.device_group] || device.device_group}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {device.device_name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            device.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              device.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`} />
                            {device.status === 'active' ? 'פעיל' : device.status}
                          </div>
                        </TableCell>
                        <TableCell>
                          {device.encryption_status === 'encrypted' ? (
                            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full w-fit">
                              <Shield className="w-3 h-3" />
                              מוצפן
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full w-fit">
                              <Shield className="w-3 h-3 opacity-50" />
                              לא מוצפן
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 font-mono text-sm">{device.total_inspections || 0}</span>
                        </TableCell>
                        <TableCell>
                          {deviceFaults.length > 0 ? (
                            <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100">
                              <AlertTriangle className="w-3 h-3 ml-1" />
                              {deviceFaults.length}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Link to={createPageUrl(`DeviceHistory?serial=${device.serial_number}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                                <History className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                              onClick={() => setEditingDevice(device)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => deleteMutation.mutate(device.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingDevice} onOpenChange={() => setEditingDevice(null)}>
          <DialogContent className="max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>עריכת מכשיר</DialogTitle>
            </DialogHeader>
            {editingDevice && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>מספר סידורי</Label>
                  <Input
                    value={editingDevice.serial_number}
                    disabled
                    className="h-12 rounded-xl bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>שם מכשיר</Label>
                  <Input
                    value={editingDevice.device_name || ''}
                    onChange={(e) => setEditingDevice({ ...editingDevice, device_name: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                {editingDevice.device_group === 'hargol' && (
                  <div className="space-y-2">
                    <Label>כתובת IP</Label>
                    <Input
                      value={editingDevice.ip_address || ''}
                      onChange={(e) => setEditingDevice({ ...editingDevice, ip_address: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>סטטוס</Label>
                  <Select
                    value={editingDevice.status}
                    onValueChange={(v) => setEditingDevice({ ...editingDevice, status: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">פעיל</SelectItem>
                      <SelectItem value="inactive">לא פעיל</SelectItem>
                      <SelectItem value="maintenance">בתחזוקה</SelectItem>
                      <SelectItem value="replaced">הוחלף</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => updateMutation.mutate({ id: editingDevice.id, data: editingDevice })}
                  disabled={updateMutation.isPending}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'שמור שינויים'
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Barcode Scanner */}
        {showScanner && (
          <BarcodeScanner
            onScan={(code) => {
              setNewDevice({ ...newDevice, serial_number: code });
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
}