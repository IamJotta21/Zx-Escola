import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Lock, ShieldAlert, Terminal, Globe, BookOpen } from 'lucide-react';

export const ApiDocsMigration: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <BookOpen className="h-7 w-7 text-primary" />
          Documentação das APIs de Migração
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Integre softwares externos de forma direta e segura usando nossos endpoints REST
          automatizados.
        </p>
      </div>

      {/* Security & Authentication Info */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-background">
          <CardContent className="p-5 space-y-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Autenticação Bearer</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Todos os endpoints requerem o token JWT passado no header:
            </p>
            <pre className="p-2.5 rounded-lg border bg-muted/50 font-mono text-[10px] text-foreground select-all truncate">
              Authorization: Bearer &lt;TOKEN&gt;
            </pre>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-background">
          <CardContent className="p-5 space-y-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/20 text-amber-500 w-fit">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Somente Administradores</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Acesso exclusivo a tokens gerados por usuários com role{' '}
              <Badge variant="outline" className="border-amber-500 text-amber-500">
                ADMIN
              </Badge>{' '}
              ou superior.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-background">
          <CardContent className="p-5 space-y-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/20 text-blue-500 w-fit">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Rate Limiting</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Limite estrito de segurança de até{' '}
              <strong className="text-foreground">100 requisições por janela de 15 minutos</strong>{' '}
              por endereço IP de origem.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Endpoints Documentation */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 border-b pb-2">
          <Terminal className="h-5 w-5 text-primary" />
          Endpoints de Integração
        </h2>

        {/* 1. POST /api/import/upload */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] py-1 px-2.5">
                POST
              </Badge>
              <code className="text-xs font-mono font-extrabold text-foreground bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                /api/import/upload
              </code>
              <span className="text-xs text-muted-foreground">
                Upload de Planilha para Importação
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Envia um arquivo físico nos formatos XLSX, CSV, JSON ou XML. O endpoint salva o
              arquivo na fila de processamento temporário do servidor e retorna o identificador
              gerado `fileId`.
            </p>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Formato Payload (Multipart Form)
              </h4>
              <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 font-mono text-[10px] text-foreground space-y-1">
                <div>file: &lt;Arquivo Físico&gt;</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Resposta de Sucesso (201 Created)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "status": "success",
  "message": "Arquivo carregado com sucesso via API Pública.",
  "data": {
    "fileId": "65b9a89c-4f11-482a-a92c-0e86b241315b"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 2. POST /api/import */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] py-1 px-2.5">
                POST
              </Badge>
              <code className="text-xs font-mono font-extrabold text-foreground bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                /api/import
              </code>
              <span className="text-xs text-muted-foreground">Disparar Importação Consolidada</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Agenda a importação definitiva relacionando o `fileId` enviado anteriormente com o
              `modelId` (modelo de mapeamento de cabeçalhos). O processamento inicia imediatamente
              em segundo plano.
            </p>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Parâmetros Body (JSON)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "fileId": "65b9a89c-4f11-482a-a92c-0e86b241315b",
  "modelId": "c4794e33-7264-4bf8-b999-ea9a016629de"
}`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Resposta de Sucesso (202 Accepted)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "status": "success",
  "message": "Importação pública iniciada.",
  "data": {
    "importId": "c8e27c7f-f7d1-41b9-8c9e-56e6b24131de"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 3. POST /api/import/status */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-mono text-[10px] py-1 px-2.5">
                POST
              </Badge>
              <code className="text-xs font-mono font-extrabold text-foreground bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                /api/import/status
              </code>
              <span className="text-xs text-muted-foreground">
                Consultar Status e Logs de Importação
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verifica o progresso da importação, taxa de sucesso/erros e registros de linha.
            </p>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Parâmetros Body (JSON)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "importId": "c8e27c7f-f7d1-41b9-8c9e-56e6b24131de"
}`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Resposta de Sucesso (200 OK)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "status": "success",
  "data": {
    "id": "c8e27c7f-f7d1-41b9-8c9e-56e6b24131de",
    "status": "COMPLETED",
    "totalRows": 25,
    "processedRows": 25,
    "successRows": 23,
    "errorRows": 2,
    "logs": [
      {
        "row": 3,
        "status": "ERROR",
        "message": "CPF duplicado na linha 3",
        "details": null
      }
    ],
    "history": [
      {
        "status": "PENDING",
        "details": "Importação solicitada via API Pública.",
        "timestamp": "2026-07-18T18:28:20.000Z"
      }
    ]
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 4. GET /api/export */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-mono text-[10px] py-1 px-2.5">
                GET
              </Badge>
              <code className="text-xs font-mono font-extrabold text-foreground bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                /api/export
              </code>
              <span className="text-xs text-muted-foreground">Disparar Exportação de Dados</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Triggers a background export task. Accepts query parameters: `format` (ZIP, XLSX, CSV,
              JSON, XML), `modules` (comma-separated lists), and `filterType` (COMPLETO, etc.).
            </p>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Parâmetros de Query String
              </h4>
              <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 font-mono text-[10px] text-foreground space-y-1.5 leading-relaxed">
                <div>
                  • <strong className="text-foreground">format</strong>: ZIP, XLSX, CSV, JSON, XML
                  (Padrão: ZIP)
                </div>
                <div>
                  • <strong className="text-foreground">modules</strong>: ALUNOS, RESPONSAVEIS,
                  PROFESSORES, FINANCEIRO (Padrão: ALUNOS)
                </div>
                <div>
                  • <strong className="text-foreground">filterType</strong>: COMPLETO (Padrão:
                  COMPLETO)
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Resposta de Sucesso (202 Accepted)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "status": "success",
  "message": "Exportação pública iniciada.",
  "data": {
    "exportId": "9b9f71c4-118e-48a2-a9b0-9b37c1de3dfb"
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 5. GET /api/export/status */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-mono text-[10px] py-1 px-2.5">
                GET
              </Badge>
              <code className="text-xs font-mono font-extrabold text-foreground bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                /api/export/status
              </code>
              <span className="text-xs text-muted-foreground">Consultar Status de Exportação</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consulte a situação atual da gravação física de exportação.
            </p>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Query Parameters
              </h4>
              <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 font-mono text-[10px] text-foreground space-y-1.5 leading-relaxed">
                <div>
                  • <strong className="text-foreground">exportId</strong>: UUID da exportação
                  gerada.
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Resposta de Sucesso (200 OK)
              </h4>
              <pre className="p-3 rounded-xl border bg-muted/40 font-mono text-[10px] text-foreground overflow-x-auto select-all">
                {`{
  "status": "success",
  "data": {
    "id": "9b9f71c4-118e-48a2-a9b0-9b37c1de3dfb",
    "status": "COMPLETED",
    "totalRows": 254,
    "processedRows": 254,
    "sizeBytes": 45600,
    "history": [
      {
        "status": "COMPLETED",
        "details": "Exportação concluída com sucesso.",
        "timestamp": "2026-07-18T18:29:10.000Z"
      }
    ]
  }
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* 6. GET /api/export/download */}
        <Card className="border-border/60">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-blue-600 hover:bg-blue-600 text-white font-mono text-[10px] py-1 px-2.5">
                GET
              </Badge>
              <code className="text-xs font-mono font-extrabold text-foreground bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                /api/export/download
              </code>
              <span className="text-xs text-muted-foreground">
                Download Direto do Arquivo Gerado
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Efetua o download do arquivo compactado ou planilha de dados assim que a tarefa atinge
              o status{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded border text-[10px]">COMPLETED</code>.
            </p>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Query Parameters
              </h4>
              <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900/40 font-mono text-[10px] text-foreground space-y-1.5 leading-relaxed">
                <div>
                  • <strong className="text-foreground">exportId</strong>: UUID da exportação
                  gerada.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ApiDocsMigration;
