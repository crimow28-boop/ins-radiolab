import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Radio, X, CheckCheck, Camera } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';

export default function DeviceSelector({ devices, selectedDevices, onSelectionChange, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [showScanner, setShowScanner] = useState(false);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (device.device_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'all' || device.device_group === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const toggleDevice = (serialNumber) => {
    if (selectedDevices.includes(serialNumber)) {
      onSelectionChange(selectedDevices.filter(s => s !== serialNumber));
    } else {
      onSelectionChange([...selectedDevices, serialNumber]);
    }
  };

  const selectAll = () => {
    onSelectionChange(filteredDevices.map(d => d.serial_number));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const groupLabels = {
    '713': '713',
    '710': '710',
    '711': '711',
    'hargol': 'חרגול',
    'elal': 'אל-על',
    'lotus': 'לוטוס'
  };

  const groups = ['all', '713', '710', '711', 'hargol', 'elal', 'lotus'];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Radio className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">בחירת מכשירים</h3>
          <p className="text-sm text-slate-500">נבחרו {selectedDevices.length} מכשירים</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {groups.map(group => (
          <Button
            key={group}
            type="button"
            variant={filterGroup === group ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterGroup(group)}
            className="rounded-full"
          >
            {group === 'all' ? 'הכל' : groupLabels[group] || group}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש לפי מספר סידורי..."
            className="h-12 pr-10 rounded-xl"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-12 px-4 rounded-xl"
          onClick={() => setShowScanner(true)}
        >
          <Camera className="w-5 h-5" />
        </Button>
      </div>

      {selectedDevices.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-xl">
          {selectedDevices.map(serial => (
            <Badge
              key={serial}
              variant="secondary"
              className="bg-blue-100 text-blue-800 gap-1 cursor-pointer hover:bg-blue-200"
              onClick={() => toggleDevice(serial)}
            >
              {serial}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={selectAll} className="flex-1">
          <CheckCheck className="w-4 h-4 ml-1" />
          בחר הכל
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={clearAll} className="flex-1">
          <X className="w-4 h-4 ml-1" />
          נקה בחירה
        </Button>
      </div>

      <ScrollArea className="h-64 rounded-xl border border-slate-200">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            לא נמצאו מכשירים
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredDevices.map(device => (
              <div
                key={device.id}
                onClick={() => toggleDevice(device.serial_number)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedDevices.includes(device.serial_number)
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <Checkbox
                  checked={selectedDevices.includes(device.serial_number)}
                  className="pointer-events-none"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{device.serial_number}</p>
                  {device.device_name && (
                    <p className="text-sm text-slate-500">{device.device_name}</p>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {groupLabels[device.device_group] || device.device_group}
                </Badge>
                {device.encryption_status === 'encrypted' && (
                  <Badge className="bg-green-100 text-green-800 text-xs">מוצפן</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            const device = devices.find(d => d.serial_number === code);
            if (device && !selectedDevices.includes(code)) {
              onSelectionChange([...selectedDevices, code]);
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}