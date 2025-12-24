import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Trash2, CheckCheck, X } from 'lucide-react';

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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredDevices.map((device) => {
            const isSelected = localSelected.includes(device.serial_number);
            const status = getDeviceStatus(device);
            return (
              <div
                key={device.id}
                onClick={() => toggleDevice(device.serial_number)}
                className={`
                  p-4 rounded-xl cursor-pointer transition-all text-center
                  ${status === 'completed' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                  ${isSelected ? 'ring-4 ring-blue-300 scale-105' : ''}
                  text-white font-semibold shadow-md hover:shadow-lg
                `}
              >
                {device.serial_number}
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