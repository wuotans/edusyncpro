# AGENTS.md

## Project Context

EduSync Pro é uma aplicação web de gestão escolar baseada em React e Vite. O frontend deve permanecer desacoplado de fornecedores específicos e consumir o backend exclusivamente pela camada REST centralizada em `src/api/apiClient.js`.

Comece pelo `README.md` para configuração local, variáveis de ambiente e contrato esperado da API.

## Key Files

- `src/`: código-fonte do frontend.
- `src/api/apiClient.js`: cliente HTTP e contrato de acesso ao backend.
- `vite.config.js`: configuração do Vite.
- `.env.local`: variáveis locais; nunca versionar segredos.

## Working Notes

- Use `npm install` para instalar as dependências.
- Use `npm run dev` para desenvolvimento local.
- Use `npm run build` para validar o build de produção.
- Mantenha chamadas HTTP centralizadas em `src/api/apiClient.js`.
- Novos recursos de backend devem usar endpoints REST configuráveis por `VITE_API_URL`.
- Preserve a separação de perfis entre super administrador, administrador escolar e professor.
- Execute os checks relevantes definidos em `package.json` antes de finalizar alterações.
