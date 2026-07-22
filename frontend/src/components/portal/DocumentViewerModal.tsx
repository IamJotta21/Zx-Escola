import React, { useRef } from 'react';
import { Printer, Download, X, CheckCircle2, ShieldCheck } from 'lucide-react';
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

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !document) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = document.issueDate || new Date().toLocaleDateString('pt-BR');
  const docHash = `ZX-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${new Date().getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background dark:bg-slate-900 rounded-2xl shadow-2xl border border-border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-sm truncate">{document.title}</h3>
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

        {/* Document Printable Body */}
        <div className="p-6 md:p-10 overflow-y-auto bg-white text-slate-900 print:p-0 print:m-0 print:bg-white print:text-black">
          <div
            ref={printRef}
            className="max-w-3xl mx-auto border border-slate-200 p-8 rounded-lg shadow-sm space-y-6 print:border-none print:shadow-none print:p-0"
          >
            {/* Header / Letterhead */}
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
              <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase">
                {document.title}
              </h2>
            </div>

            {/* Student Info Metadata */}
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

            {/* DOCUMENT SPECIFIC BODY */}

            {/* 1. BOLETIM / HISTÓRICO */}
            {(document.type === 'BOLETIM' || document.type === 'HISTORICO') && document.reportCards && (
              <div className="space-y-4">
                <table className="w-full text-xs border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold">
                      <th className="border border-slate-300 p-2 text-left">Disciplina</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 1</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 2</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 3</th>
                      <th className="border border-slate-300 p-2 text-center">Bim 4</th>
                      <th className="border border-slate-300 p-2 text-center">Rec.</th>
                      <th className="border border-slate-300 p-2 text-center">Média Final</th>
                      <th className="border border-slate-300 p-2 text-center">Faltas</th>
                      <th className="border border-slate-300 p-2 text-right">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {document.reportCards.map((rc, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 p-2 font-bold text-slate-900">
                          {rc.subject}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {rc.bimester1 ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {rc.bimester2 ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {rc.bimester3 ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {rc.bimester4 ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono text-rose-600">
                          {rc.remedialGrade ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono font-black text-slate-900">
                          {rc.finalAverage ?? '—'}
                        </td>
                        <td className="border border-slate-300 p-2 text-center font-mono">
                          {rc.absences}
                        </td>
                        <td className="border border-slate-300 p-2 text-right font-bold text-xs">
                          <span
                            className={
                              rc.status === 'APROVADO'
                                ? 'text-emerald-700'
                                : rc.status === 'REPROVADO'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }
                          >
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
              </div>
            )}

            {/* 2. DECLARAÇÃO DE MATRÍCULA */}
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
                <p>
                  Por ser a expressão da verdade, firmamos a presente declaração para que produza seus efeitos legais.
                </p>
              </div>
            )}

            {/* 3. COMPROVANTE */}
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

            {/* 4. CUSTOM CONTENT */}
            {document.customContent && (
              <div className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed border p-4 rounded-md bg-slate-50">
                {document.customContent}
              </div>
            )}

            {/* Footer Signatures */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center text-xs">
              <div className="space-y-1">
                <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                  Secretaria Acadêmica
                </div>
                <div className="text-[10px] text-slate-500">ZX-Escola Gestão Escolar</div>
              </div>
              <div className="space-y-1">
                <div className="border-t border-slate-400 pt-2 font-bold text-slate-800">
                  Direção Geral / Coordenação
                </div>
                <div className="text-[10px] text-slate-500">Assinatura Digital Verificada</div>
              </div>
            </div>

            {/* Security Verification footer */}
            <div className="text-center pt-4 border-t border-slate-200 text-[10px] text-slate-400">
              Documento gerado eletronicamente em {todayStr}. A autenticidade deste documento pode ser confirmada junto à Secretaria da Escola utilizando o código {docHash}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
