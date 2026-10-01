# LogiTrack Pro

Sistema web para controle de processos logísticos de importação e exportação, desenvolvido sob medida para a **Transportes Imigrantes**.

Substitui o controle manual (planilhas/e-mail) por um painel único, em tempo real, compartilhado por toda a equipe.

🔗 **Em produção:** https://logisitica-imigrantes-track.vercel.app/

---

## Sobre o projeto

O LogiTrack Pro organiza cada processo de importação ou exportação em um card, com um checklist específico para cada tipo de operação, prazos visuais e cadastros compartilhados (terminais, armadores, tipos de contêiner) usados por toda a equipe.

É um projeto **frontend** (sem servidor próprio): todo o backend é o Firebase (autenticação e banco de dados em tempo real), e o site é publicado na Vercel.

## Funcionalidades

**Processos**
- Cadastro de processos de Importação (checklist: Agendamento de Carregamento → Gerar CTe → Gerar CIOT → Gerar MDFE → Encerrar MDFE → Agendamento de Vazio) e de Exportação (Tara/Lacre, Deadline Draft, Deadline de Carga, agendamentos de vazio e cheio).
- Barra de progresso automática por processo, calculada a partir do checklist.
- Múltiplos contêineres por processo, adicionados na criação ou depois, a qualquer momento.
- Verificação de duplicidade: avisa quando um número de contêiner, documento (DI/DTA/DUIMP) ou booking já existe em outro processo ativo.
- Validação do dígito verificador da numeração do contêiner (norma ISO 6346), com aviso em tempo real.
- Observações livres por processo, arquivamento/restauração e exclusão (com confirmação).

**Cadastros compartilhados**
- Terminal de Carregamento, Terminal de Vazio, Armador e Tipo de Contêiner: listas únicas usadas por toda a equipe, com adicionar, editar (renomear) e excluir.

**Produtividade**
- Busca rápida por armador, motorista, placa, documento/booking ou número de contêiner.
- Resumo com contadores (em andamento, prazo próximo, atrasados) por aba.
- Alerta visual de Deadline Draft (3, 2, 1 dia ou atrasado) para exportação.
- Reordenação dos cards por arrastar (preferência pessoal, salva no navegador de cada usuário).
- Modo escuro opcional (preferência salva por navegador).

**Exportação de dados**
- Exportação de um processo individual em PDF (via impressão do navegador).
- Exportação em lote (CSV) da lista atualmente filtrada, pronta para abrir no Excel ou Planilhas Google.

**Outros**
- Progressive Web App (PWA): instalável no computador ou celular.
- Totalmente responsivo (desktop e celular).
- Login restrito: sem autocadastro, só entra quem já tem conta criada manualmente no Firebase.

## Tecnologias

- **React 19** + **Vite** — interface em componentes, com build otimizado.
- **Tailwind CSS v4** — estilização.
- **Firebase Authentication** — login por e-mail/senha.
- **Firebase Firestore** — banco de dados em tempo real.
- **dnd-kit** — arrastar e reordenar os cards.
- **vite-plugin-pwa** — gera o service worker e o manifest do PWA.
- **Font Awesome 6** — ícones.
- **Vercel** — hospedagem e deploy contínuo a partir deste repositório.

## Estrutura do projeto

```
├── index.html               # Página base (o React monta o app em #root)
├── vite.config.js           # Configuração do Vite, Tailwind e PWA
├── vercel.json              # Como a Vercel faz o build (npm run build → dist/)
├── firestore_1.rules        # Regras de segurança do Firestore (aplicar no Firebase Console)
├── public/icons/            # Ícones do app
└── src/
    ├── main.jsx             # Ponto de entrada
    ├── App.jsx              # Login x tela principal
    ├── index.css            # Paleta (tema claro/escuro) e estilos globais
    ├── lib/                 # Firebase, regras de negócio, gravações, PDF/CSV
    ├── contexts/            # Autenticação, cadastros compartilhados, toasts
    ├── hooks/               # Processos em tempo real, tema, ordem dos cards
    └── components/          # Telas e componentes (cards, modal, formulário...)
```

## Configuração e execução local

Requer [Node.js](https://nodejs.org/) 20 ou superior.

```bash
npm install      # instala as dependências (só na primeira vez)
npm run dev      # abre em http://localhost:5173
npm run build    # gera a versão de produção em dist/
```

Para o login funcionar localmente, `http://localhost:5173/*` precisa estar nos referenciadores HTTP permitidos da chave de API do Firebase (Google Cloud Console → APIs e serviços → Credenciais → Browser key).

No Firebase Console:
1. **Authentication** (e-mail/senha) e **Firestore Database** ativados.
2. Regras do arquivo `firestore_1.rules` publicadas em **Firestore Database → Regras**.
3. Contas de usuário criadas manualmente em **Authentication → Users** — não existe tela de autocadastro, por design.

## Deploy

A Vercel está conectada a este repositório: qualquer `push` para a branch principal publica a nova versão em produção, e outras branches geram um endereço de teste (preview). O `vercel.json` informa o build (`npm run build`, saída em `dist/`).

## Segurança

- A chave de API do Firebase presente no código é, por natureza, pública — a proteção real está nas **regras do Firestore** (`firestore_1.rules`) e na **restrição da chave por domínio** no Google Cloud Console. Ainda assim, recomenda-se manter este repositório **privado**.
- O React escapa automaticamente todo texto exibido na tela; o único HTML montado manualmente (PDF) escapa os valores digitados, evitando XSS.
- O login não tem autocadastro: contas só existem se forem criadas manualmente no Firebase Console.

---

Projeto de uso interno da Transportes Imigrantes, desenvolvido por Matheus Fagundes.
