import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Radio,
  History,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Calendar,
  User,
  Shield,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function DeviceHistory() {
  const urlParams = new URLSearchParams(window.location.search);
  const serialNumber = urlParams.get('serial');

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });

  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['device-inspections', serialNumber],
    queryFn: () => base44.entities.Inspection.list('-created_date'),
    enabled: !!serialNumber,
  });

  const { data: faults = [], isLoading: faultsLoading } = useQuery({
    queryKey: ['device-faults', serialNumber],
    queryFn: () => base44.entities.FaultHistory.filter({ device_serial_number: serialNumber }),
    enabled: !!serialNumber,
  });

  const device = devices.find(d => d.serial_number === serialNumber);
  const deviceInspections = inspections.filter(i => 
    (i.device_serial_numbers || []).includes(serialNumber)
  );

  const isLoading = devicesLoading || inspectionsLoading || faultsLoading;

  const groupLabels = {
    '713': '713',
    '710': '710',
    '711': '711',
    'hargol': 'חרגול',
    'elal': 'אל-על',
    'lotus': 'לוטוס'
  };

  if (!serialNumber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center" dir="rtl">
        <Card className="bg-white border-0 shadow-lg p-8 text-center">
          <Radio className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600">לא צוין מספר סידורי</p>
          <Link to={createPageUrl('Devices')}>
            <Button className="mt-4">חזרה למלאי</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Devices')}>
              <Button variant="ghost">
                <ArrowRight className="w-4 h-4 ml-2" />
                חזרה
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">היסטוריית מכשיר</h1>
                <p className="text-sm text-slate-500">מספר סידורי: {serialNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* Device Info */}
            {device && (
              <Card className="bg-white border-0 shadow-lg overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-400" />
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100 shadow-sm">
                      <Radio className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{device.serial_number}</h2>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                            {groupLabels[device.device_group] || device.device_group}
                          </Badge>
                        </div>
                        {device.device_name && (
                          <p className="text-lg text-slate-600">{device.device_name}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <Shield className={`w-4 h-4 ${device.encryption_status === 'encrypted' ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <span className="text-sm font-medium text-slate-700">
                            {device.encryption_status === 'encrypted' ? 'מוצפן' : 'לא מוצפן'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {device.total_inspections || 0} בדיקות
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {device.total_faults || faults.length} תקלות
                          </span>
                        </div>
                      </div>
                    </div>
                    {device.last_inspection_date && (
                      <div className="text-left px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">בדיקה אחרונה</p>
                        <p className="text-lg font-bold text-green-700">
                          {format(new Date(device.last_inspection_date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Faults */}
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">היסטוריית תקלות</h3>
                      <p className="text-sm text-slate-500">{faults.length} תקלות רשומות</p>
                    </div>
                  </div>
                  
                  {faults.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>אין תקלות רשומות</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {faults.map((fault, index) => (
                        <motion.div
                          key={fault.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border-l-4 ${
                            fault.resolved 
                              ? 'bg-slate-50 border-l-emerald-500' 
                              : 'bg-amber-50 border-l-amber-500'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-xs font-bold uppercase tracking-wider ${
                              fault.resolved ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {fault.resolved ? 'טופל' : 'פתוח'}
                            </span>
                            <span className="text-xs text-slate-400">
                              {format(new Date(fault.fault_date), 'dd/MM/yyyy')}
                            </span>
                          </div>
                          <p className="font-medium text-slate-800 mb-2">{fault.fault_description}</p>
                          {fault.resolution_notes && (
                            <div className="text-sm text-slate-600 bg-white/50 p-2 rounded-lg mt-2">
                              <span className="font-semibold">טיפול:</span> {fault.resolution_notes}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inspections */}
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">היסטוריית בדיקות</h3>
                      <p className="text-sm text-slate-500">{deviceInspections.length} בדיקות בוצעו</p>
                    </div>
                  </div>

                  {deviceInspections.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>טרם בוצעו בדיקות</p>
                    </div>
                  ) : (
                    <div className="relative border-r border-slate-200 mr-4 space-y-8 py-2">
                      {deviceInspections.map((inspection, index) => (
                        <motion.div
                          key={inspection.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative pr-8"
                        >
                          {/* Timeline dot */}
                          <div className={`absolute right-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white ring-1 ${
                            inspection.cavad_status === 'passed' ? 'bg-emerald-500 ring-emerald-200' : 
                            inspection.cavad_status === 'failed' ? 'bg-red-500 ring-red-200' : 'bg-slate-300 ring-slate-200'
                          }`} />
                          
                          <div className="bg-slate-50 rounded-xl p-4 hover:bg-blue-50 transition-colors group cursor-pointer border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-700 text-sm">#{inspection.inspection_number}</span>
                              <span className="text-xs text-slate-400">
                                {format(new Date(inspection.created_date), 'dd/MM/yyyy')}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="text-sm text-slate-600">{inspection.soldier_name}</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {inspection.cavad_status === 'passed' && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">CAVAD תקין</span>
                              )}
                              {inspection.cavad_status === 'failed' && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">CAVAD נכשל</span>
                              )}
                              {inspection.fault_description && inspection.fault_description !== 'אין' && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">תקלה</span>
                              )}
                            </div>
                            
                            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 left-2">
                              <Link to={createPageUrl('InspectionHistory')}>
                                <Button size="icon" variant="ghost" className="h-6 w-6">
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}