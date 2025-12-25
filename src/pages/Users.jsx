import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, UserPlus, Trash2, Mail, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Users() {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' });
  const [isInviting, setIsInviting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: currentUser?.role === 'admin'
  });

  const handleInvite = async () => {
    if (!inviteData.email) return;
    setIsInviting(true);
    try {
      await base44.users.inviteUser(inviteData.email, inviteData.role);
      toast.success(`הזמנה נשלחה ל-${inviteData.email}`);
      setIsInviteOpen(false);
      setInviteData({ email: '', role: 'user' });
    } catch (error) {
      console.error(error);
      toast.error("שגיאה בשליחת הזמנה");
    } finally {
      setIsInviting(false);
    }
  };
  
  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
       // Separate updates if needed, but usually one call works if fields are supported
       return base44.entities.User.update(data.id, {
         full_name: data.full_name,
         role: data.role
       });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success("פרטי משתמש עודכנו בהצלחה");
      setEditingUser(null);
    },
    onError: () => {
      toast.error("שגיאה בעדכון משתמש");
    }
  });

  const handleSaveUser = () => {
    if (!editingUser) return;
    updateUserMutation.mutate(editingUser);
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
           <h2 className="text-xl font-bold">אין גישה</h2>
           <p className="text-slate-500">דף זה מיועד למנהלים בלבד</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">ניהול משתמשים</h1>
            <p className="text-slate-500">ניהול גישה והרשאות לאפליקציה</p>
          </div>
          
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 ml-2" />
                הזמן משתמש
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>הזמנת משתמש חדש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>כתובת אימייל</Label>
                  <Input 
                    placeholder="example@idf.il" 
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד</Label>
                  <Select 
                    value={inviteData.role} 
                    onValueChange={(val) => setInviteData({...inviteData, role: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">משתמש רגיל</SelectItem>
                      <SelectItem value="admin">מנהל מערכת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleInvite}
                  disabled={isInviting || !inviteData.email}
                >
                  {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שלח הזמנה'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>עריכת פרטי משתמש</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>שם מלא</Label>
                  <Input 
                    value={editingUser?.full_name || ''} 
                    onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                    placeholder="שם מלא"
                  />
                </div>
                <div className="space-y-2">
                  <Label>תפקיד</Label>
                  <Select 
                    value={editingUser?.role} 
                    onValueChange={(val) => setEditingUser({...editingUser, role: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">משתמש רגיל</SelectItem>
                      <SelectItem value="admin">מנהל מערכת</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleSaveUser}
                  disabled={updateUserMutation.isPending}
                >
                  {updateUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור שינויים'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">שם מלא</TableHead>
                    <TableHead className="text-right">אימייל</TableHead>
                    <TableHead className="text-right">תפקיד</TableHead>
                    <TableHead className="text-right">תאריך הצטרפות</TableHead>
                    <TableHead className="text-right">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'לא הוגדר'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'מנהל' : 'משתמש'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(user.created_date).toLocaleDateString('he-IL')}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingUser(user)}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">ערוך</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}