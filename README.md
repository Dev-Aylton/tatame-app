# Tatame

PWA de gestão de academia de jiu-jitsu, construída com HTML, CSS e JavaScript puros. A aplicação oferece telas diferentes para Adm, Professor, Instrutor e Alunos, com autenticação e dados reais no Supabase.

## O que o app oferece

- Gestão de academia, perfis, convites, vínculos e alunos.
- Ferramentas de aula delegada e plano semanal para Professor e Instrutor.
- Graduações, conversas e acompanhamento de progresso para alunos.
- Cobranças mensais controladas dentro do app, registro de pagamentos e envio opcional de comprovantes.
- Preferências de conta, tema, ajuda, consentimento e exportação dos dados que a própria conta pode ler.
- Interface responsiva: navegação lateral no computador; quatro atalhos e menu “Mais” na barra inferior do celular.

O app não processa pagamentos, não envia mensagens fora dele e não envia notificações push. Alunos sem conta não são incluídos nas cobranças mensais gravadas no banco real. O texto copiado na tela de cobranças não grava cobrança nem mensagem.

## Perfis

- **Adm:** administra a academia, os perfis, os convites de Professor, os alunos e os papéis disponíveis. Não tem acesso às telas de pagamentos, notas privadas, feedbacks ou metas.
- **Professor:** gerencia alunos vinculados, convites e vínculos, aulas delegadas, graduações, pagamentos, cobranças e conteúdos de treino.
- **Instrutor:** acessa apenas alunos e conteúdos compartilhados pelo Professor; registra o acompanhamento da aula delegada e usa o plano semanal. Não acessa pagamentos, notas privadas, feedbacks ou metas.
- **Aluno adulto:** acessa suas graduações, pagamentos, conversa e progresso, conforme o vínculo e as permissões existentes.
- **Aluno menor:** usa avatar em vez de foto de pessoa; a idade é declarada, não verificada. As telas e dados disponíveis dependem do vínculo e das permissões existentes.

A autorização real é determinada pelo perfil e pelas políticas do banco, não por uma regra de papel fixa no código do cliente. Adm, Professor, Instrutor e Alunos podem ter visões diferentes da mesma informação.

## Fotos e comprovantes

- Fotos de pessoa e da academia aceitam JPG ou PNG de até 5 MiB. Quando não há foto de pessoa visível, o app mostra o avatar escolhido nas Preferências (masculino por padrão); a escolha é guardada no perfil. Quem pode enviar foto de perfil pode solicitar sua remoção após confirmação.
- Fotos de pessoa aparecem quadradas com cantos suavemente arredondados; no painel do usuário permanecem redondas. O corte é centralizado e usa `object-fit: cover`.
- Menor ou pessoa sem idade declarada não envia foto de pessoa. A foto da academia não usa o avatar padrão.
- Visibilidade prevista: Adm vê a própria foto e, como exceção, a do Professor; Aluno adulto e Instrutor veem a própria e a do Professor vinculado; o Professor vê a própria e as fotos de pessoas vinculadas; a foto do Professor fica visível aos vinculados e ao Adm; fotos da academia são visíveis a autenticados.
- Comprovantes aceitam JPG, PNG ou PDF de até 10 MiB. São opcionais e usados no aviso de pagamento; cobranças e confirmações são controladas no app, sem gateway.
- As regras de visibilidade acima são decisões previstas, não garantia de produção. A aplicação das migrations foi informada pelo Aylton; não foi verificada nesta análise. As policies consultam `vinculos`, enquanto convites de Instrutor usam `instrutores_professor`, o que pode impedir acesso às fotos entre Professor e Instrutor. É necessária revisão e confirmação do banco antes de considerar esse acesso efetivo.

## Navegação e privacidade

A navegação tem o mesmo conteúdo e as mesmas permissões nos dois formatos. No computador, a barra lateral fixa reúne as telas por tarefa e mantém o perfil no rodapé. No celular, quatro atalhos frequentes ficam na barra inferior e “Mais” abre as demais telas, sem ocultar recursos.

A política está disponível em [privacidade.html](./privacidade.html) e no modal “Ler política” dentro do app. As apresentações devem permanecer sincronizadas. O texto descreve dados, vínculos, fotos, comprovantes, cobranças, retenção e limites atuais; ainda requer revisão apropriada. Este README não declara conformidade legal.

O front usa a versão `rascunho-1` do termo. A migration `20261111_28_versao_termo.sql` converte esse rótulo para `final-1`; sua aplicação foi informada pelo Aylton, sem verificação nesta análise. Os registros de consentimento são imutáveis; aceites antigos não devem ser reescritos.

## Preview local

O diretório [dev-preview/](./dev-preview/) é ignorado pelo Git e não faz parte da publicação. Ele carrega os arquivos reais do app e substitui somente o cliente Supabase por dados fictícios em memória. Não use dados reais no preview.

No PowerShell, na raiz do repositório, inicie o servidor local:

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8766/dev-preview/`. O cabeçalho de controle fica oculto por padrão; acrescente `?painel=1` para mostrar o seletor e os controles. O perfil é escolhido pelo parâmetro `perfil`:

- `adm`
- `professor`
- `instrutor`
- `aluno-adulto-vinculado`
- `aluno-adulto-sem-vinculo`
- `aluno-menor-vinculado`
- `aluno-menor-sem-vinculo`

Exemplo: `http://127.0.0.1:8766/dev-preview/frame.html?perfil=professor`. O preview não substitui testes com o backend nem comprova permissões de produção.

## Estrutura do repositório

- `index.html`: estrutura e pontos de entrada da aplicação.
- `css/app.css`: estilos e temas claro/escuro.
- `js/app.js`: navegação, renderização e interações do cliente.
- `js/vendor/`: dependências locais de terceiros; não editar sem autorização.
- `assets/`: ícones, marca e avatares locais.
- `dev-preview/`: ferramentas locais de demonstração, fora do controle de versão.
- `supabase/migrations/`: histórico e propostas de estrutura, funções e políticas do banco.
- `tests/`: painel de especificações e plano visual; a conferência de integridade não é teste funcional de ponta a ponta.
- `sw.js` e `manifest.webmanifest`: instalação e cache da PWA.

## Desenvolvimento e publicação

O projeto não tem etapa de build nem usa framework. Rode o app ou o preview em servidor HTTP local; abrir os arquivos diretamente via `file://` não reproduz corretamente os recursos da PWA. O app publicado usa o GitHub Pages e o Supabase para autenticação e dados.

Migrations são arquivos de revisão e só podem ser aplicadas após conferência do desenvolvedor. Não publique código que dependa de coluna ou migration ainda não aplicada. Não inclua segredos, senhas, tokens ou dados reais no repositório. Atualize a versão do app antes de qualquer publicação e confira localmente o conteúdo destinado ao GitHub.

Para a conferência de especificações, abra `tests/teste.html` por um servidor HTTP local. O painel verifica integridade das especificações, não funcionamento de telas, RLS no banco real ou fluxos completos. As alterações do plano ficam registradas na seção final deste README e devem manter o painel `tests/plano.js` sincronizado.

## Plano do projeto

Resumo dos marcos; o acompanhamento detalhado fica na página visual do [plano do projeto](tests/plano.html). Estados: `[ ]` a fazer, `[x]` feito, `[v]` validado.
Contagem atual: **129 itens — 99 validados, 2 feitos e 28 pendentes.**
O plano não cresce a cada tarefa: tarefas viram prompts; só mudam estado com a validação do Aylton.


### MARCO 1 — App completo
Todas as telas e funcionalidades do app funcionando de verdade.
**99 / 104 validados**

- [v] Criar a página visual `tests/plano.html` para acompanhar fases, tarefas e estados junto ao README. **Validada visualmente pelo usuário.**
- [v] Criar a documentação inicial e o painel visual `tests/teste.html` de acompanhamento dos testes. **Painel validado visualmente pelo usuário.**
- [v] Reservar `index.html` na raiz para a aplicação e nomear a página de testes `teste.html`. **Validado pelo usuário.**
- [v] Validar visualmente os painéis de testes e plano. **Usuário aprovou ambos; verificações estruturais do catálogo passaram 5/5. Os casos funcionais continuam pendentes de implementação.**
- [v] Criar o banco de dados Supabase. **Confirmado pelo usuário.** [REAL]
- [v] Criar a primeira suíte de casos de aceite test-first para a F1, com perfis, pré-condições, passos e resultados esperados usando somente fixtures fictícias. **Validado pelo usuário.**
- [v] Acrescentar casos de aceite para validar todas as telas/resoluções, sobreposições, textos/campos fora do lugar e modais. **Validado pelo usuário.**
- [v] Criar e aprovar o ícone Escudo como única marca e a página local de identidade visual. **Validado pelo usuário.** [SIMULADO]
- [v] Exibir somente o ícone Escudo aprovado no cabeçalho do painel de testes. **Implementado e validado visualmente pelo usuário.**
- [v] Aplicar somente o ícone Escudo à identidade da aplicação no cabeçalho web/mobile e na tela de acesso. **Validado pelo usuário.** [SIMULADO]
- [v] Criar dois avatares SVG genéricos (masculino e feminino), com silhuetas definidas e rostos menos arredondados. **Aprovados pelo usuário.** [SIMULADO]
- [v] Ajustar o ícone Escudo: insígnia redonda, “T” redesenhado e faixa preta com ponteira vermelha e três graus brancos. **Correção solicitada aplicada; ícone aprovado pelo usuário.** [SIMULADO]
- [v] Aprimorar navegação, painel da conta e apresentação instalada no iPhone. **Interface ampliada, menus agrupados por assunto, paletas dos dois temas aplicadas e ícones PWA declarados; faltam testes responsivos e validação no iPhone e pelo usuário.** [SIMULADO]
- [ ] Aplicar estados e mensagens acessíveis aos botões de ação. **Padrão reutilizável aplicado aos botões de entrada e saída Google e aos controles reais solicitados neste lote; falta validação pelo usuário.** [PENDENTE]
- [v] Regra do navegador ajustada em `.github/copilot-instructions.md` para conferir a demonstração; sem teste com conta real.
- [v] Validar os dois avatares placeholder. **Aprovados pelo usuário.**
- [v] Exigir testes visuais e funcionais de todas as telas em diferentes tamanhos de viewport a cada lote, incluindo larguras de referência, limites dos breakpoints, retrato/paisagem, altura curta, zoom/texto aumentado, sobreposições, recortes e modais. **Critério obrigatório definido pelo usuário; os testes de cada lote devem registrar e passar por essas verificações.**
- [v] Exigir conformidade com a LGPD e confirmar com o usuário informações e decisões sobre dados pessoais, finalidades, hipóteses legais, consentimento, retenção, compartilhamento, direitos dos titulares e declarações da política antes de implementá-las.
- [v] Acrescentar casos de aceite para o link de privacidade, modal no app, página HTML independente, sincronização do conteúdo e revisão de declarações antes da publicação. **Validado pelo usuário.**
- [v] Confirmar com o usuário os dados pessoais tratados, suas finalidades, hipóteses legais, consentimento, retenção, compartilhamento, atendimento a direitos e conteúdo da política antes de redigi-la. [PENDENTE]
- [v] Criar a página HTML da política e implementar no app o link que abre o modal; manter ambos sincronizados e testar acesso, conteúdo, fechamento, teclado e responsividade. [PENDENTE]
- [v] Ampliar o rascunho de privacidade em `privacidade.html` com seções sobre dados presentes no protótipo, compartilhamento, menores, fotos, exclusão, retenção, direitos e contato. Feito; sem conferência visual; revisão própria (sem revisão jurídica); trâmites jurídicos só ao monetizar. [SIMULADO]
- [v] Sincronizar o rascunho entre `privacidade.html`, o modal e a tela de privacidade do app; texto posteriormente atualizado para refletir o registro real. Feito; sem conferência visual. [SIMULADO]
- [ ] Fazer revisão própria da política (sem revisão jurídica); trâmites jurídicos só ao monetizar. [PENDENTE]
- [v] Atualizar `supabase/schema.sql` para cobrir as migrations 01 a 12, anexando literalmente `_09`, `_10`, `_11` e `_12` com comentários de origem. Feito; sem executar SQL.
- [v] Desenvolver o app em branch separada de `main`; merge na `main` exige autorização do Aylton e testes validados por ele, enquanto commit ou push da branch `feat/telas-iniciais` exige pedido do Aylton, sem exigir testes válidos. Pedido de commit ou push da branch feat/telas-iniciais não é bloqueado por estado de lote, teste ou validação.
- [v] Consultar o usuário quando houver muitos arquivos pendentes sem commit/push, antes de publicar ou iniciar operações de commit, exceto para commit ou push da branch `feat/telas-iniciais` quando o Aylton pedir. **Regra aplicada nesta tarefa: 23 arquivos pendentes foram apresentados ao usuário; ele autorizou prosseguir sem commit/push.**
- [v] Remover do projeto os arquivos, propostas e recursos explicitamente descartados pelo usuário; não arquivar nem manter uma lista de descartes. **Regra definida pelo usuário; confirmar antes de excluir itens cujo descarte não esteja explícito.**
- [v] Manter a tela visual correspondente aberta no navegador do VS Code antes e durante cada alteração visual, atualizando-a para acompanhamento do usuário. **Regra definida pelo usuário.**
- [v] Encerrar cada prompt executado com um resumo de até 10 linhas sobre alterações, verificações, pendências e erros. **Regra definida pelo usuário.**
- [v] Pedir autorização ao usuário quando houver dúvida ou mais de uma interpretação razoável, antes de escolher uma regra de produto ou segurança. **Critério de trabalho definido pelo usuário.**
- [v] Adicionar o perfil de Instrutor: é um aluno com função de apoio, autorizado por aula; vê os alunos da turma apenas por nome e graduação atual, segue o conteúdo decidido pelo Professor e registra se seguiu a orientação. **Requisitos confirmados pelo usuário.** [SIMULADO]
- [v] Confirmar que o Adm será somente o usuário proprietário do projeto; a autorização e as permissões serão aplicadas no banco. **Confirmado pelo usuário.** [SIMULADO]
- [v] Acrescentar casos propostos para o perfil, acesso restrito, confirmação de aula, convite por link e sugestões de temas para o professor. **Validado pelo usuário.**
- [v] Registrar os casos de aceite da F1 real nos itens seguintes; todos validados pelo desenvolvedor.
- [v] Confirmar o destinatário do convite: o professor principal envia o link ao instrutor, que cria a própria conta. **Confirmado pelo usuário.**
- [v] Limites de acesso registrados: Instrutor lê somente nome e faixa/grau atuais dos alunos do Professor; não lê histórico, datas, observações, cobranças, valores, fotos, idade ou consentimentos; não atribui graduação, não cobra, não aprova vínculo, não edita academia e conversa só com o Professor. Adm lê nome e faixa/grau atuais sem foto, somente por função. Aguarda validação do usuário. [REAL]
- [v] Construir um protótipo navegável de todas as telas da F1 do roadmap e dos requisitos confirmados do instrutor (acesso/convites, aluno, professor, Adm, pagamentos, graduações, atalhos e privacidade), mantendo a identidade visual: web otimizada para notebook com sidebar à esquerda e painel do usuário oculto à direita; mobile priorizado para iPhone 13 ou superior com navegação inferior e áreas seguras. Usar fixtures fictícias nesta etapa intermediária; as telas simuladas serão ligadas ao Supabase nos Lotes 1 a 3. Manter termo e política como conteúdo pendente; validar visualmente com o usuário antes da integração dos fluxos reais. No lançamento fictício em dinheiro, foram adicionados busca, confirmação, desfazer e estorno; faltam priorização por cobrança vinculada, testes responsivos e validação do usuário. [SIMULADO]
- [v] Ativar uma única vez por sessão o perfil de Professor convidado após o retorno do Google; reler papel e nome do banco e explicar a recusa sem revelar qual condição falhou. Validado pelo Aylton. [REAL]
- [v] Rascunhar `supabase/migrations/20261109_10_definir_nome_professor.sql` para o Professor ativo definir o próprio nome; migration aplicada no banco após conferência do desenvolvedor.
- [v] Acrescentar ao protótipo a graduação manual de faixa superior pelo Professor, com data, confirmação e histórico; fluxo validado pelo usuário; ainda faltam os testes responsivos. [SIMULADO]
- [v] Ampliar a simulação de graduação para faixas e graus adultos e cadastro inicial, e o painel com versão, diagnósticos, atualização e sincronização simuladas. Implementação presente; validado pelo usuário; faltam testes funcionais/responsivos completos. [SIMULADO]
- [v] Persistir o estado fictício no navegador. **Pagamentos, contas, alunos, vínculos, graduações e conversas com Professor foram implementados, com rollback e mensagens de erro em falha de armazenamento; validado pelo usuário. Arquivos de comprovantes não são armazenados.** [SIMULADO]
- [v] Cadastrar e editar academia fictícia por Adm e Professor vinculado, com telefone, e-mail e foto simulada. **Persistência local e edições existentes; a conferência deste lote não encontrou falha de estado. Ainda faltam testes completos, validação do usuário e decisões sobre autoria e conflitos.** [SIMULADO]
- [v] Criar academia no banco pela conta real de Adm, inserindo nome e URL de foto de fundo opcional e lendo o registro criado; Validado pelo Aylton. [REAL]
- [v] Simular declaração de idade, consentimento e avatar para todos os Alunos (menores e adultos), sem foto de pessoa de Aluno; foto só de Professor e academia, conforme as regras de visibilidade. Adm não recebe modal; Professor recebe apenas consentimento na primeira entrada, salvo na demonstração, sem idade/tutorial ao abrir; Aluno e Instrutor mantêm o fluxo de idade, consentimento e tutorial. O Tutorial continua acessível pelo painel do usuário. Inclui classificação pelo Professor de alunos sem registro. A demonstração permite escolher avatar Masculino ou Feminino como imagem, sem campo de gênero; a escolha não é persistida no modo real. A cópia Google usa avatar local demonstrativo; o limite de arquivo de 5 MB é provisório. Feito; validado pelo usuário e execução de F1-AVATAR-01. [SIMULADO]
- [v] Substituir os avatares de pessoas do protótipo por fotos JPG locais masculino/feminino, quadradas em 512x512, com exibição em object-fit: cover e object-position: center, sem editor de zoom ou centralização; sem novo campo de gênero/estilo. Validado pelo Aylton. [SIMULADO]
- [v] Implementar a exclusão fictícia de conta, apagando dados pessoais e preservando pagamentos, vínculos e graduações da outra parte com identificação anonimizada como Conta excluída. **A demonstração remove dados pessoais e fotos locais, apaga as conversas, preserva registros compartilhados anonimizados e encerra a sessão. A exclusão real não existe; validado pelo usuário; faltam testes funcionais completos.** [SIMULADO]
- [ ] Revisar com o usuário o desenho do Lote 1; só depois criar migrations incrementais, sem executá-las. A aplicação não dependerá delas até o desenvolvedor confirmar que foram revisadas e aplicadas.
- [ ] Após aprovação do desenho e confirmação de que o esquema necessário está aplicado, implementar o primeiro fluxo vertical: login, convite/liberação de professor, cadastro/convite de aluno e consentimento (RN01–RN04, RN25), com seus testes. [SIMULADO]
- [v] Avisos de pagamento e lançamentos fictícios: aluno informa pagamento em dinheiro ou comprovante e o Professor confirma/recusa; sem movimentação financeira. Lançamentos em dinheiro podem ser desfeitos por até 120 segundos e depois estornados. O seletor de comprovante aceita image/* e application/pdf sem capture; a compatibilidade com a galeria do iPhone é hipótese e depende de validação do Aylton no aparelho. Implementado; validado pelo usuário; falta teste funcional completo. [SIMULADO]
- [v] Painel do Professor por mês: mostrar previsto, confirmado, aguardando confirmação, em aberto, atrasado e isento. A carência inicia em 5 dias, é ajustável de 0 a 30 e o atraso é calculado quando hoje ultrapassa vencimento + carência, nunca gravado; validado pelo usuário; falta regressão funcional/responsiva completa. [SIMULADO]
- [v] Lote 2 — Alunos e pagamentos: mensalidade por aluno com valor-base e vencimento de 1 a 28; lotes limitados a 24; estados aberta, paga, isenta ou cancelada; desconto em R$ ou %, isenção opcional e duração de um mês, N meses (incluindo o mês inicial) ou até remoção; cobranças guardam valor-base, desconto e total, e pagamentos parciais só reduzem saldo após confirmação. Implementado na demonstração local, sem gateway; validado pelo usuário; falta regressão funcional/responsiva completa. [SIMULADO]
- [v] Cancelar cobrança aberta: ação exclusiva do Professor e somente para status aberta, com confirmação; bloquear aviso pendente ou pagamento confirmado até rejeição ou estorno; manter no histórico e excluir do painel e de atrasos. Implementado; validado pelo usuário; falta regressão completa. [SIMULADO]
- [v] Corrigir o travamento da demonstração em “Carregando telas do protótipo…”: corrigidos erros de sintaxe no renderizador do Instrutor e o vínculo demonstrativo do aviso de pagamento do Aluno, usando a relação já presente na turma. [SIMULADO]
- [v] Lote 3 — Painel e graduações: na demonstração, o Professor pode enviar ou reenviar ao aluno com conta no app uma cobrança aberta e copiar mensagem com os dados da cobrança; sem conta, o envio fica desativado e a cópia segue disponível. O Aluno vê apenas suas cobranças enviadas, e o Instrutor não vê cobranças nem valores. O histórico manual de graduações já existe (RN12–RN13, RN15–RN16); validado pelo usuário; falta regressão. [SIMULADO]
- [v] Migration 15 (graduações) aplicada e conferida por leitura; não executou SQL nesta tarefa. Aguarda validação do usuário. [REAL]
- [v] Migration 16 (Instrutor de apoio, listas de Instrutor e Adm) aplicada e conferida por leitura; validado pelo usuário. [REAL]
- [v] Graduações reais: Professor atribui e Aluno consulta sua faixa atual e histórico; histórico não é editado. Implementado; validado pelo usuário. [REAL]
- [v] Tela real do Adm lista alunos ativos com nome e faixa/grau atuais, sem foto, por função. Implementado; validado pelo usuário. [REAL]
- [v] Política de privacidade em tom de produto; revisão própria (sem revisão jurídica); trâmites jurídicos só ao monetizar. Feito; validado pelo usuário. A seção “O que ainda está em construção” foi sincronizada entre página e modal.
- [v] Notas privadas redesenhadas na demonstração: texto até 500 caracteres, contador, salvamento local, exclusão confirmada e visibilidade só do Professor. Feito; validado pelo usuário. [SIMULADO]
- [v] Busca por nome e filtros da demonstração funcionais; controles sem ação corrigidos/removidos ou identificados como versão futura. Feito; validado pelo usuário. [SIMULADO]
- [v] Auditoria de design por código (entrada, botões, barra móvel, overflow, alvos de toque, tema claro); sem conferência visual em 360/390/430/768 px. Feito; validado pelo usuário.
- [v] Reserva de altura das mensagens de entrada. Feito; validado pelo usuário.
- [v] Revisão dos textos “Disponível agora” e “Em construção” da tela Conta real. Feito; validado pelo usuário.
- [v] Seções “Como testar no iPhone” e “Em construção” no README. Feito; validado pelo usuário.
- [v] Seção “O que ainda está em construção” na página de privacidade. Feito; validado pelo usuário.
- [v] Ícones 192, 180 e maskable gerados e declarados; sem conferência no iPhone.
- [v] Botões de ação reais: padrão acessível aplicado aos controles solicitados; sem teste com conta real. [REAL]
- [v] Aplicar guard de consentimento por papel às contas reais: Adm sem tela; Professor só consentimento; Instrutor e Aluno idade declarada e consentimento; papel ausente/desconhecido segue o fluxo completo. Guard front-end por papel; gravação do aceite descrita no item seguinte; sem teste com conta real. Validado pelo usuário. [REAL]
- [v] Ligar consentimento a `registrar_consentimento` para Professor no aceite e para Instrutor após consumir o convite. Atualizar os avisos, a página de privacidade e os tutoriais dos papéis afetados. Feito; sem teste com conta real. [REAL]
- [v] Aluno novo: primeiro acesso real coleta nome e idade declarada; o aceite cria o perfil e registra o consentimento por `criar_perfil_aluno`. Feito; sem teste com conta real e sem conferência visual. [REAL]
- [v] `gerar_codigo`: retorno nulo tratado sem remover o código anterior; a mensagem de erro aparece na tela. Feito; sem teste com conta real. [REAL]
- [v] Migration `_12` aplicada e conferida por leitura, sem teste de comportamento. Validado pelo usuário; sem teste de comportamento. [REAL]
- [v] Remover o atraso artificial de 2.500 ms do modal de onboarding no fluxo real. Feito; sem teste com conta real. [REAL]
- [v] Convite de Instrutor: uso único, validade de 3 dias, somente adulto; Aluno vinculado a outro Professor pode aceitar e manter papel de Aluno; conta já Instrutor de outro Professor é recusada. Regra implementada na migration 16; validado pelo usuário. [REAL]
- [v] Ligar ao app o campo para definir o nome do Professor real ativo pela RPC `definir_nome_professor`; validar a entrada, traduzir os retornos e reler o nome do banco após salvar. Validado pelo usuário; ainda falta teste manual. [REAL]
- [v] Convidar Professor pela conta real de Adm, normalizando e-mail, escolhendo academia, listando convites reais e permitindo excluir somente os pendentes; validado pelo usuário; ainda aguardam testes manuais. [REAL]
- [v] Ligar ao banco as telas reais do Adm para editar academias, vincular o Adm a Professor, consultar Professores e Instrutores, trocar Professor e desativar/reativar; validado pelo usuário; ainda aguarda teste manual. [REAL]
- [v] Conectar ao banco os vínculos reais de Aluno e Professor: Aluno ativo envia código e consulta o último pedido; Professor ativo lista, aprova/recusa pedidos, gera e copia o código e administra alunos sem conta com idade declarada. Validado pelo usuário; ainda aguardam testes reais e conferência responsiva. [REAL]
- [v] Vincular o Aluno real pelo código de seis caracteres usando `solicitar_vinculo`; validado pelo usuário; ainda faltam teste manual com conta real e conferência responsiva. [REAL]
- [v] Permitir ao Professor real listar e decidir pedidos de vínculo; validado pelo usuário; ainda faltam testes manuais de aprovação/recusa e conferência responsiva. [REAL]
- [v] Gerenciar alunos sem registro pela conta real do Professor, incluindo idade declarada; validado pelo usuário; ainda faltam testes manuais e conferência responsiva. [REAL]
- [v] Gerar, listar, revogar e aceitar convites reais de Instrutor; validado pelo usuário; ainda faltam testes com contas reais e conferência responsiva. [REAL]
- [v] Cadastro real de Aluno e Instrutor por e-mail e senha. Feito; validado pelo usuário. [REAL]
- [v] Confirmação de e-mail para cadastro real por e-mail e senha. Feito; validado pelo usuário. [REAL]
- [v] Recuperação de senha real por link enviado ao e-mail. Feito; validado pelo usuário. [REAL]
- [v] Definir nova senha real após abrir o link de recuperação. Feito; validado pelo usuário. [REAL]
- [v] Convite real de Instrutor com acesso por e-mail e senha. Feito; validado pelo usuário. [REAL]
- [ ] Implementar e testar o fluxo: Aluno anexa comprovante opcionalmente e Professor confirma o recebimento; Professor lança manualmente quando recebeu em dinheiro ou quando o Aluno não anexou comprovante e ele decide registrar (RN07). [SIMULADO]
- [v] Implementar e testar mural, grade semanal, avisos e perguntas frequentes (RN22–RN24).
- [v] Implementar e testar feedbacks, metas e conversa individual (RN19–RN21). [SIMULADO]
- [v] Notas privadas reais (tabela, RLS só Professor, política de privacidade) — Fase 2.
- [v] Implementar e testar alunos avulsos/diárias e alunos trancados (RN11, RN18). [SIMULADO]
- [v] Implementar e testar configurações, tutorial, ajuda e modo simples (RN26, RN34–RN35). [SIMULADO]
- [v] Implementar e testar painel administrativo, suporte auditado, diagnóstico e avisos globais (RN27–RN32). [SIMULADO]
- [v] Implementar e testar plano semanal, biblioteca/cobertura de temas, sugestões para o Professor e delegação de aula ao Instrutor (RN36–RN42 e requisito adicional). O Professor decide o conteúdo; pode compartilhar o plano ou deixar o treino livre. [SIMULADO]
- [v] Implementar e testar métricas de graduação e recibos (RN14, RN17). [SIMULADO]
- [v] Implementar e testar exportação, backup e consulta offline (RN33). [PENDENTE]
- [v] Registrar a regra de segurança: interromper e consultar o usuário se uma publicação Git aparentar conter dado sensível. **Regra confirmada pelo usuário.**
- [v] Especificar casos de aceite para bloquear publicação Git diante de suspeita de dado sensível. **Validado pelo usuário.**
- [v] copilot-instructions.md com regras de config.js, comandos em loop e navegador. Feito; também inclui regras para perguntas e dúvidas de escopo.
- [v] contato de privacidade preenchido nos 3 textos. Feito; modal e tela do app usam a renderização compartilhada.

### MARCO 2 — Publicar e testar
Publicar o app e executar os testes finais.
**2 / 23 validados**

- [v] Preparar o ícone de instalação do iPhone nos formatos e dimensões exigidos pelo PWA e conferir sua leitura na tela inicial. **Ícones 180/192 e maskable gerados e declarados.**
- [ ] Conferir visualmente a página, o modal e a tela de privacidade em 360, 390, 430 e 768 px, nos temas claro e escuro, sem sobreposições, cortes ou desalinhamentos. [PENDENTE]
- [ ] A partir dos casos validados, mapear fluxos de acesso e permissões; definir somente as tabelas e políticas RLS necessárias e respectivos testes positivos/negativos. [PENDENTE]
- [ ] Configurar e validar login Google real, recuperação de sessão, consulta de perfil e saída. Integração inicial criada; faltam configuração manual, testes reais, conferência responsiva e validação do usuário. [PENDENTE]
- [ ] Investigar e corrigir a rolagem com a roda do mouse em telas largas, sem alterar o layout do celular; ajustado o bloqueio de encadeamento no body para tela larga. Faltam reprodução com roda, confirmação da causa e testes em telas, papéis e modais.
- [ ] Executar testes do Lote 1, corrigir falhas e apresentar o resultado para validação do usuário antes de iniciar o próximo lote.
- [x] Corrigir referências indefinidas nos fluxos reais de pagamento e exportação; renovar o cache do app e incluir recursos offline; ajustar a distribuição da entrada para notebook/tablet, expor a alternância de tema e corrigir a integridade do catálogo de casos. Painel passou 5/5 e a entrada foi conferida no tema claro/escuro no viewport disponível; faltam telas autenticadas, larguras de referência, execução offline e validação do usuário. [PENDENTE]
- [x] Adicionar acesso de demonstração isolado, com prévias de Adm, Professor, Instrutor e Aluno e dados fictícios apenas em memória. Navegação, tema e filtros conferidos; faltam larguras de referência e validação do usuário. Removido no Marco 3; ficou só como histórico.
- [ ] Conferir no painel Supabase o provedor Email, Confirm email e Redirect URLs, inclusive com ?convite_instrutor. [REAL]
- [ ] Testar cadastro e recuperação de senha com conta real. [REAL]
- [ ] F1 real — Acesso: Adm e Professor somente por Google; Aluno e Instrutor por e-mail e senha ou Google; cadastro, confirmação e recuperação por link de e-mail; sair encerra a sessão. [REAL]
- [ ] F1 real — Convite de Instrutor: link de uso único, validade de 3 dias e somente adulto; Aluno vinculado a outro Professor pode aceitar; quem já é Instrutor de outro Professor é recusado. [REAL]
- [ ] F1 real — Vínculo: código de 6 caracteres; 5 erros bloqueiam por 15 minutos; Professor aprova ou recusa. [REAL]
- [ ] F1 real — Consentimento: gravado na versão `rascunho-1`; Adm sem modal; Professor só na primeira vez. [REAL]
- [ ] F1 real — Cobrança: Professor gera e cancela somente cobrança aberta; Aluno vê apenas cobranças enviadas; cobrança isenta não é enviada. [REAL]
- [ ] F1 real — Pagamento: Aluno avisa; Professor confirma, rejeita ou estorna; nenhum pagamento ultrapassa o saldo; registros não são apagados. [REAL]
- [ ] F1 real — Graduação: Professor atribui; Aluno vê as próprias; histórico nunca é editado. [REAL]
- [ ] F1 real — Permissões negativas: Aluno não vê cobrança de outro; Instrutor não vê valores nem histórico; Adm não vê foto. [REAL]
- [v] Conferir no iPhone a barra inferior do Adm (4 itens) e a frase do Disponível agora. [REAL]
- [ ] Fechar a F1: completar as telas, versão/atualização e regressão; validar a fase com o usuário. [SIMULADO]
- [ ] Executar e aprovar os testes de regressão da F1 e F2; validar a fase com o usuário.
- [ ] Executar os testes de publicação segura; suspeita de dado sensível bloqueia a ação até orientação do usuário.
- [ ] Executar a suíte completa: funcionalidades, permissões/RLS, regressão, PWA/offline, responsividade e revisão manual, incluindo a navegação pela demonstração de todos os perfis.

### MARCO 3 — Entrega ao professor
Entregar ao Professor após a validação ponta a ponta.
**0 / 2 validados**

- [ ] Confirmar funcionamento ponta a ponta e obter validação do usuário para todos os lotes.
- [ ] Solicitar autorização explícita antes de qualquer commit ou push; não publicar a partir da `main` enquanto houver teste pendente ou falho, sem aplicar esse bloqueio ao push da branch `feat/telas-iniciais`.

### Atualizações futuras (fora do plano e da barra)
Ideias que não são urgentes ficam aqui, sem entrar na contagem. Ideias urgentes viram prompt direto, sem item novo.
- Nenhuma por enquanto
