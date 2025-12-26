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



  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      <div className="flex-shrink-0 space-y-3 bg-white pb-2 z-10">
        <div className="relative group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חפש לפי מספר סידורי או שם..."
            className="h-14 pr-12 pl-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all text-base"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="flex-shrink-0 rounded-full border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
          >
            <X className="w-4 h-4 ml-1" />
            נקה בחירה ({localSelected.length})
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 border rounded-xl bg-slate-50/50">
        <div className="p-2 space-y-2">
          {filteredDevices.map((device) => {
            const isSelected = localSelected.includes(device.serial_number);
            const status = getDeviceStatus(device);
            return (
              <div
                key={device.id}
                onClick={() => toggleDevice(device.serial_number)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  isSelected 
                    ? 'bg-blue-50 border-blue-200 shadow-sm' 
                    : 'bg-white border-slate-100 hover:border-slate-200'
                }`}
              >
                <Checkbox checked={isSelected} className="pointer-events-none rounded-full w-5 h-5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{device.serial_number}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 h-5 ${
                        status === 'completed' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {status === 'completed' ? 'הושלם' : 'ממתין'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {device.device_name || device.device_group}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex-shrink-0 pt-2 grid grid-cols-2 gap-3">
        <Button
          onClick={() => onUpdate(localSelected)}
          className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-lg font-medium"
        >
          עדכן ({localSelected.length})
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="h-12 rounded-xl border-slate-200 text-slate-600"
        >
          ביטול
        </Button>
      </div>
    </div>
  );
}