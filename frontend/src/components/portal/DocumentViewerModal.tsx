import React from 'react';
import { Printer, X, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';

export type DocumentType = 'BOLETIM' | 'DECLARACAO' | 'HISTORICO' | 'COMPROVANTE' | 'CUSTOM';

export interface DocumentData {
  title: string;
  type: DocumentType;
  studentName: string;
  studentId: string;
  className?: string | null;
  schoolYear?: string;
  cpf?: string | null;
  birthDate?: string | null;
  issueDate?: string;
  reportCards?: Array<{
    subject: string;
    bimester1: number | null;
    bimester2: number | null;
    bimester3: number | null;
    bimester4: number | null;
    remedialGrade: number | null;
    finalAverage: number | null;
    status: string;
    absences: number;
  }>;
  attendancePercentage?: number;
  tuitionInfo?: {
    description: string;
    value: number;
    paymentDate: string | null;
    paymentMethod: string | null;
    status: string;
  };
  customContent?: string;
  fileName?: string;
  filePath?: string;
}

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentData | null;
}

// Map Tailwind accent class to hex color for use in print HTML
const accentColorMap: Record<string, string> = {
  'bg-slate-800':   '#1e293b',
  'bg-blue-800':    '#1e40af',
  'bg-emerald-800': '#065f46',
  'bg-amber-800':   '#92400e',
  'bg-indigo-800':  '#3730a3',
};

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  if (!isOpen || !document) return null;

  // Load custom template config from localStorage
  const savedConfig = localStorage.getItem('bulletin_config_custom');
  const config = {
    title: document.title,
    showAbsences: true,
    showRemedial: true,
    showSignatures: true,
    observations: '',
    accentColor: 'bg-slate-800',
  };
  if (savedConfig && (document.type === 'BOLETIM' || document.type === 'HISTORICO')) {
    try {
      const parsed = JSON.parse(savedConfig);
      if (parsed.title) config.title = parsed.title;
      if (parsed.showAbsences !== undefined) config.showAbsences = parsed.showAbsences;
      if (parsed.showRemedial !== undefined) config.showRemedial = parsed.showRemedial;
      if (parsed.showSignatures !== undefined) config.showSignatures = parsed.showSignatures;
      if (parsed.observations !== undefined) config.observations = parsed.observations;
      if (parsed.accentColor) config.accentColor = parsed.accentColor;
    } catch (e) {}
  }

  const todayStr = document.issueDate || new Date().toLocaleDateString('pt-BR');
  const docHash = `ZX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;
  const accentHex = accentColorMap[config.accentColor] || '#1e293b';
  const docTitle = document.type === 'BOLETIM' ? config.title : document.title;

  // ─────────────────────────────────────────────────────────────────
  // Build the FULL HTML string to be opened in a new window for print
  // ─────────────────────────────────────────────────────────────────
  const buildPrintHTML = (): string => {
    // --- BOLETIM / HISTÓRICO table rows ---
    let bodyHTML = '';

    if ((document.type === 'BOLETIM' || document.type === 'HISTORICO') && document.reportCards) {
      const headerCells = [
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:left;color:#fff;background:${accentHex}">Disciplina</th>`,
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Bim 1</th>`,
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Bim 2</th>`,
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Bim 3</th>`,
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Bim 4</th>`,
        config.showRemedial ? `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Rec.</th>` : '',
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Média Final</th>`,
        config.showAbsences ? `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;color:#fff;background:${accentHex}">Faltas</th>` : '',
        `<th style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;color:#fff;background:${accentHex}">Situação</th>`,
      ].join('');

      const rows = document.reportCards.map((rc, idx) => {
        const bg = idx % 2 === 0 ? '#fff' : '#f8fafc';
        const statusColor = rc.status === 'APROVADO' ? '#047857' : rc.status === 'REPROVADO' ? '#be123c' : '#b45309';
        const td = (v: string | number | null, extra = '') =>
          `<td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:center;font-family:monospace;${extra}">${v ?? '—'}</td>`;
        return `<tr style="background:${bg}">
          <td style="border:1px solid #cbd5e1;padding:6px 8px;font-weight:700;color:#0f172a">${rc.subject}</td>
          ${td(rc.bimester1)}
          ${td(rc.bimester2)}
          ${td(rc.bimester3)}
          ${td(rc.bimester4)}
          ${config.showRemedial ? td(rc.remedialGrade, 'color:#be123c') : ''}
          ${td(rc.finalAverage, 'font-weight:900;color:#0f172a')}
          ${config.showAbsences ? td(rc.absences) : ''}
          <td style="border:1px solid #cbd5e1;padding:6px 8px;text-align:right;font-weight:700;color:${statusColor}">${rc.status}</td>
        </tr>`;
      }).join('');

      const attRow = document.attendancePercentage !== undefined
        ? `<div style="text-align:right;font-weight:700;font-size:11px;color:#334155;margin-top:6px">Percentual Global de Frequência: ${document.attendancePercentage}%</div>`
        : '';

      const obsBlock = config.observations
        ? `<div style="margin-top:14px;padding:12px;border:1px dashed #cbd5e1;border-radius:6px;font-size:10px;color:#475569;background:#f8fafc">
            <strong style="display:block;margin-bottom:4px;color:#1e293b;font-size:11px">Observações:</strong>
            <p style="white-space:pre-wrap;line-height:1.6">${config.observations}</p>
           </div>`
        : '';

      bodyHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${attRow}
        ${obsBlock}
      `;

    } else if (document.type === 'DECLARACAO') {
      bodyHTML = `
        <div style="font-size:12px;line-height:1.9;color:#1e293b;padding:20px 0">
          <p>Declaramos para os devidos fins de direito e a quem possa interessar que o(a) aluno(a)
          <strong style="text-transform:uppercase">${document.studentName}</strong>,
          inscrito(a) sob a matrícula nº <strong style="font-family:monospace">#${document.studentId.slice(0, 8).toUpperCase()}</strong>,
          está regularmente matriculado(a) e frequentando as aulas nesta instituição de ensino no ano letivo de
          <strong>${document.schoolYear || new Date().getFullYear()}</strong>, na turma
          <strong>${document.className || 'Ensino Regular'}</strong>.</p>
          <p style="margin-top:14px">Por ser a expressão da verdade, firmamos a presente declaração para que produza seus efeitos legais.</p>
        </div>`;

    } else if (document.type === 'COMPROVANTE') {
      const tuition = document.tuitionInfo;
      bodyHTML = `
        <div style="border:1px solid #a7f3d0;background:#f0fdf4;padding:14px;border-radius:8px;margin-top:8px">
          <div style="font-weight:700;color:#065f46;font-size:13px;margin-bottom:10px">✓ COMPROVANTE OFICIAL DE QUITAÇÃO / MATRÍCULA</div>
          ${tuition ? `
            <div style="font-family:monospace;font-size:11px;line-height:1.8">
              <div>Descrição: <strong>${tuition.description}</strong></div>
              <div>Valor Pago: <strong>R$ ${tuition.value.toFixed(2)}</strong></div>
              <div>Data de Pagamento: <strong>${tuition.paymentDate || todayStr}</strong></div>
              <div>Forma de Pagamento: <strong>${tuition.paymentMethod || 'PIX / Boleto'}</strong></div>
              <div>Status: <span style="color:#047857;font-weight:700">${tuition.status}</span></div>
            </div>` : `<p>Atestamos o cumprimento regular das obrigações acadêmicas e de matrícula para a turma ${document.className || ''}.</p>`}
        </div>`;

    } else if (document.customContent) {
      bodyHTML = `<div style="font-size:11px;white-space:pre-wrap;line-height:1.6;border:1px solid #e2e8f0;padding:12px;border-radius:6px;background:#f8fafc;color:#1e293b">${document.customContent}</div>`;
    }

    const signaturesBlock = config.showSignatures ? `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;text-align:center;margin-top:48px;font-size:10px">
        <div>
          <div style="border-top:1px solid #94a3b8;padding-top:6px;font-weight:700;color:#1e293b">Secretaria Acadêmica</div>
          <div style="font-size:9px;color:#94a3b8;margin-top:2px">ZX-Escola Gestão Escolar</div>
        </div>
        <div>
          <div style="border-top:1px solid #94a3b8;padding-top:6px;font-weight:700;color:#1e293b">Direção Geral / Coordenação</div>
          <div style="font-size:9px;color:#94a3b8;margin-top:2px">Assinatura Digital Verificada</div>
        </div>
      </div>` : '';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${docTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',Arial,sans-serif;font-size:12px;color:#0f172a;background:#fff;padding:32px}
    @media print{body{padding:8px}@page{margin:12mm;size:A4}}
  </style>
</head>
<body>
  <!-- LETTERHEAD -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:16px;margin-bottom:20px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:48px;height:48px;background:#0f172a;color:#fff;font-size:22px;font-weight:900;display:flex;align-items:center;justify-content:center;border-radius:8px">Z</div>
      <div>
        <div style="font-size:18px;font-weight:900;letter-spacing:-0.02em;text-transform:uppercase;color:#0f172a">ZX-Escola Sistema de Ensino</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">Secretaria Escolar • Documento Oficial de Registro Acadêmico</div>
      </div>
    </div>
    <div style="text-align:right;font-size:9px;color:#94a3b8;font-family:monospace">
      <div>CÓD. AUTENTICIDADE</div>
      <div style="font-size:11px;color:#1e293b;font-weight:700">${docHash}</div>
      <div>Emissão: ${todayStr}</div>
    </div>
  </div>

  <!-- TITLE BAR -->
  <div style="text-align:center;padding:10px;background:#f1f5f9;border-radius:6px;margin-bottom:16px">
    <div style="font-size:14px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;color:#0f172a">${docTitle}</div>
  </div>

  <!-- STUDENT META -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:11px;background:#f8fafc;padding:14px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:20px">
    <div>
      <div style="font-weight:600;color:#64748b;margin-bottom:2px">Nome do Aluno:</div>
      <div style="font-weight:700;color:#0f172a;font-size:12px">${document.studentName}</div>
    </div>
    <div>
      <div style="font-weight:600;color:#64748b;margin-bottom:2px">Matrícula / ID:</div>
      <div style="font-family:monospace;font-weight:700;color:#0f172a">#${document.studentId.slice(0, 8).toUpperCase()}</div>
    </div>
    <div>
      <div style="font-weight:600;color:#64748b;margin-bottom:2px">Turma:</div>
      <div style="font-weight:700;color:#0f172a">${document.className || 'Não enturmado'}</div>
    </div>
    <div>
      <div style="font-weight:600;color:#64748b;margin-bottom:2px">Ano Letivo:</div>
      <div style="font-weight:700;color:#0f172a">${document.schoolYear || new Date().getFullYear()}</div>
    </div>
  </div>

  <!-- BODY -->
  ${bodyHTML}

  <!-- SIGNATURES -->
  ${signaturesBlock}

  <!-- SECURITY FOOTER -->
  <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:9px;color:#94a3b8">
    Documento gerado eletronicamente em ${todayStr}. A autenticidade deste documento pode ser confirmada junto à Secretaria da Escola utilizando o código ${docHash}.
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildPrintHTML();
    const printWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-sm truncate">{docTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="h-4 w-4" />}
              onClick={handlePrint}
            >
              Imprimir / Salvar PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Document Preview Body (on-screen only) */}
        <div className="p-6 md:p-10 overflow-y-auto bg-white text-slate-900">
          <div className="max-w-3xl mx-auto border border-slate-200 p-8 rounded-lg shadow-sm space-y-6">
            {/* Letterhead */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center rounded-lg">
                  Z
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                    ZX-Escola Sistema de Ensino
                  </h1>
                  <p className="text-xs text-slate-600">
                    Secretaria Escolar • Documento Oficial de Registro Acadêmico
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-mono">
                <div>CÓD. AUTENTICIDADE</div>
                <div className="font-bold text-slate-800 text-xs">{docHash}</div>
                <div>Emissão: {todayStr}</div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center py-2 bg-slate-100 rounded-md">
              <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">{docTitle}</h2>
            </div>

            {/* Student Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-slate-500">Nome do Aluno:</span>
                <div className="font-bold text-slate-900 text-sm">{document.studentName}</div>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Matrícula / ID:</span>
                <div className="font-mono font-bold text-slate-900">
                  #{document.studentId.slice(0, 8).toUpperCase()}
                </div>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Turma:</span>
                <div className="font-bold text-slate-900">{document.className || 'Não enturmado'}</div>
              </div>
              <div>
                <span className="font-semibold text-slate-500">Ano Letivo:</span>
                <div className="font-bold text-slate-900">{document.schoolYear || new Date().getFullYear()}</div>
              </div>
            </div>

            {/* BOLETIM / HISTÓRICO */}
            {(document.type === 'BOLETIM' || document.type === 'HISTORICO') && document.reportCards && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr style={{ backgroundColor: accentHex }} className="text-white font-bold">
                      <th className="border border-slate-300 p-2 text-left">Disciplina</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 1</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 2</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 3</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 4</th>
                      {config.showRemedial && <th className="border border-slate-300 p-2 text-center">Rec.</th>}
                      <th className="border border-slate-300 p-2 text-center">Média Final</th>
                      {config.showAbsences && <th className="border border-slate-300 p-2 text-center">Faltas</th>}
                      <th className="border border-slate-300 p-2 text-right">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.reportCards.map((rc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">{rc.subject}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{rc.bimester1 ?? '—'}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{rc.bimester2 ?? '—'}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{rc.bimester3 ?? '—'}</td>
                        <td className="border border-slate-300 p-2 text-center font-mono">{rc.bimester4 ?? '—'}</td>
                        {config.showRemedial && (
                          <td className="border border-slate-300 p-2 text-center font-mono text-rose-600">{rc.remedialGrade ?? '—'}</td>
                        )}
                        <td className="border border-slate-300 p-2 text-center font-mono font-black text-slate-900">{rc.finalAverage ?? '—'}</td>
                        {config.showAbsences && (
                          <td className="border border-slate-300 p-2 text-center font-mono">{rc.absences}</td>
                        )}
                        <td className="border border-slate-300 p-2 text-right font-bold text-xs">
                          <span className={rc.status === 'APROVADO' ? 'text-emerald-700' : rc.status === 'REPROVADO' ? 'text-rose-700' : 'text-amber-700'}>
                            {rc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {document.attendancePercentage !== undefined && (
                  <div className="flex justify-end text-xs font-bold text-slate-700">
                    Percentual Global de Frequência: {document.attendancePercentage}%
                  </div>
                )}
                {config.observations && (
                  <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-lg text-xs text-slate-600 bg-slate-50">
                    <span className="font-bold text-slate-800 block mb-1">Observações:</span>
                    <p className="whitespace-pre-wrap leading-relaxed">{config.observations}</p>
                  </div>
                )}
              </div>
            )}

            {/* DECLARAÇÃO */}
            {document.type === 'DECLARACAO' && (
              <div className="space-y-6 text-sm text-slate-800 leading-relaxed py-4">
                <p>
                  Declaramos para os devidos fins de direito e a quem possa interessar que o(a) aluno(a){' '}
                  <strong className="text-slate-900 uppercase font-black">{document.studentName}</strong>,
                  inscrito(a) sob a matrícula nº <strong className="font-mono">#{document.studentId.slice(0, 8).toUpperCase()}</strong>,
                  está regularmente matriculado(a) e frequentando as aulas nesta instituição de ensino no ano letivo de{' '}
                  <strong>{document.schoolYear || new Date().getFullYear()}</strong>, na turma{' '}
                  <strong>{document.className || 'Ensino Regular'}</strong>.
                </p>
                <p>Por ser a expressão da verdade, firmamos a presente declaração para que produza seus efeitos legais.</p>
              </div>
            )}

            {/* COMPROVANTE */}
            {document.type === 'COMPROVANTE' && (
              <div className="space-y-4 text-xs text-slate-800 border border-emerald-200 bg-emerald-50/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 className="h-5 w-5" /> COMPROVANTE OFICIAL DE QUITAÇÃO / MATRÍCULA
                </div>
                {document.tuitionInfo ? (
                  <div className="space-y-2 font-mono">
                    <div>Descrição: <strong>{document.tuitionInfo.description}</strong></div>
                    <div>Valor Pago: <strong>R$ {document.tuitionInfo.value.toFixed(2)}</strong></div>
                    <div>Data de Pagamento: <strong>{document.tuitionInfo.paymentDate || todayStr}</strong></div>
                    <div>Forma de Pagamento: <strong>{document.tuitionInfo.paymentMethod || 'PIX / Boleto'}</strong></div>
                    <div>Status: <span className="text-emerald-700 font-bold">{document.tuitionInfo.status}</span></div>
                  </div>
                ) : (
                  <p>Atestamos o cumprimento regular das obrigações acadêmicas e de matrícula para a turma {document.className || ''}.</p>
                )}
              </div>
            )}

            {/* CUSTOM */}
            {document.customContent && (
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border p-4 rounded-md bg-slate-50">
                {document.customContent}
              </div>
            )}

            {/* Signatures */}
            {config.showSignatures && (
              <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-1">
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">Secretaria Acadêmica</div>
                  <div className="text-[10px] text-slate-500">ZX-Escola Gestão Escolar</div>
                </div>
                <div className="space-y-1">
                  <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">Direção Geral / Coordenação</div>
                  <div className="text-[10px] text-slate-500">Assinatura Digital Verificada</div>
                </div>
              </div>
            )}

            {/* Security footer */}
            <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-400">
              Documento gerado eletronicamente em {todayStr}. A autenticidade deste documento pode ser confirmada junto à Secretaria da Escola utilizando o código {docHash}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
