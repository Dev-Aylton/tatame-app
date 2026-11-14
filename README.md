# Tatame

Aplicação web instalável para academias de Jiu-Jitsu organizarem aulas, vínculos, graduações e pagamentos de alunos.

**Repositório:** [URL do repositório]
**Demonstração:** [URL da demonstração]

![Painel administrativo](docs/img/painel-administrativo.png)

## Funcionalidades implementadas

### Adm
- Consultar indicadores de academias, Professores, alunos e convites.
- Cadastrar e editar academias, enviar foto e montar a grade semanal com Professores ativos.
- Convidar Professores e administrar perfis e papéis disponíveis.

### Professor
- Gerenciar alunos, vínculos e convites.
- Criar cobranças e acompanhar pagamentos; revisar comprovantes e registrar decisões manualmente.
- Ler localmente o valor de comprovantes para apoiar a conferência.
- Registrar graduações, conversar com alunos, publicar conteúdos de treino e organizar plano semanal.
- Delegar uma aula e compartilhar seu conteúdo com um Instrutor.

![Gestão de aulas e grade semanal](docs/img/grade-semanal.png)

### Instrutor
- Consultar aulas delegadas e o conteúdo compartilhado pelo Professor.
- Consultar alunos vinculados com acesso limitado a nome e graduação atual.
- Registrar se seguiu a orientação da aula e usar a conversa com o Professor.

### Aluno
- Solicitar vínculo com um Professor e consultar cobranças enviadas.
- Avisar pagamentos e anexar comprovantes.
- Consultar graduações, conversar com o Professor, acessar conteúdos de treino e acompanhar feedbacks e metas.

O app registra informações de cobrança e pagamento, mas não processa transações financeiras.

## Stack

- **HTML:** estrutura semântica e páginas estáticas.
- **CSS:** layout responsivo e temas claro e escuro.
- **JavaScript puro:** interações e fluxos do app, sem framework ou etapa de build.
- **PWA:** manifest para instalação e service worker para cache de arquivos estáticos.
- **Supabase:** autenticação, banco PostgreSQL, políticas RLS e armazenamento de arquivos.

## Arquitetura e segurança

- O papel e o vínculo do perfil são lidos do banco; a interface adapta a navegação ao perfil.
- O Supabase aplica permissões por RLS e funções SQL. A interface não substitui essas verificações.
- A configuração do cliente usa `url` e `publicKey` em `js/config.js`. Não use chaves secretas ou `service_role` no cliente.
- O parser de comprovantes usa arquivos locais de PDF.js e Tesseract.js no navegador. A leitura de imagens e PDFs não é enviada a um serviço externo de OCR; o Professor confere o comprovante e decide manualmente.
- As alterações do banco são organizadas em migrations SQL em `supabase/migrations/`; não há migração automática durante a execução do app.

![Leitura local de comprovante](docs/img/leitura-comprovante.gif)

## Decisões técnicas

- A implementação estática permite hospedar a aplicação sem servidor próprio ou etapa de compilação.
- A autenticação e a autorização dos dados ficam no Supabase, com regras por perfil no banco.
- O service worker armazena arquivos estáticos; operações que dependem do Supabase ainda precisam de conexão.
- O OCR roda no navegador com dependências locais para não enviar comprovantes a um serviço externo.

## Como rodar localmente

1. Configure `js/config.js` conforme o formato de `js/config.example.js`, usando a URL e a chave publicável do seu ambiente Supabase. Os valores não são incluídos neste README.
2. Na raiz do projeto, inicie um servidor HTTP local:

   ```powershell
   python -m http.server 8766 --bind 127.0.0.1
   ```

3. Abra `http://127.0.0.1:8766/`.

O app não lê variáveis de ambiente no navegador. A autenticação e os dados dependem de um projeto Supabase configurado e das migrations correspondentes aplicadas.

## Estrutura do repositório

- `index.html`: entrada e estrutura da aplicação.
- `css/`: estilos e temas.
- `js/`: lógica do app, exportação, suporte offline e configuração.
- `js/vendor/`: dependências locais de terceiros.
- `assets/`: ícones, avatares e imagens.
- `supabase/migrations/`: estrutura do banco, funções e políticas.
- `tests/`: casos de aceite e painéis de acompanhamento.
- `sw.js` e `manifest.webmanifest`: recursos da PWA.

## Testes

- `tests/teste.html` apresenta o catálogo de casos de aceite das fases F1, F2 e F3.
- O painel verifica a estrutura e a cobertura do catálogo; não executa os fluxos do app nem comprova o comportamento do Supabase ou das políticas RLS.
- Os cenários funcionais ainda precisam ser executados em ambiente de teste.

## Roadmap

- [ ] Executar os fluxos de autenticação, cadastro, recuperação de sessão e convites em ambiente Supabase de teste.
- [ ] Validar permissões RLS em cenários autorizados e negados.
- [ ] Completar a conferência responsiva em 360, 390, 430 e 768 px, nos temas claro e escuro.
- [ ] Executar regressão ponta a ponta e validar instalação e comportamento offline da PWA.

## Autor e contato

- **Autor:** [Nome do autor]
- **Contato:** [Contato profissional]
