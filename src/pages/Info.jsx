import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Radio, Shield, AlertTriangle, Info as InfoIcon } from 'lucide-react';

export default function Info() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['faults'],
    queryFn: () => base44.entities.FaultHistory.filter({ resolved: false }),
  });

  const filteredDevices = devices.filter(device =>
    device.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const encryptedCount = devices.filter(d => d.encryption_status === 'encrypted').length;
  const activeDevices = devices.filter(d => d.status === 'active').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">מידע</h1>
          <p className="text-slate-500">מידע טכני, נתונים וסטטוסים</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Radio className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{devices.length}</p>
                  <p className="text-sm text-slate-500">סה"כ מכשירים</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{encryptedCount}</p>
                  <p className="text-sm text-slate-500">מכשירים מוצפנים</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{faults.length}</p>
                  <p className="text-sm text-slate-500">תקלות פתוחות</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="devices" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="devices">מכשירים</TabsTrigger>
            <TabsTrigger value="faults">תקלות לפי צ'</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>חיפוש מכשיר</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="חפש לפי מספר צ'..."
                    className="h-12 pr-10 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((device) => (
                <Card key={device.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-lg font-mono">{device.serial_number}</p>
                        <p className="text-sm text-slate-500">{device.device_name || 'ללא שם'}</p>
                      </div>
                      <Badge variant="outline">{device.device_group}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">סטטוס:</span>
                        <span className="font-medium">{device.status === 'active' ? 'פעיל' : device.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">הצפנה:</span>
                        <span className="font-medium flex items-center gap-1">
                          {device.encryption_status === 'encrypted' ? (
                            <>
                              <Shield className="w-3 h-3 text-green-600" />
                              מוצפן
                            </>
                          ) : (
                            'לא מוצפן'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">בדיקות:</span>
                        <span className="font-medium">{device.total_inspections || 0}</span>
                      </div>
                      {device.ip_address && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">IP:</span>
                          <span className="font-mono text-xs">{device.ip_address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="faults" className="space-y-4">
            {faults.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <InfoIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500">אין תקלות פתוחות</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {faults.map((fault) => (
                  <Card key={fault.id} className="border-r-4 border-red-500">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg font-mono">{fault.device_serial_number}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(fault.fault_date).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                        <Badge variant="destructive">פתוח</Badge>
                      </div>
                      <p className="text-slate-700">{fault.fault_description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}