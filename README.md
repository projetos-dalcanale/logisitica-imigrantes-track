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

**Tabela de fretes**
- Guia "Fretes" com uma ficha por cliente: Frete Peso, Pedágio, Ad-Valorem, Escolta, Adc. Margem, Ajudante, Adc. IMO, Adc. LS, Outros, Gris e responsável pelo seguro, mais observações e peculiaridades.
- Campos que o cliente não tem podem ser removidos, e campos personalizados (0,00 ou 0,00000) podem ser adicionados.
- Consulta com busca por cliente (também no Ctrl+K); compartilhada com toda a equipe.

**Cadastros compartilhados**
- Terminal de Carregamento, Terminal de Vazio, Armador e Tipo de Contêiner: listas únicas usadas por toda a equipe, com adicionar, editar (renomear) e excluir.

**Produtividade**
- Busca rápida por armador, motorista, placa, documento/booking ou número de contêiner.
- Resumo com contadores (em andamento, prazo próximo, atrasados) por aba.
- Alerta visual de Deadline Draft (3, 2, 1 dia ou atrasado) para exportação.
- Reordenação dos cards por arrastar (preferência pessoal, salva no navegador de cada usuário).
- Modo escuro opcional (preferência salva por navegador).
- Busca rápida com Ctrl+K e atalhos de teclado (N novo processo, / filtrar, 1/2/3 abas).
- Navegação inferior no celular e telas em tela cheia, como um app.

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
- **Radix UI** + **cmdk** — janelas, seleções com busca, dicas e busca rápida (Ctrl+K), acessíveis por teclado.
- **Motion** — animações.
- **Lucide** — ícones.
- **react-day-picker** — calendário de data e hora.
- **vaul** — folhas deslizantes (arrastar para fechar) no celular.
- **Vitest** — testes automáticos das regras de negócio.
- **GitHub Actions** — verificação antes de cada merge e backup diário do Firestore.
- **Vercel** — hospedagem e deploy contínuo a partir deste repositório.

## Estrutura do projeto

```
├── index.html               # Página base (o React monta o app em #root)
├── vite.config.js           # Configuração do Vite, Tailwind e PWA
├── vercel.json              # Como a Vercel faz o build (npm run build → dist/)
├── firestore_1.rules        # Regras de segurança do Firestore (aplicar no Firebase Console)
├── public/icons/            # Ícones do app
├── scripts/                 # Backup e restauração do Firestore
├── .github/workflows/       # Verificação (CI) e backup diário
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

Requer [Node.js](https://nodejs.org/) 24, a mesma versão do GitHub e da Vercel (definida no `.nvmrc` e em `engines` no `package.json`).

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

## Testes e verificação

```bash
npm test         # testes automáticos (regras de processo, prazos, ISO 6346, números)
npm run check    # lint + testes + build, o mesmo que o GitHub roda
```

Todo Pull Request e todo push no `main` e no `teste` rodam a verificação **Lint, testes e build** (`.github/workflows/ci.yml`). O `main` está protegido: só aceita merge com a verificação aprovada.

### Testes de tela

Abrem o app num navegador de verdade (Chromium, via Playwright), ligado ao emulador do Firebase com dados fictícios; nada toca a produção. Ficam em `e2e/` e também rodam no GitHub.

Para rodar na sua máquina, precisa do [Java](https://adoptium.net/) 21 ou superior (o emulador usa) e, só na primeira vez, baixar o navegador:

```bash
npx playwright install chromium
npm run e2e      # sobe os emuladores, roda os testes e desliga tudo
```

Se algum falhar, o relatório fica em `playwright-report/`.

### Atualização das dependências

O Dependabot (`.github/dependabot.yml`) abre PRs toda segunda com as versões novas: as pequenas juntas num PR só, as principais (que podem quebrar algo) separadas. O CI testa cada um; o merge é manual.

## Endereço de teste fixo

A branch `teste` tem um endereço permanente na Vercel:

https://logisitica-imigrantes-track-git-teste-imigrantes.vercel.app

Para testar uma mudança antes da produção, envie-a para a branch `teste`. Esse endereço fica liberado de vez na chave do Firebase, então não é preciso liberar um endereço novo a cada mudança. Depois de aprovada, abra o Pull Request para o `main`.

## Backup do Firestore

O workflow **Backup do Firestore** (`.github/workflows/backup.yml`) exporta todas as coleções (processos, fretes e cadastros) todo dia às 03:00, criptografa o arquivo com AES-256 e o guarda por 90 dias na aba **Actions** do GitHub. Também dá para rodar na hora: Actions → Backup do Firestore → Run workflow.

**Configuração (uma vez só):**

1. Firebase Console → ⚙️ Configurações do projeto → **Contas de serviço** → **Gerar nova chave privada**. Baixa um arquivo `.json`.
2. GitHub → Settings → Secrets and variables → **Actions** → New repository secret:
   - `FIREBASE_SERVICE_ACCOUNT`: cole o conteúdo inteiro do arquivo `.json`.
   - `BACKUP_PASSWORD`: uma senha forte. **Guarde-a**: sem ela o backup não abre.
3. Apague o arquivo `.json` do computador depois de cadastrar os segredos.

**Para restaurar:** baixe o arquivo `.json.enc` da execução desejada na aba Actions e siga as instruções no início de `scripts/restaurar-backup.mjs`.

Os scripts de `scripts/` (backup, restauração, ensaio e alerta) têm `package.json` e lockfile próprios, só com o `firebase-admin`, para instalar rápido e sempre na mesma versão. Antes de rodá-los na sua máquina, instale uma vez:

```bash
npm ci --prefix scripts
```

## Segurança

- A chave de API do Firebase presente no código é, por natureza, pública — a proteção real está nas **regras do Firestore** (`firestore_1.rules`) e na **restrição da chave por domínio** no Google Cloud Console. Ainda assim, recomenda-se manter este repositório **privado**.
- O React escapa automaticamente todo texto exibido na tela; o único HTML montado manualmente (PDF) escapa os valores digitados, evitando XSS.
- O login não tem autocadastro: contas só existem se forem criadas manualmente no Firebase Console.

---

Projeto de uso interno da Transportes Imigrantes, desenvolvido por Matheus Fagundes.
