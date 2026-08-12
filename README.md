# EduSync Pro

EduSync Pro é uma aplicação web para gestão escolar, desenvolvida com React, Vite e Tailwind CSS.

O frontend é independente de plataforma proprietária e consome uma API REST configurável. Autenticação, usuários, escolas, turmas, alunos, professores, matérias, atividades, notas, observações e planos de aula são fornecidos pelo backend da aplicação.

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
- Uma API REST compatível com o contrato descrito abaixo

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

Se `VITE_API_URL` não for informado, o frontend utiliza `/api`.

## Rodando localmente

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

Visualizar o build localmente:

```bash
npm run preview
```

## API esperada

Toda a comunicação HTTP fica centralizada em `src/api/apiClient.js`.

### Autenticação

```text
POST /auth/login
GET  /auth/me
POST /auth/register
POST /auth/verify-otp
POST /auth/resend-otp
POST /auth/forgot-password
POST /auth/reset-password
GET  /auth/oauth/google
```

O login e a validação OTP podem retornar `access_token`. O token é armazenado no `localStorage` com a chave `edusync_access_token` e enviado como:

```text
Authorization: Bearer <token>
```

### Convites de usuários

```text
POST /users/invite
```

Payload esperado:

```json
{
  "email": "usuario@exemplo.com",
  "role": "teacher",
  "school_id": "id-da-escola"
}
```

### Entidades

O frontend utiliza estes recursos:

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
POST   /entities/<recurso>/bulk
PUT    /entities/<recurso>/:id
DELETE /entities/<recurso>/:id
```

O endpoint `/bulk` recebe um array JSON e é utilizado, por exemplo, para lançamento de várias notas de uma só vez.

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

A aplicação trabalha com:

- Super administrador
- Administrador escolar
- Professor

As permissões são determinadas pelo campo `role` retornado por `/auth/me`.

## Módulos

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

Mantenha todas as chamadas ao backend em `src/api/apiClient.js`. As páginas React não devem depender diretamente de SDKs de fornecedores externos. Assim, o backend pode ser implementado ou substituído sem reescrever a interface inteira.
