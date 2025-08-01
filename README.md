# Sistema de Gerenciamento de Estoque - Secretaria de Educação

Sistema completo para gerenciamento de estoque de materiais escolares, desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Funcionalidades s

- **Autenticação e Autorização**: Sistema de login com diferentes níveis de acesso
- **Gestão de Materiais**: Cadastro e controle de estoque de materiais
- **Solicitações**: Sistema de pedidos com aprovação e despacho
- **Fornecedores**: Cadastro e gestão de fornecedores
- **Relatórios**: Geração de relatórios em PDF
- **Dashboard**: Visão geral com estatísticas importantes

## 🛠️ Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Roteamento**: React Router DOM
- **Ícones**: Lucide React
- **PDF**: jsPDF + jsPDF-AutoTable
- **Deploy**: Netlify

## 📋 Pré-requisitos

- Node.js 18+
- Conta no Supabase
- Conta no Netlify (para deploy)

## 🔧 Configuração Local

1. **Clone o repositório**
```bash
git clone <repository-url>
cd inventory-management-system
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

4. **Configure o banco de dados**

Execute as migrações no Supabase:
- Acesse o painel do Supabase
- Vá para SQL Editor
- Execute o conteúdo do arquivo `supabase/migrations/20250107000000_initial_schema.sql`
- Execute o conteúdo do arquivo `supabase/migrations/20250107000001_demo_users.sql`

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

## 🚀 Deploy no Netlify

1. **Conecte seu repositório ao Netlify**
   - Faça login no Netlify
   - Clique em "New site from Git"
   - Conecte seu repositório GitHub/GitLab

2. **Configure as variáveis de ambiente no Netlify**
   - Vá para Site settings > Environment variables
   - Adicione as mesmas variáveis do arquivo `.env`

3. **Configure o build**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - O arquivo `netlify.toml` já está configurado

4. **Deploy**
   - O deploy será automático após o push para a branch principal

## 📊 Estrutura do Banco de Dados

### Principais Tabelas

- **users**: Perfis dos usuários (ligados ao auth.users do Supabase)
- **materials**: Materiais do estoque
- **suppliers**: Fornecedores
- **requests**: Solicitações de materiais
- **request_items**: Itens das solicitações
- **stock_entries**: Entradas de estoque
- **stock_movements**: Movimentações de estoque
- **user_sessions**: Sessões customizadas (se necessário)

### Views

- **stock_status**: Status atual do estoque
- **request_summary**: Resumo das solicitações

## 🔐 Segurança

- **Row Level Security (RLS)**: Habilitado em todas as tabelas
- **Políticas de Acesso**: Configuradas por perfil de usuário
- **Autenticação**: Gerenciada pelo Supabase Auth
- **Sessões**: Controle automático de sessões

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🎨 Design

- Design moderno e limpo
- Componentes reutilizáveis
- Feedback visual para ações do usuário
- Tema consistente com a identidade da Secretaria de Educação

## 🔄 Funcionalidades por Perfil

### Administrador
- Acesso completo ao sistema
- Gestão de usuários
- Relatórios completos
- Configurações do sistema

### Despachante
- Gestão de materiais e fornecedores
- Aprovação e despacho de solicitações
- Entradas de estoque
- Relatórios operacionais

### Solicitante
- Criação de solicitações
- Acompanhamento de pedidos
- Dashboard personalizado

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com Supabase**
   - Verifique as variáveis de ambiente
   - Confirme se o projeto Supabase está ativo

2. **Erro de autenticação**
   - Verifique se as políticas RLS estão configuradas
   - Confirme se os usuários foram criados corretamente

3. **Erro de build**
   - Execute `npm run build` localmente para testar
   - Verifique se todas as dependências estão instaladas

## 📞 Suporte

Para suporte técnico, entre em contato com a equipe de desenvolvimento.

## 📄 Licença

Este projeto é propriedade da Secretaria de Educação.