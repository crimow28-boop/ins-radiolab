import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Trash2, CheckCheck, X, Circle } from 'lucide-react';

export default function DeviceManager({ devices, selectedDevices, onUpdate, onCancel }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState(selectedDevices);

  const filteredDevices = devices.filter(device =>
    device.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (device.device_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDevice = (serial) => {
    if (localSelected.includes(serial)) {
      setLocalSelected(localSelected.filter(s => s !== serial));
    } else {
      setLocalSelected([...localSelected, serial]);
    }
  };

  const selectAllFiltered = () => {
    const allFiltered = filteredDevices.map(d => d.serial_number);
    const combined = [...new Set([...localSelected, ...allFiltered])];
    setLocalSelected(combined);
  };

  const clearAll = () => {
    setLocalSelected([]);
  };

  const getDeviceStatus = (device) => {
    // ירוק אם יש בדיקות, אדום אם אין
    const hasInspections = (device.total_inspections || 0) > 0;
    return hasInspections ? 'completed' : 'incomplete';
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {localSelected.map((serial) => (
          <Badge
            key={serial}
            variant="secondary"
            className="cursor-pointer hover:bg-red-100"
            onClick={() => toggleDevice(serial)}
          >
            {serial}
            <Trash2 className="w-3 h-3 mr-1" />
          </Badge>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="חפש לפי מספר סידורי או שם..."
          className="h-12 pr-10 rounded-xl"
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={selectAllFiltered}
          className="flex-1"
        >
          <CheckCheck className="w-4 h-4 ml-1" />
          בחר הכל ({filteredDevices.length})
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="flex-1"
        >
          <X className="w-4 h-4 ml-1" />
          נקה בחירה
        </Button>
      </div>

      <div className="text-sm text-slate-500 px-1">
        נבחרו {localSelected.length} מכשירים
      </div>

      <ScrollArea className="h-96 border rounded-xl p-4">
        <div className="space-y-2">
          {filteredDevices.map((device) => {
            const isSelected = localSelected.includes(device.serial_number);
            const status = getDeviceStatus(device);
            return (
              <div
                key={device.id}
                onClick={() => toggleDevice(device.serial_number)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Circle 
                  className={`w-3 h-3 fill-current ${
                    status === 'completed' ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <div className="flex-1">
                  <p className="font-medium">{device.serial_number}</p>
                  <p className="text-xs text-slate-500">
                    {device.device_name || device.device_group} • {device.total_inspections || 0} בדיקות
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    status === 'completed' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {status === 'completed' ? 'הושלם' : 'ממתין'}
                </Badge>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-2 pt-4">
        <Button
          onClick={() => onUpdate(localSelected)}
          className="flex-1"
        >
          שמור שינויים
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          ביטול
        </Button>
      </div>
    </div>
  );
}