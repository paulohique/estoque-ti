# Arquitetura (MVC) - Next.js + Node + MySQL (phpMyAdmin)

Esta estrutura organiza o projeto em camadas MVC e separa responsabilidades entre API, controllers, services e models.

## Visao geral

- Views: componentes e paginas em `src/app` (App Router) e `src/components`.
- Controllers: orquestram requisicoes HTTP e chamam services.
- Services: contem regras de negocio.
- Models: tipos/entidades e contratos de dados.
- Repositories: acesso ao banco de dados (MySQL).
- Lib/Config: conexao, helpers e configuracoes.
- Database: schema base em `database/schema.sql` e evolucao versionada em `database/migrations`.

## Estrutura de pastas

```
.
├─ ARCHITECTURE.md
├─ .env.example
├─ database/
│  └─ schema.sql
└─ src/
   ├─ app/
   │  └─ api/
   │     └─ health/
   │        └─ route.ts
   ├─ components/
   ├─ config/
   ├─ controllers/
   ├─ lib/
   ├─ middlewares/
   ├─ models/
   ├─ repositories/
   ├─ services/
   ├─ types/
   └─ views/
```

## Fluxo de chamada

Request -> API Route (app/api) -> Controller -> Service -> Repository -> MySQL

## Observacoes

- Use phpMyAdmin apenas como interface de administracao do MySQL (XAMPP).
- Variaveis de ambiente ficam em `.env` (exemplo em `.env.example`).
- Execute `npm run db:migrate` para aplicar as migrations versionadas do MySQL.
- O App Router do Next.js serve como camada de Views.
- Autenticacao via AD e permissao efetiva por perfil + overrides individuais.
- Saidas exigem numero de chamado GLPI e envio de comentario via API.
- Setores serao associados a movimentacoes para dashboards por area.
