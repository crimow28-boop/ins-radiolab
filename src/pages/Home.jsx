import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Radio,
  ClipboardList,
  History,
  Package,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
  Activity } from
  'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subDays, format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const { data: devices = [] } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list()
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-created_date', 100)
  });

  const { data: faults = [] } = useQuery({
    queryKey: ['faults'],
    queryFn: () => base44.entities.FaultHistory.filter({ resolved: false })
  });

  const stats = {
    totalDevices: devices.length,
    totalInspections: inspections.length,
    openFaults: faults.length,
    encryptedDevices: devices.filter((d) => d.encryption_status === 'encrypted').length
  };

  const groupCounts = {
    '713': devices.filter((d) => d.device_group === '713').length,
    '710': devices.filter((d) => d.device_group === '710').length,
    '711': devices.filter((d) => d.device_group === '711').length
  };

  // Prepare chart data - last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = inspections.filter((insp) =>
    insp.created_date.startsWith(dateStr)
    ).length;
    return {
      name: format(date, 'dd/MM'),
      count: count
    };
  });

  if (showSplash) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center">

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}>

            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl">
              <Radio className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">RadioLab</h1>
            <h2 className="text-xl text-blue-300 mb-4">Inspection System</h2>
            <p className="text-slate-400 text-sm">INS-RadioLab</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8">

            <div className="w-8 h-8 border-t-2 border-blue-400 rounded-full animate-spin mx-auto"></div>
          </motion.div>
        </motion.div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20" dir="rtl">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
              <Radio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">INS - RadioLab</h1>
              <p className="text-blue-200">מערכת בדיקות מכשירי קשר</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
          { label: 'סה"כ מכשירים', value: stats.totalDevices, icon: Package, color: 'blue' },
          { label: 'בדיקות שבוצעו', value: stats.totalInspections, icon: CheckCircle, color: 'green' },
          { label: 'תקלות פתוחות', value: stats.openFaults, icon: AlertTriangle, color: 'amber' },
          { label: 'מכשירים מוצפנים', value: stats.encryptedDevices, icon: TrendingUp, color: 'purple' }].
          map((stat, i) =>
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}>

              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="p-5">
                  <div className={`w-10 h-10 bg-${stat.color}-100 rounded-xl flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Navigation moved to bottom bar */}



        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <Link to={createPageUrl('InspectionHistory')}>
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <History className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">היסטוריית בדיקות</h3>
                  <p className="text-slate-500 text-sm">צפה בכל הבדיקות שבוצעו במערכת</p>
                </div>
                <ArrowLeft className="w-5 h-5 mr-auto text-slate-300 group-hover:text-purple-500 transition-colors" />
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('ChecklistManager')}>
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all cursor-pointer h-full group">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">ניהול רשימות בדיקה</h3>
                  <p className="text-slate-500 text-sm">הגדרת טפסים וסעיפי בדיקה</p>
                </div>
                <ArrowLeft className="w-5 h-5 mr-auto text-slate-300 group-hover:text-blue-500 transition-colors" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="bg-white border-0 shadow-lg mt-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">בדיקות אחרונות</h3>
              <Link to={createPageUrl('InspectionHistory')}>
                <Button variant="ghost" size="sm" className="hover:bg-slate-50">
                  לכל הבדיקות
                  <ArrowLeft className="w-4 h-4 mr-2" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspections.slice(0, 6).map((inspection) =>
              <div key={inspection.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 transition-colors">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 font-bold text-sm border border-slate-100 shrink-0">
                    #{inspection.inspection_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate" title={inspection.soldier_name}>{inspection.soldier_name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      {(inspection.device_serial_numbers || []).length} מכשירים
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-white px-2 py-1 rounded-lg text-slate-500 shadow-sm border border-slate-100 shrink-0">
                    {format(new Date(inspection.created_date), 'dd/MM')}
                  </span>
                </div>
              )}
              {inspections.length === 0 &&
              <div className="col-span-full text-center py-12 text-slate-500">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>אין בדיקות במערכת</p>
                </div>
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);

}