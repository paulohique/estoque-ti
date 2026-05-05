# Estoque TI

Sistema de gestao de estoque de TI desenvolvido com Next.js, TypeScript e MySQL. O projeto centraliza cadastro de itens, movimentacoes, categorias, setores, permissões de acesso, auditoria e suporte a imagem dos produtos.

## Visao geral

O sistema foi organizado em camadas para separar interface, regra de negocio e acesso ao banco:

- `src/app` concentra as paginas e rotas da aplicacao.
- `src/controllers` coordena as requisicoes HTTP.
- `src/services` aplica as regras de negocio.
- `src/repositories` acessa o MySQL.
- `src/models` define os tipos principais.
- `database/migrations` guarda a evolucao do schema.
- `scripts` contem utilitarios de banco e seed de demo.

## Funcionalidades

- Dashboard com indicadores, comparativos mensais, ranking de movimentacoes, itens parados e historico por setor.
- Cadastro, edicao, listagem e exclusao logica de produtos.
- Upload e exibicao de imagem por produto.
- Controle de estoque com entradas, saidas e transferencias.
- Categorias e setores com gerenciamento dedicado.
- Controle de acesso por perfil e permissao individual.
- Log de auditoria para operacoes relevantes.
- Integracao com GLPI para saidas de estoque.
- Suporte a autenticacao local e opcionalmente AD/LDAP.

## Requisitos

- Node.js 18 ou superior.
- MySQL 8 ou compatível.
- Um banco vazio ou um banco que possa receber as migrations do projeto.
- Opcionalmente phpMyAdmin ou outra interface para administrar o MySQL.

## Estrutura do banco

O schema principal esta em [database/schema.sql](database/schema.sql) e as evolucoes versionadas em [database/migrations](database/migrations).

As tabelas principais sao:

- `roles`
- `permissions`
- `role_permissions`
- `users`
- `user_permissions`
- `sectors`
- `categories`
- `items`
- `item_images`
- `stock_movements`
- `audit_logs`

## Configuracao

1. Crie um arquivo `.env` na raiz do projeto com base em [.env.example](.env.example).
2. Ajuste as credenciais do MySQL.
3. Defina a base de dados correta em `DB_NAME`.

Exemplo:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=sua_senha
DB_NAME=estoqueti

JWT_SECRET=uma-chave-forte-aqui
JWT_EXPIRES_IN=8h

AD_ENABLED=false
GLPI_API_URL=https://sua-instancia-glpi/apirest.php
GLPI_APP_TOKEN=change-me
GLPI_USER_TOKEN=change-me
```

## Instalacao

```bash
npm install
```

## Criacao do banco

Se ainda nao existir, crie o banco com o nome definido em `DB_NAME`.

Exemplo:

```sql
CREATE DATABASE estoqueti DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## Executar migrations

```bash
npm run db:migrate
```

Esse comando aplica os arquivos `.sql` dentro de `database/migrations` e registra o que ja foi executado.

## Popular com dados de demo

Para deixar o sistema pronto para captura de tela, use os seeds de demo:

```bash
npm run db:seed:demo
```

Esse comando recria os dados ficticios do projeto com exemplos de:

- usuarios
- permissoes
- setores
- categorias
- produtos
- movimentacoes
- auditoria

## Aplicar imagens genericas aos produtos existentes

Se voce ja tiver produtos cadastrados e quiser preencher imagem padrao para todos eles:

```bash
npm run db:seed:item-images
```

O comando gera um arquivo publico genérico em `public/uploads/demo-item.svg` e grava esse caminho em `items.image_path` e `item_images`.

## Rodar a aplicacao

Modo de desenvolvimento:

```bash
npm run dev
```

Modo de producao:

```bash
npm run build
npm run start
```

## Login

Quando o banco estiver com os dados de demo, as credenciais iniciais sao:

- usuario: `admin`
- senha: `admin`

## Fluxo principal

1. O usuario acessa a interface em `src/app`.
2. As paginas consomem as rotas em `src/app/api`.
3. Os controllers validam a requisicao e chamam os services.
4. Os services aplicam as regras de negocio.
5. Os repositories leem e gravam no MySQL.

## Principais telas

- Dashboard: resumo operacional com cards, graficos e listas.
- Produtos: cards com imagem, patrimonio, SKU, serie, localizacao e acoes de editar/excluir.
- Estoque: itens com saldo critico e abaixo do minimo.
- Movimentacao: registro de entradas, saidas e transferencias.
- Auditoria: trilha de eventos e historico de operacoes.
- Setores: cadastro e manutencao de areas.
- Categorias: organizacao do inventario.
- Seguranca: gerenciamento de usuarios, papeis e overrides.

## Integracoes

- Autenticacao local por usuario e senha.
- Suporte a AD/LDAP quando `AD_ENABLED=true`.
- Integracao com GLPI para saidas de estoque.
- Upload de imagens de itens com armazenamento em `public/uploads`.

## Comandos uteis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:migrate
npm run db:seed:demo
npm run db:seed:item-images
```

## Solucao de problemas

### Erro de acesso ao MySQL

Confirme se `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS` e `DB_NAME` estao corretos no arquivo `.env`.

### Erro de data ao editar item

O campo `purchaseDate` e normalizado pela API para aceitar valores de formulario e strings ISO. Se houver falha, verifique se o frontend esta enviando um valor de data valido.

### Imagem nao aparece no card do produto

O card usa `items.image_path`. Se a imagem nao aparecer, verifique se o caminho salvo existe em `public/` ou se o upload foi gravado em `public/uploads`.

### Modal grande demais

O modal de edicao usa uma largura reduzida para ficar mais compacto, mas ainda respeita o conteudo do formulario.

## Observacoes de desenvolvimento

- O projeto usa migrations versionadas e um seed de demo para facilitar testes e prints.
- A tabela `schema_migrations` controla o que ja foi executado.
- A estrategia de imagem atual privilegia um caminho publico simples para facilitar a exibicao na interface.

## Licenca

Projeto interno / sem licenca publica definida.