import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  User, 
  Radio,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import DeviceSelector from '@/components/DeviceSelector';
import HardwareSection from '@/components/inspection/HardwareSection';
import CavadSection from '@/components/inspection/CavadSection';
import FunctionalChecks from '@/components/inspection/FunctionalChecks';
import FaultsEquipment from '@/components/inspection/FaultsEquipment';
import SignatureSection from '@/components/inspection/SignatureSection';
import DeliverySection from '@/components/inspection/DeliverySection';

const PROFILES = [
  { code: '710', label: '710' },
  { code: '711', label: '711' },
  { code: '713', label: '713' },
  { code: 'hargol_4200', label: 'חרגול (4200)' },
  { code: 'hargol_4400', label: 'חרגול (4400)' },
  { code: 'elal', label: 'אל-על' },
  { code: 'lotus', label: 'לוטוס' },
];

const STEPS = [
  { id: 'basic', label: 'פרטים בסיסיים' },
  { id: 'hardware', label: 'חומרה' },
  { id: 'cavad', label: 'CAVAD' },
  { id: 'functional', label: 'בדיקות תפקוד' },
  { id: 'faults', label: 'תקלות וציוד' },
  { id: 'signatures', label: 'חתימות' },
  { id: 'delivery', label: 'מסירה' },
];

export default function NewInspection() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    soldier_name: '',
    profile: '',
    device_serial_numbers: [],
    antenna_type: '',
    system_type: '',
    sealing_status: false,
    sealing_screws_closed: false,
    cavad_status: '',
    cavad_tests: [],
    encryption_check: false,
    frequencies_check: false,
    side_connector_closed: false,
    communication_test: false,
    battery_replaced: false,
    fault_description: '',
    device_replaced: false,
    replaced_device_serial: '',
    additional_equipment: [],
    remarks: '',
    soldier_signature: {},
    supervisor_signature: {},
    delivery_status: '',
    delivery_soldier_name: '',
    delivery_signature: '',
  });

  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: () => base44.entities.Device.list(),
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-inspection_number', 1),
  });

  const nextInspectionNumber = inspections.length > 0 
    ? (inspections[0].inspection_number || 0) + 1 
    : 1;

  const createInspectionMutation = useMutation({
    mutationFn: async (data) => {
      const inspection = await base44.entities.Inspection.create({
        ...data,
        inspection_number: nextInspectionNumber,
        inspection_date: new Date().toISOString(),
      });

      // Update devices and create fault history if needed
      for (const serial of data.device_serial_numbers) {
        const device = devices.find(d => d.serial_number === serial);
        if (device) {
          await base44.entities.Device.update(device.id, {
            last_inspection_date: new Date().toISOString().split('T')[0],
            total_inspections: (device.total_inspections || 0) + 1,
            encryption_status: data.encryption_check ? 'encrypted' : 'not_encrypted',
          });
        }

        // Create fault history if there's a fault
        if (data.fault_description && data.fault_description !== 'אין' && data.fault_description.trim()) {
          await base44.entities.FaultHistory.create({
            device_serial_number: serial,
            inspection_id: inspection.id,
            fault_description: data.fault_description,
            fault_date: new Date().toISOString(),
            resolved: false,
          });
        }
      }

      return inspection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      navigate(createPageUrl('Home')); // Better flow: Go to home dashboard
    },
  });

  const updateFormData = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createInspectionMutation.mutate(formData);
  };

  const isStepValid = () => {
    switch (STEPS[currentStep].id) {
      case 'basic':
        return formData.soldier_name && formData.profile && formData.device_serial_numbers.length > 0;
      default:
        return true;
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'basic':
        return (
          <div className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Radio className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">בדיקה חדשה</h3>
                    <p className="text-sm text-slate-500">מספר בדיקה: #{nextInspectionNumber}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-slate-700">
                    <User className="w-4 h-4" />
                    שם החייל
                  </Label>
                  <Input
                    value={formData.soldier_name}
                    onChange={(e) => updateFormData({ soldier_name: e.target.value })}
                    placeholder="הזן שם חייל"
                    className="h-12 rounded-xl"
                  />
                </div>


              </CardContent>
            </Card>

            <DeviceSelector
              devices={devices}
              selectedDevices={formData.device_serial_numbers}
              onSelectionChange={(selected) => updateFormData({ device_serial_numbers: selected })}
              isLoading={devicesLoading}
            />
          </div>
        );

      case 'hardware':
        return <HardwareSection data={formData} onChange={updateFormData} />;

      case 'cavad':
        return <CavadSection data={formData} onChange={updateFormData} />;

      case 'functional':
        return <FunctionalChecks data={formData} onChange={updateFormData} />;

      case 'faults':
        return <FaultsEquipment data={formData} onChange={updateFormData} />;

      case 'signatures':
        return (
          <div className="space-y-6">
            <SignatureSection data={formData} onChange={updateFormData} type="soldier" />
            <SignatureSection data={formData} onChange={updateFormData} type="supervisor" />
          </div>
        );

      case 'delivery':
        return <DeliverySection data={formData} onChange={updateFormData} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(createPageUrl('Home'))}
            >
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה
            </Button>
            <span className="text-sm text-slate-500">
              שלב {currentStep + 1} מתוך {STEPS.length}
            </span>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 py-2">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => setCurrentStep(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : isCompleted
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isActive ? 'bg-white/20' : 'bg-slate-100'
                      }`}>
                        {index + 1}
                      </span>
                    )}
                    {step.label}
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className="w-4 h-0.5 bg-slate-200 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="h-12 px-6"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            הקודם
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={createInspectionMutation.isPending}
              className="h-12 px-8 bg-green-600 hover:bg-green-700"
            >
              {createInspectionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <Save className="w-4 h-4 ml-2" />
              )}
              שמור בדיקה
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="h-12 px-6"
            >
              הבא
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}