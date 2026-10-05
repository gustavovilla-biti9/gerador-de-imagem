# Próximos passos

Este documento tem duas partes: **(1)** o que falta para colocar o site no ar de verdade, e **(2)** como o projeto está organizado para você (ou outra pessoa) conseguir adicionar funcionalidades novas ou mexer no front sem precisar reentender tudo do zero.

## Status atual

- `frontend/` — Next.js (App Router), UI pública + painel `/admin` protegido por senha.
- `backend/` — FastAPI, roda como serviço **interno** da Vercel (sem rota pública — só o frontend alcança via *service binding*).
- Integração com Replicate (`google/nano-banana`) para a geração preservando identidade.
- Nada disso está provisionado ainda: sem banco, sem Blob real, sem token do Replicate. É puro código até você rodar os passos abaixo.

---

## 1. Colocar o site no ar

Siga nessa ordem — cada passo depende do anterior.

1. **Instalar e logar na Vercel CLI**
   ```
   npm i -g vercel
   vercel login
   vercel link
   ```
   (`vercel link` dentro da raiz do repo, não dentro de `frontend/` ou `backend/` — o projeto é o monorepo inteiro.)

2. **Provisionar Neon Postgres** (metadados da galeria)
   ```
   vercel integration add neon
   ```

3. **Provisionar Upstash Redis** (rate limiting do `/generate`)
   ```
   vercel integration add upstash
   ```

4. **Vercel Blob já vem nativo** — não precisa instalar nada, só vai funcionar assim que o projeto estiver linkado.

5. **Criar a tabela no Postgres.** Ainda não existe nenhuma migration configurada — o modelo em `backend/gallery/models.py` descreve a tabela, mas ninguém criou ela no banco ainda. Rode isto uma vez no console SQL do Neon (ou via `psql`):
   ```sql
   CREATE TABLE IF NOT EXISTS reference_images (
       id SERIAL PRIMARY KEY,
       url VARCHAR NOT NULL,
       category VARCHAR NOT NULL,
       title VARCHAR NOT NULL,
       sort_order INTEGER NOT NULL DEFAULT 0,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now()
   );
   CREATE INDEX IF NOT EXISTS ix_reference_images_category ON reference_images (category);
   ```
   Se o projeto crescer e o schema começar a mudar com frequência, vale configurar [Alembic](https://alembic.sqlalchemy.org/) para migrations versionadas em vez de rodar SQL manual — mas para o estágio atual isso seria over-engineering.

6. **Conta no Replicate**: criar em https://replicate.com, gerar um token em *Account → API tokens*.

7. **Cadastrar as variáveis de ambiente** (veja `.env.example` para a lista completa com comentários):
   ```
   vercel env add REPLICATE_API_TOKEN
   vercel env add ADMIN_PASSWORD
   vercel env add ADMIN_SESSION_SECRET   # gere com: openssl rand -hex 32
   ```
   `DATABASE_URL`, `UPSTASH_REDIS_REST_URL/TOKEN` e `BLOB_READ_WRITE_TOKEN` são preenchidos automaticamente pelos passos 2-4.

8. **Sincronizar localmente e testar com o binding real**:
   ```
   vercel env pull --yes
   vercel dev
   ```
   Só `vercel dev` (não `next dev`) ativa o *service binding* entre frontend e backend — é a única forma de testar o fluxo completo localmente.

9. **Popular a galeria inicial** pelo `/admin` com algumas cenas — lembrando da decisão já tomada: **cenas genéricas (geradas por IA ou licenciadas)**, nunca fotos reais de celebridades/revistas, por causa de direito autoral e de imagem.

10. **Deploy**:
    ```
    vercel deploy            # preview
    vercel deploy --prod     # produção, depois de validar o preview
    ```

---

## 2. Rodando só o front, sem a infra toda

Para mexer em UI/estilo sem precisar provisionar nada:
```
cd frontend
npm run dev
```
Isso sobe só o Next.js — sem `BACKEND_URL`, a galeria aparece vazia e a geração falha com uma mensagem amigável (isso já é esperado e tratado no código, não é bug). Serve bem para trabalhar em layout, textos e componentes.

---

## 3. Estrutura do projeto

```
vercel.json          # declara os dois "services" (frontend/backend) e o binding entre eles
frontend/             # Next.js — único ponto público
  app/
    page.tsx           # página principal (gerador)
    admin/              # painel admin (senha única, sem contas)
    api/                # Route Handlers = proxy fino para o backend
  components/          # componentes React
  lib/
    backend-client.ts   # único lugar que sabe chamar o backend (via BACKEND_URL)
    blob.ts              # upload/remoção no Vercel Blob
    admin-session.ts      # cookie assinado do admin
    gallery.ts             # leitura da galeria (usado por Server Components)
  proxy.ts              # protege /admin e /api/admin/* (Next 16 renomeou middleware.ts → proxy.ts)
backend/              # FastAPI — sem rota pública, só alcançável pelo binding
  main.py               # monta o app e inclui os routers
  core/                  # config (env vars), rate limiting
  generation/             # endpoint /generate (chama o Replicate)
  gallery/                # endpoint /gallery e /admin/images (CRUD)
  db/                      # sessão async do SQLAlchemy/Neon
```

**Regra importante**: o `backend/` nunca deve ganhar uma rota pública em `vercel.json`. Se algum dia for preciso expor um endpoint Python diretamente (não deveria ser necessário), isso é uma decisão consciente, não um acidente de configuração.

---

## 4. Como adicionar uma funcionalidade nova

**Lógica de negócio nova** (ex: um novo tipo de geração, um recurso que mexe no banco, chama outra API paga):
1. Criar um módulo em `backend/<nome>/` com `router.py` + `service.py` + `schemas.py` (siga o padrão de `backend/generation/` ou `backend/gallery/`).
2. Registrar o router em `backend/main.py`: `app.include_router(<nome>_router)`.
3. Se precisar expor ao navegador, criar `frontend/app/api/<rota>/route.ts` que só repassa pro backend via `callBackend()` (`lib/backend-client.ts`) — nunca chamar o backend direto do client.
4. Se o endpoint for caro (chama uma API paga), repita o padrão de rate limiting de `backend/core/rate_limit.py`.

**Nova tabela/coluna no banco**: adicionar o modelo SQLAlchemy no módulo correspondente e criar a tabela/coluna manualmente no Neon (ou configurar Alembic se isso virar rotina).

**Só front, sem lógica de servidor nova** (novo componente visual, nova seção, texto, estilo): mexe só em `frontend/components/` e `frontend/app/`, sem tocar no backend.

---

## 5. Convenções para lembrar

- **Nunca** hardcodar chave/senha/token — sempre variável de ambiente, lida de forma que falha explicitamente se faltar (não um valor-padrão silencioso). Veja `backend/core/config.py` e `frontend/lib/admin-session.ts` como referência.
- **Nunca** commitar `.env*` com valores reais — só `.env.example` (nomes, sem valores) vai pro git.
- Banco de imagens de referência: só cenas genéricas/licenciadas, nunca fotos reais de pessoas públicas (decisão tomada por risco de direito autoral/de imagem).
- `frontend` é a única porta pública; `backend` nunca deve virar público "para facilitar".

---

## 6. Comandos do dia a dia

```
# Frontend
cd frontend
npm run dev          # dev server (sem backend real)
npm run build        # build de produção
npx eslint .         # lint
npx tsc --noEmit     # type-check

# Backend (ambiente local opcional, para rodar scripts/testes Python)
cd backend
python -m venv .venv
./.venv/Scripts/pip install -r requirements.txt

# Projeto inteiro (com binding real entre os dois serviços)
vercel dev
vercel deploy
vercel deploy --prod
vercel env pull --yes
```
