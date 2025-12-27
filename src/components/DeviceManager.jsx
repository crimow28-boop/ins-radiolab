import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, X, Plus, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';

export default function DeviceManager({ devices, selectedDevices, onUpdate, onCancel }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelected, setLocalSelected] = useState(selectedDevices);
  const [bulkInput, setBulkInput] = useState('');

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

  const clearAll = () => {
    setLocalSelected([]);
    setBulkInput('');
  };

  // Parse bulk input and analyze results
  const bulkAnalysis = useMemo(() => {
    if (!bulkInput.trim()) {
      return { valid: [], invalid: [], duplicates: [], confusing: [] };
    }
    
    const allDeviceSerials = devices.map(d => d.serial_number);
    const deviceMap = new Map(devices.map(d => [d.serial_number, d]));
    
    const parsedNumbers = [];
    const parts = bulkInput.split(/[\s,*#]+/).filter(Boolean);
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(s => s.trim());
        const startNum = parseInt(start);
        const endNum = parseInt(end);
        
        if (!isNaN(startNum) && !isNaN(endNum)) {
          for (let i = startNum; i <= endNum; i++) {
            parsedNumbers.push(i.toString());
          }
        }
      } else {
        parsedNumbers.push(part);
      }
    });
    
    const seen = new Set();
    const duplicates = [];
    const valid = [];
    const invalid = [];
    const confusing = [];
    
    parsedNumbers.forEach(num => {
      // Check for duplicates
      if (seen.has(num)) {
        if (!duplicates.includes(num)) duplicates.push(num);
        return;
      }
      seen.add(num);
      
      // Check for confusing numbers (6/9)
      if (num.includes('6') || num.includes('9')) {
        confusing.push(num);
      }
      
      // Find matching device - exact match or ends with
      const matchedSerial = allDeviceSerials.find(serial => 
        serial === num || serial.endsWith(num)
      );
      
      if (matchedSerial) {
        const device = deviceMap.get(matchedSerial);
        valid.push({
          input: num,
          serial: matchedSerial,
          device,
          status: device?.status || 'active'
        });
      } else {
        invalid.push({ input: num, reason: 'לא קיים' });
      }
    });
    
    return { valid, invalid, duplicates, confusing };
  }, [bulkInput, devices]);

  // Add valid items from bulk analysis to selection
  const handleBulkAdd = () => {
    if (bulkAnalysis.valid.length === 0) return;
    
    const newSerials = bulkAnalysis.valid.map(v => v.serial);
    const combined = [...new Set([...localSelected, ...newSerials])];
    setLocalSelected(combined);
    setBulkInput('');
  };



  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3">
      <div className="flex-shrink-0 space-y-3 bg-white pb-2 z-10">
        {/* Bulk Input Bar */}
        <div className="bg-amber-100 rounded-2xl p-3 border border-amber-200">
          <p className="text-xs text-amber-800 mb-2 text-right font-medium">
            # ניפוק וחיסול מכשירים
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleBulkAdd}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-4"
            >
              <Plus className="w-4 h-4 ml-1" />
              הוסף
            </Button>
            <Input
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBulkAdd()}
              placeholder="הזן מספרים: 1 50 100 23-30 • תומך בטווחים ומספרים בודדים"
              className="flex-1 h-9 rounded-xl border-amber-300 bg-white text-sm text-right"
              dir="ltr"
            />
          </div>
        </div>

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