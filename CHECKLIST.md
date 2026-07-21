# 🏁 Checklist de Prontidão para Produção (Go-Live)

Este checklist consolida todos os itens técnicos obrigatórios a serem validados antes de iniciar as operações em ambiente de produção para o sistema **Zx-Escola**.

---

## 🔒 1. Segurança & LGPD
- [ ] **Segredos JWT alterados**: As chaves `JWT_SECRET` e `JWT_REFRESH_SECRET` no arquivo `.env` do servidor de produção devem conter hashes aleatórios e seguros gerados no momento da instalação.
- [ ] **Limitação de CORS**: Substituir a configuração de origem curinga (`ALLOWED_ORIGINS=*`) no `.env` de produção pelos domínios oficiais que servirão a aplicação cliente.
- [ ] **HTTPS Ativado**: Todo tráfego HTTP redirecionado para HTTPS na porta 443 com certificado SSL válido (ex: Let's Encrypt).
- [ ] **Limite de Payload do Body**: Configurado limite máximo de tamanho de payload para 10mb no parser do Express para evitar ataques DoS por envio de pacotes massivos.
- [ ] **Proteção de Credenciais de IA**: A chave de API do OpenAI (`OPENAI_API_KEY`) nunca é exposta no frontend e fica exclusivamente sob variáveis de ambiente no servidor do backend.
- [ ] **Acesso Restrito a Dados de Menores (LGPD)**: Rotas de API que expõem históricos de alunos e dados demográficos utilizam controle de permissão por token de sessão, impossibilitando acessos sem autenticação prévia de responsáveis legais ou equipe da escola.

---

## 📦 2. Banco de Dados & Infraestrutura
- [ ] **Estratégia de Banco de Dados**:
  - SQLite (`DATABASE_URL="file:./dev.db"`) para desenvolvimento ou infraestrutura inicial leve com backup programado.
  - PostgreSQL para implantações em larga escala com concorrência elevada.
- [ ] **Migrações executadas**: Executado `npx prisma migrate deploy` no servidor de produção para garantir que todas as tabelas (incluindo biblioteca, portais e auditoria) estejam instanciadas corretamente.
- [ ] **Backups Programados**: O script de backup (`scripts/backup.ps1` no Windows ou equivalente via crontab no Linux) foi agendado para rodar diariamente e remover arquivos de backup mais velhos que 30 dias.
- [ ] **Persistência de Arquivos Enviados**: O diretório de uploads local `./backend/src/uploads` foi configurado como volume persistente Docker ou mapeado para armazenamento persistente da nuvem.

---

## 📈 3. Testes, Desempenho e Validação
- [ ] **Compilação sem Erros**:
  - Backend TypeScript compila com sucesso (`npm run build`).
  - Frontend React compila com sucesso (`npm run build`).
- [ ] **Minimização do Bundle**: Código compilado do frontend utiliza arquivos CSS e JS minificados para carregamento ultra-rápido de páginas.
- [ ] **Gráficos Otimizados**: Todos os relatórios gráficos utilizam tags SVG nativas, evitando sobrecarga na CPU do cliente e garantindo 100% de responsividade no mobile.
- [ ] **Rate Limiting Ativo**: Proteção contra ataques de força bruta ativada nas rotas críticas (como login e geração de textos por IA) com limite máximo configurado por IP.
