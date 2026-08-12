# EduSync Pro

EduSync Pro é uma aplicação web para gestão escolar, desenvolvida com React, Vite e Tailwind CSS.

O frontend foi desacoplado de plataformas proprietárias e agora consome uma API REST configurável. A autenticação, usuários, escolas, turmas, alunos, professores, matérias, atividades, notas, observações e planos de aula devem ser fornecidos pelo backend da aplicação.

## Tecnologias

- React 18
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- Radix UI
- Framer Motion
- Lucide React

## Requisitos

- Node.js 18 ou superior
- npm
- Uma API REST compatível com os endpoints descritos abaixo

## Instalação

```bash
git clone https://github.com/wuotans/edusyncpro.git
cd edusyncpro
npm install
```

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api
```

Se `VITE_API_URL` não for informado, o frontend usa `/api`.

## Rodando localmente

```bash
npm run dev
```

Para gerar o build de produção:

```bash
npm run build
```

Para visualizar o build localmente:

```bash
npm run preview
```

## API esperada

A camada `src/api/apiClient.js` centraliza toda a comunicação HTTP.

### Autenticação

- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/resend-otp`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/oauth/google`

O login deve retornar um objeto contendo `access_token`. O token é armazenado no `localStorage` com a chave `edusync_access_token` e enviado nas próximas requisições como `Authorization: Bearer <token>`.

### Entidades

O frontend utiliza os seguintes recursos REST:

- `/entities/activities`
- `/entities/grades`
- `/entities/lesson-plans`
- `/entities/observations`
- `/entities/schools`
- `/entities/classes`
- `/entities/students`
- `/entities/subjects`
- `/entities/teacher-assignments`
- `/entities/users`

Cada recurso deve suportar:

```text
GET    /entities/<recurso>
GET    /entities/<recurso>?campo=valor
GET    /entities/<recurso>/:id
POST   /entities/<recurso>
PUT    /entities/<recurso>/:id
DELETE /entities/<recurso>/:id
```

## Estrutura principal

```text
src/
├── api/
│   └── apiClient.js
├── components/
├── hooks/
├── lib/
├── pages/
└── main.jsx
```

## Perfis de usuário

A aplicação possui suporte aos seguintes perfis:

- Super administrador
- Administrador escolar
- Professor

As permissões são determinadas pelo campo `role` retornado pelo endpoint `/auth/me`.

## Módulos

Entre os módulos existentes no frontend estão:

- Dashboard administrativo
- Gestão de escolas
- Gestão de usuários
- Gestão de professores
- Gestão de turmas
- Gestão de alunos
- Gestão de matérias
- Atividades escolares
- Lançamento de notas
- Observações
- Planos de aula

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run typecheck
```

## Desenvolvimento

Toda comunicação com o backend deve permanecer centralizada em `src/api/apiClient.js`. Isso permite substituir a implementação do backend sem acoplar as páginas do React a um fornecedor específico.
