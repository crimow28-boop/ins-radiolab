import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download } from 'lucide-react';

const HEADERS = [
  'סודר',
  'שם',
  'אנטנה',
  'מער״ש',
  'צב״ד',
  'הצפנה',
  'תדרים',
  'בדיקות קשר',
  'החלפת סוללה',
  'אטימות',
  'ציוד נוסף',
  'הערות'
];

export default function CardExportDialog({ card, inspections = [], checklists = [] }) {
  const rows = useMemo(() => {
    if (!card) return [];
    const checklistByCode = new Map((checklists || []).map(c => [c.code, c]));

    const deviceSerials = card.devices || [];

    // For each device, pick latest completed inspection for this card
    const latestBySerial = new Map();
    (inspections || []).forEach(insp => {
      if (insp.status !== 'completed') return;
      if (insp.card_id !== card.id) return;
      (insp.device_serial_numbers || []).forEach(s => {
        if (!deviceSerials.includes(s)) return;
        const prev = latestBySerial.get(s);
        const prevDate = prev ? new Date(prev.created_date || 0).getTime() : 0;
        const currDate = new Date(insp.created_date || 0).getTime();
        if (!prev || currDate > prevDate) latestBySerial.set(s, insp);
      });
    });

    const out = [];
    let idx = 1;

    deviceSerials.forEach(serial => {
      const insp = latestBySerial.get(serial);
      if (!insp) return; // skip devices without completed inspection

      let answers = {};
      try { if (insp.checklist_answers) answers = JSON.parse(insp.checklist_answers); } catch {}

      const checklist = checklistByCode.get(insp.profile);
      const items = checklist?.items || [];
      const idToLabel = new Map(items.map(it => [it.id, it.label]));

      const getByLabel = (label) => {
        let foundId = null;
        for (const [id, lab] of idToLabel.entries()) { if (lab === label) { foundId = id; break; } }
        if (!foundId) {
          for (const [id, lab] of idToLabel.entries()) { if (lab?.includes?.(label)) { foundId = id; break; } }
        }
        if (!foundId) return undefined;
        return answers[foundId];
      };

      const num = idx++;
      const name = getByLabel('שם') ?? insp.soldier_name ?? '';
      const antenna = getByLabel('אנטנה') ?? '';
      const mearash = getByLabel('מער"ש') ?? getByLabel('מער״ש') ?? '';
      const tzabadRaw = getByLabel('צב"ד') ?? getByLabel('צב״ד');
      const tzabad = (tzabadRaw === true || tzabadRaw === 'עבר' || tzabadRaw === 'תקין' || tzabadRaw === 'Pass')
        ? 'עבר'
        : (tzabadRaw === false || tzabadRaw === 'נכשל' ? 'נכשל' : '');
      const encryption = normalizeCheckbox(getByLabel('הצפנ'));
      const freqs = normalizeCheckbox(getByLabel('תדר'));
      const comms = normalizeCheckbox(getByLabel('בדיקות קשר'));
      const battery = normalizeCheckbox(getByLabel('החלפת סוללה'));
      const sealing = sealingToStatus(getByLabel('אטימות'));
      const extraEquipVal = getByLabel('ציוד נוסף') ?? '';
      const extraEquip = Array.isArray(extraEquipVal) ? extraEquipVal.join(' • ') : extraEquipVal;
      const notes = getByLabel('הערות') ?? (insp.remarks || '');

      out.push([
        num,
        sanitize(name),
        sanitize(antenna),
        sanitize(mearash),
        tzabad,
        checkboxToMark(encryption),
        checkboxToMark(freqs),
        checkboxToMark(comms),
        checkboxToMark(battery),
        sealing,
        sanitize(extraEquip),
        sanitize(notes)
      ]);
    });

    return out;
  }, [card, inspections, checklists]);

  const handleDownloadCsv = () => {
    const csv = toCsv([HEADERS, ...rows]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${card?.title || 'card'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button onClick={handleDownloadCsv} className="bg-blue-600 hover:bg-blue-700 rounded-none">
          <Download className="w-4 h-4 ml-2" />
          הורד CSV
        </Button>
        <span className="text-sm text-slate-500">שורות: {rows.length}</span>
      </div>
      <ScrollArea className="h-[60vh] border rounded-lg">
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
    </div>
  );
}

function normalizeCheckbox(val) {
  if (val === true) return true;
  if (val === false) return false;
  if (typeof val === 'string') {
    if (['כן','true','TRUE','תקין','עבר','V','v'].includes(val)) return true;
    if (['לא','false','FALSE','לא תקין','נכשל','X','x'].includes(val)) return false;
  }
  return undefined;
}

function checkboxToMark(val) {
  if (val === true) return '✅';
  if (val === false) return '❌';
  return '';
}

function sealingToStatus(val) {
  if (val === undefined || val === null || val === '') return 'לא בוצע';
  if (val === true || ['בוצע','עבר','תקין','כן','Pass','V','v'].includes(String(val))) return 'בוצע';
  if (val === false || ['לא עבר','נכשל','X','x','לא תקין'].includes(String(val))) return 'לא עבר';
  return String(val);
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