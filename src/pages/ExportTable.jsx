import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Download } from 'lucide-react';

const HEADERS = [
  'סודר',
  'שם',
  "מספר צ’",
  'אנטנה',
  'מער״ש',
  'צב"ד',
  'הצפנה',
  'תדרים',
  'בדיקות קשר',
  'החלפת סוללה',
  'אטימות',
  'ציוד נוסף',
  'הערות'
];

export default function ExportTable() {
  // Fetch all completed inspections and all checklists to map ids -> labels
  const { data: inspections = [], isLoading: loadingInspections } = useQuery({
    queryKey: ['inspections_export_all_completed'],
    queryFn: () => base44.entities.Inspection.filter({ status: 'completed' }, '-created_date', 1000)
  });

  const { data: checklists = [], isLoading: loadingChecklists } = useQuery({
    queryKey: ['checklists_export'],
    queryFn: () => base44.entities.InspectionChecklist.list()
  });

  const checklistByCode = useMemo(() => {
    const map = new Map();
    (checklists || []).forEach(c => map.set(c.code, c));
    return map;
  }, [checklists]);

  const rows = useMemo(() => {
    const out = [];

    inspections.forEach((insp, idx) => {
      let answers = {};
      try {
        if (insp.checklist_answers) answers = JSON.parse(insp.checklist_answers || '{}');
      } catch {}

      const checklist = checklistByCode.get(insp.profile);
      const items = checklist?.items || [];

      // Build maps for easy lookup
      const idToLabel = new Map(items.map(it => [it.id, it.label]));

      // Helper: find value by exact label or includes
      const getByLabel = (label, { includes = false } = {}) => {
        let foundId = null;
        if (!includes) {
          for (const [id, lab] of idToLabel.entries()) {
            if (lab === label) { foundId = id; break; }
          }
        }
        if (!foundId) {
          for (const [id, lab] of idToLabel.entries()) {
            if (lab?.includes?.(label)) { foundId = id; break; }
          }
        }
        if (!foundId) return undefined;
        return answers[foundId];
      };

      // Extract columns
      const num = idx + 1; // סודר (מספור אוטומטי)

      const name = getByLabel('שם') ?? insp.soldier_name ?? '';
      const idCard = getByLabel("מספר צ’") ?? '';

      const antenna = getByLabel('אנטנה') ?? '';
      const mearash = getByLabel('מער"ש') ?? getByLabel('מער״ש') ?? '';

      // צב"ד: turn to V/X when value is select 'עבר', otherwise X/blank
      const tzabadVal = getByLabel('צב"ד') ?? getByLabel('צב"ד');
      const tzabad = typeof tzabadVal === 'string' ? (tzabadVal === 'עבר' ? 'V' : (tzabadVal ? 'X' : '')) : (tzabadVal === true ? 'V' : (tzabadVal === false ? 'X' : ''));

      // Checkboxes: search with flexible label matching
      const encryption = normalizeCheckbox(getByLabel('הצפנ'));
      const freqs = normalizeCheckbox(getByLabel('תדר'));
      const comms = normalizeCheckbox(getByLabel('בדיקות קשר'));
      const battery = normalizeCheckbox(getByLabel('החלפת סוללה'));
      const sealing = normalizeCheckbox(getByLabel('אטימות'));

      const extraEquip = getByLabel('ציוד נוסף') ?? '';
      const notes = getByLabel('הערות') ?? (insp.remarks || '');

      out.push([
        num,
        sanitize(name),
        sanitize(idCard),
        sanitize(antenna),
        sanitize(mearash),
        tzabad || '',
        toVX(encryption),
        toVX(freqs),
        toVX(comms),
        toVX(battery),
        toVX(sealing),
        sanitize(extraEquip),
        sanitize(notes)
      ]);
    });

    return out;
  }, [inspections, checklistByCode]);

  const handleDownloadCsv = () => {
    const csv = toCsv([HEADERS, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_inspections_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loadingInspections || loadingChecklists) {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">ייצוא נתונים - כל הכרטיסים</h1>
          <Button onClick={handleDownloadCsv} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 ml-2" />
            הורד CSV
          </Button>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <ScrollArea className="w-full overflow-auto">
              <table className="min-w-[1000px] w-full text-right">
                <thead className="bg-slate-100">
                  <tr>
                    {HEADERS.map(h => (
                      <th key={h} className="px-3 py-2 text-sm font-semibold text-slate-700 border-b">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="odd:bg-white even:bg-slate-50">
                      {r.map((c, j) => (
                        <td key={j} className="px-3 py-2 text-sm text-slate-800 align-top border-b whitespace-pre-wrap">{String(c ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function normalizeCheckbox(val) {
  if (val === true) return true;
  if (val === false) return false;
  if (typeof val === 'string') {
    // Treat common strings
    if (['כן','true','TRUE','תקין','עבר','V','v'].includes(val)) return true;
    if (['לא','false','FALSE','לא תקין','נכשל','X','x'].includes(val)) return false;
  }
  return undefined;
}

function toVX(val) {
  if (val === true) return 'V';
  if (val === false) return 'X';
  return '';
}

function sanitize(v) {
  if (v === undefined || v === null) return '';
  return String(v).replaceAll('\n', ' ').trim();
}

function toCsv(rows) {
  const escape = (field) => {
    const f = field == null ? '' : String(field);
    if (/[",\n]/.test(f)) {
      return '"' + f.replaceAll('"', '""') + '"';
    }
    return f;
  };
  return rows.map(r => r.map(escape).join(',')).join('\n');
}