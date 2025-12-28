import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Plus, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const [serial, setSerial] = useState('');
  const [pendingSerial, setPendingSerial] = useState(null);
  const [foundDevice, setFoundDevice] = useState(null);
  const [newGroup, setNewGroup] = useState('713');
  const [soldierName, setSoldierName] = useState('');
  const [busy, setBusy] = useState(false);

  const createDeviceMutation = useMutation({
    mutationFn: (data) => base44.entities.Device.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const beginIntake = async () => {
    const trimmed = serial.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await base44.entities.Device.filter({ serial_number: trimmed });
      const dev = res[0];
      setPendingSerial(trimmed);
      setFoundDevice(dev || null);
      if (!dev) {
        toast.message('מכשיר לא נמצא, ניתן ליצור חדש');
      }
      // Lock serial field until soldier name is provided
      setSerial(trimmed);
    } finally {
      setBusy(false);
    }
  };

  const createAndUseDevice = async () => {
    if (!pendingSerial) return;
    setBusy(true);
    try {
      await createDeviceMutation.mutateAsync({ serial_number: pendingSerial, device_group: newGroup });
      const created = (await base44.entities.Device.filter({ serial_number: pendingSerial }))[0];
      setFoundDevice(created);
      toast.success('המכשיר נוצר');
    } catch (e) {
      toast.error('יצירת מכשיר נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const proceedToInspection = () => {
    if (!pendingSerial || !soldierName.trim()) return;
    // Navigate to inspection with soldier name prefilled
    navigate(createPageUrl(`DeviceInspection?serial=${encodeURIComponent(pendingSerial)}&soldier=${encodeURIComponent(soldierName.trim())}`));
    // Reset flow
    setPendingSerial(null);
    setFoundDevice(null);
    setSoldierName('');
    setSerial('');
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 p-4 rounded-xl">
          <ShieldAlert className="w-5 h-5" />
          <div>
            <div className="font-semibold">גישה למנהלים בלבד</div>
            <div className="text-sm">אין לך הרשאות לצפות בעמוד זה.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-slate-800">ניהול • קליטה ובדיקה</h1>

        {/* Intake + Add Device */}
        <Card>
          <CardHeader>
            <CardTitle>קליטה מהירה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                dir="ltr"
                disabled={!!pendingSerial}
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && beginIntake()}
                placeholder="הזן מספר סידורי ולחץ Enter"
                className="pr-10"
              />
            </div>
            {!pendingSerial && (
              <div className="text-xs text-slate-500">לאחר ההזנה, תידרש הזנת שם לוחם לפני מעבר למכשיר הבא.</div>
            )}

            {pendingSerial && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-slate-700">מס׳: {pendingSerial}</Badge>
                  {foundDevice ? (
                    <Badge className="bg-emerald-100 text-emerald-800">נמצא במערכת</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800">חדש</Badge>
                  )}
                </div>

                {!foundDevice && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div className="space-y-2">
                      <Label>סוג מכשיר</Label>
                      <Select value={newGroup} onValueChange={setNewGroup}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר סוג" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="713">713</SelectItem>
                          <SelectItem value="710">710</SelectItem>
                          <SelectItem value="711">711</SelectItem>
                          <SelectItem value="hargol">hargol</SelectItem>
                          <SelectItem value="elal">elal</SelectItem>
                          <SelectItem value="lotus">lotus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={createAndUseDevice} disabled={busy} className="h-10">
                      <Plus className="w-4 h-4 ml-2" /> צור מכשיר והמשך
                    </Button>
                  </div>
                )}

                {/* Soldier name must be provided to continue */}
                <div className="space-y-2">
                  <Label>שם לוחם (חובה לפני המשך)</Label>
                  <Input
                    value={soldierName}
                    onChange={(e) => setSoldierName(e.target.value)}
                    placeholder="לדוגמה: ישראל ישראלי"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={!soldierName.trim() || busy || (!foundDevice && createDeviceMutation.isPending)}
                    onClick={proceedToInspection}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-2" /> עבור לבדיקה
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPendingSerial(null);
                      setFoundDevice(null);
                      setSoldierName('');
                      setSerial('');
                    }}
                  >
                    ביטול
                  </Button>
                </div>
                <div className="text-xs text-slate-500">שדה המספר ננעל עד הזנת שם לוחם.</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}