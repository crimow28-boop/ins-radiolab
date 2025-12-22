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
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                      <Radio className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold text-slate-800">{device.serial_number}</h2>
                        <Badge variant="outline">
                          {groupLabels[device.device_group] || device.device_group}
                        </Badge>
                        {device.encryption_status === 'encrypted' && (
                          <Badge className="bg-green-100 text-green-800">
                            <Shield className="w-3 h-3 ml-1" />
                            מוצפן
                          </Badge>
                        )}
                      </div>
                      {device.device_name && (
                        <p className="text-slate-600 mb-2">{device.device_name}</p>
                      )}
                      <div className="flex gap-6 text-sm text-slate-500">
                        <span>בדיקות: {device.total_inspections || 0}</span>
                        <span>תקלות: {device.total_faults || faults.length}</span>
                        {device.last_inspection_date && (
                          <span>בדיקה אחרונה: {format(new Date(device.last_inspection_date), 'dd/MM/yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Faults */}
            {faults.length > 0 && (
              <Card className="bg-white border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">תקלות ({faults.length})</h3>
                  </div>
                  <div className="space-y-3">
                    {faults.map((fault, index) => (
                      <motion.div
                        key={fault.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl ${
                          fault.resolved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-800">{fault.fault_description}</p>
                            <p className="text-sm text-slate-500 mt-1">
                              {format(new Date(fault.fault_date), 'dd/MM/yyyy HH:mm')}
                            </p>
                          </div>
                          <Badge className={fault.resolved ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {fault.resolved ? 'טופל' : 'פתוח'}
                          </Badge>
                        </div>
                        {fault.resolution_notes && (
                          <p className="mt-2 text-sm text-green-700 bg-green-100 p-2 rounded">
                            {fault.resolution_notes}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inspections */}
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">בדיקות ({deviceInspections.length})</h3>
                </div>

                {deviceInspections.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>אין בדיקות למכשיר זה</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deviceInspections.map((inspection, index) => (
                      <motion.div
                        key={inspection.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-slate-50 rounded-xl"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-bold text-blue-600">
                                #{inspection.inspection_number}
                              </span>
                              {inspection.cavad_status === 'passed' ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 ml-1" />
                                  עבר
                                </Badge>
                              ) : inspection.cavad_status === 'failed' ? (
                                <Badge className="bg-red-100 text-red-800">
                                  נכשל
                                </Badge>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {inspection.soldier_name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(inspection.created_date), 'dd/MM/yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                          <Link to={createPageUrl('InspectionHistory')}>
                            <Button variant="ghost" size="sm">
                              צפה בפרטים
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}