# 📖 Manual de Instalação e Configuração em Produção

Este manual descreve detalhadamente os procedimentos para instalar, configurar e colocar em produção o sistema **Zx-Escola**.

---

## 📋 1. Requisitos do Sistema

### Requisitos Mínimos de Hardware
* **Processador**: 2 Cores (ou vCPUs)
* **Memória RAM**: 2 GB (Mínimo) / 4 GB (Recomendado)
* **Espaço em Disco**: 10 GB de SSD livre (para banco de dados, logs e uploads de arquivos)

### Requisitos de Software
* **Sistema Operacional**: Windows Server 2019+ ou Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
* **Node.js**: v20.x ou superior (LTS)
* **npm**: v9.x ou superior
* **Docker & Docker Compose**: Opcional (Recomendado para Produção)

---

## 🚀 2. Métodos de Instalação

Escolha um dos dois métodos abaixo para a instalação do Zx-Escola:

### Método A: Instalação Nativa (Recomendado para Desenvolvimento/Homologação)

Siga os passos abaixo para configurar o ambiente de forma nativa na máquina host.

#### Passo 1: Obter o Código Fonte
Faça o download do código-fonte do sistema ou clone o repositório utilizando Git:
```bash
git clone https://github.com/seu-usuario/zx-escola.git
cd zx-escola
```

#### Passo 2: Executar o Script de Instalação Automatizada (Apenas Windows)
No Windows, abra o PowerShell como Administrador na pasta raiz do projeto e execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\scripts\setup.ps1
```
Este script instalará as dependências, criará o arquivo de configuração `.env` inicial, aplicará as migrações no banco de dados SQLite e rodará a semente com o usuário administrador padrão (`admin@escola.com` / `admin123`).

#### Passo 3: Configuração Manual em Servidores Linux
Caso esteja instalando no Linux de forma nativa:
```bash
# 1. Configurar o backend
cd backend
npm install
cp .env.example .env
# Edite as configurações no arquivo .env com seu editor (ex: nano .env)

# 2. Executar migrações do banco e gerar o cliente do banco de dados
npx prisma migrate deploy --schema=src/prisma/schema.prisma
npx prisma generate --schema=src/prisma/schema.prisma

# 3. Executar o seed inicial
npm run seed

# 4. Configurar o frontend
cd ../frontend
npm install
npm run build
```

---

### Método B: Instalação via Docker (Recomendado para Produção)

A instalação utilizando contêineres Docker isola todas as dependências e facilita o deploy de forma robusta e idêntica em qualquer ambiente de nuvem.

#### Passo 1: Preparar os arquivos
1. Clone o projeto no servidor.
2. Copie o arquivo `.env.example` na raiz do projeto para criar o arquivo `.env`:
   ```bash
   cp .env.example .env
   ```

#### Passo 2: Configurar o arquivo `.env`
Abra o arquivo `.env` na raiz do projeto e preencha as variáveis de ambiente essenciais. Em produção, você **obrigatoriamente** deve alterar as chaves secretas do JWT:
* `JWT_SECRET`: Insira um segredo forte.
* `JWT_REFRESH_SECRET`: Insira outro segredo forte diferente do primeiro.
* `DATABASE_URL`: Por padrão está configurado para SQLite persistido (`file:./dev.db`). Para produção com alto volume de acessos, configure uma string de conexão com o banco de dados PostgreSQL.
* `OPENAI_API_KEY`: Insira sua chave de API caso deseje ativar os recursos de IA. Caso contrário, o sistema funcionará em modo simulado.
* `ALLOWED_ORIGINS`: Defina os endereços autorizados separados por vírgula (ex: `https://escola.seudominio.com`).

#### Passo 3: Subir os contêineres
Suba a infraestrutura do sistema executando o comando abaixo na pasta raiz:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```
Este comando construirá as imagens otimizadas para produção:
- O **Backend** será compilado e exposto internamente.
- O **Frontend** passará pelo processo de build estático e será servido por um servidor Nginx leve e de alta performance.
- As migrações do banco de dados serão aplicadas de forma automatizada ao iniciar o contêiner do backend.

---

## 🔒 3. Configuração de Nginx Reverso e SSL (HTTPS)

Para expor o sistema com segurança na internet utilizando HTTPS, configure um servidor Nginx na máquina host como proxy reverso apontando para as portas expostas.

Exemplo de configuração `/etc/nginx/sites-available/zx-escola`:
```nginx
# Redirecionamento de HTTP para HTTPS
server {
    listen 80;
    server_name app.seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/app.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.seudominio.com/privkey.pem;

    # Frontend SPA (porta padrão ou porta exposta no Docker/nginx)
    location / {
        proxy_pass http://localhost:5173; # ajuste para a porta mapeada no frontend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API e Uploads
    location /api/ {
        proxy_pass http://localhost:3000; # ajuste para a porta mapeada no backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

Para obter certificados SSL gratuitos, utilize o **Certbot (Let's Encrypt)**:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d app.seudominio.com
```

---

## 🛠️ 4. Manutenção e Atualizações

### Atualizar o Sistema (Git)
Execute o script de atualização no Windows para obter o código mais recente, realizar backup automático, rodar migrações e reconstruir os pacotes:
```powershell
.\scripts\update.ps1
```

### Backup Diário do Banco de Dados
Mantenha seus dados seguros programando backups automáticos de forma diária. O script `./scripts/backup.ps1` pode ser configurado em uma tarefa agendada no Windows ou no Cron do Linux para salvar o estado do banco e os arquivos em `./backups/`.
