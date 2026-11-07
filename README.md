# Tatame

PWA de gestão de academia de jiu-jitsu, em desenvolvimento.

## Visão do projeto

Aplicativo web instalável para apoiar a rotina de uma academia de jiu-jitsu: gestão de alunos, pagamentos, graduações, aulas e comunicação. Os perfis incluem Adm, Professor, Instrutor e Aluno. O Instrutor é um aluno com função de apoio, vê uma única turma e só ministra aulas delegadas pelo Professor, que decide o conteúdo. Cada Professor tem uma única turma.

O roadmap do produto é a especificação principal. As imagens de referência de estilo não são requisitos: quando houver divergência, vale o roadmap. A identidade proposta usa grafite, dourado e cartões arredondados. O app terá experiências de interface próprias para notebook e mobile, mantendo as funcionalidades disponíveis e utilizáveis em toda a faixa de telas.

O estudo inicial de identidade visual fica em [`assets/identidade.html`](assets/identidade.html): o ícone Escudo aprovado, usado sozinho sem nome integrado, e dois avatares SVG (masculino e feminino), também aprovados pelo usuário. O símbolo tem insígnia circular, “T” personalizado e faixa preta com ponteira vermelha e três graus brancos. Os avatares têm silhuetas definidas e rostos angulosos. O ícone foi aplicado ao cabeçalho do painel de testes; será aplicado ao app quando sua interface for criada.

## Princípios e tecnologia

- HTML, CSS e JavaScript puros, sem frameworks ou etapa de build.
- GitHub Pages para hospedagem; o banco Supabase já foi criado. Supabase será usado para autenticação e dados, com políticas RLS por perfil; tabelas e migrations serão definidas e acrescentadas conforme cada lote precisar delas.
- Custo de infraestrutura zero. Não adicionar dependências externas sem autorização.
- O papel e as permissões de cada pessoa vêm do banco de dados, nunca de uma regra confiada ao navegador.
- O sistema não processa transações. O aluno pode registrar pagamento em dinheiro, pendente até confirmação do Professor; o Professor também pode lançar diretamente um recebimento em dinheiro como confirmado. Após confirmar, o comprovante é apagado e ficam apenas valor e data de recebimento.
- Todos os avisos e mensagens ficam dentro do app; não existe notificação push.
- Usar apenas dados fictícios nos testes; nunca incluir credenciais, tokens ou dados reais de pessoas no repositório.
- Conformidade com a LGPD é requisito do produto. Antes de definir ou implementar dados pessoais coletados, finalidades, hipóteses legais, consentimento, prazos de retenção, compartilhamento, atendimento aos direitos dos titulares ou conteúdo da política de privacidade, confirmar os fatos e obter aprovação do usuário. Não presumir práticas ou declarações legais, nem afirmar conformidade sem revisão apropriada.
- A política de privacidade deverá estar em uma página HTML própria e ter um link clicável no app que abre um modal para leitura. Manter a página e o modal sincronizados quando houver mudanças; os testes devem verificar o acesso, leitura, fechamento, teclado, responsividade e consistência do conteúdo. A publicação da política depende de conteúdo confirmado pelo usuário.
- Criar migrations sem executá-las. Só podem ser aplicadas após conferência do desenvolvedor; o app não pode depender de uma migration ainda não aplicada.

## Acompanhar os testes

Abra [`tests/teste.html`](tests/teste.html) no navegador a partir do VS Code para ver o painel e os casos de aceite separados em [F1](tests/casos-f1.js), [F2](tests/casos-f2.js) e [F3/segurança](tests/casos-f3.js). Acompanhe as etapas e estados na página visual do [plano do projeto](tests/plano.html), disponível também pelo cabeçalho do painel. Os estados dessa página espelham o plano registrado neste README; atualize ambos juntos e confira a distribuição de tarefas após cada mudança. Os casos são especificações test-first: permanecem pendentes até poderem ser executados contra o aplicativo; os casos do instrutor, das sugestões de aula e da política LGPD aguardam revisão quando indicado. A política ainda não foi redigida nem publicada: os detalhes de tratamento precisam ser confirmados primeiro. As verificações do catálogo não contam como aprovação funcional. O `index.html` da raiz fica reservado para a aplicação.

Cada lote deverá trazer seus testes junto com a implementação. A cobertura deve crescer por fase e incluir:

- **Base e interface:** carregamento, navegação, responsividade, estados vazios e mensagens de erro.
- **Acesso e privacidade:** perfis, convites, consentimento e tentativas de acesso não autorizado, incluindo validação das políticas RLS.
- **Alunos e pagamentos:** cadastro e vínculo, cobranças, descontos, isenções, pagamentos parciais, confirmação/recusa e estados de vencimento.
- **Graduações e operação:** histórico e permissões, mural, mensagens, feedbacks, aulas, backups e demais funcionalidades da fase correspondente.
- **Experiências por dispositivo:** manter a identidade visual dos projetos; priorizar no mobile a experiência de iPhone 13 ou superior, com navegação inferior e respeito às áreas seguras. Na web, otimizar o mesmo padrão para notebook, com sidebar à esquerda e painel do usuário oculto à direita. Preservar as funcionalidades nos dois layouts.
- **Interface em todos os tamanhos de tela:** em cada lote, testar as experiências próprias de notebook e mobile e todas as telas/fluxos em larguras de referência de 320, 360, 390, 768, 1024, 1280, 1440 e 1920 px, incluindo iPhone 13 (390 × 844 CSS px) e iPhone 13 Pro Max (428 × 926 CSS px), na menor largura suportada e 1 px abaixo/no/acima de cada breakpoint responsivo. Redimensionar continuamente na faixa suportada; repetir em retrato, paisagem, altura curta, áreas seguras do iPhone e com texto aumentado. Procurar sobreposições, componentes cortados ou fora do lugar, textos e campos desalinhados ou truncados, barras fixas que encobrem conteúdo, rolagem inesperada e modais/caixas de diálogo que não cabem ou não podem ser operados; verificar que as funcionalidades permanecem disponíveis nos dois layouts.
- **Qualidade de entrega:** regressão das fases anteriores, uso com dados fictícios, comportamento offline/PWA e conferência manual nos dispositivos e navegadores definidos para o lote.

Não marcar uma verificação como aprovada sem executá-la e conferir o resultado. Para concluir um lote, todos os testes previstos para ele devem passar e o resultado precisa ser conferido pelo usuário.

## Plano do projeto

Resumo das fases; o acompanhamento detalhado fica na página visual do [plano do projeto](tests/plano.html). Estados: `[ ]` a fazer, `[x]` feito, `[v]` validado.

### Fundação e Fase 1 — uso diário

- [v] Criar a página visual `tests/plano.html` para acompanhar fases, tarefas e estados junto ao README. **Validada visualmente pelo usuário.**
- [v] Criar a documentação inicial e o painel visual `tests/teste.html` de acompanhamento dos testes. **Painel validado visualmente pelo usuário.**
- [x] Reservar `index.html` na raiz para a aplicação e nomear a página de testes `teste.html`. **Feito nesta tarefa; aguardando validação do usuário.**
- [v] Validar visualmente os painéis de testes e plano. **Usuário aprovou ambos; verificações estruturais do catálogo passaram 5/5. Os casos funcionais continuam pendentes de implementação.**
- [v] Criar o banco de dados Supabase. **Confirmado pelo usuário.**
- [x] Criar a primeira suíte de casos de aceite test-first para a F1, com perfis, pré-condições, passos e resultados esperados usando somente fixtures fictícias. **Feito nesta tarefa; aguardando revisão e validação do usuário.**
- [x] Acrescentar casos de aceite para validar todas as telas/resoluções, sobreposições, textos/campos fora do lugar e modais. **Feito nesta tarefa; aguardando validação do usuário.**
- [v] Criar e aprovar o ícone Escudo como única marca e a página local de identidade visual. **Validado pelo usuário.**
- [v] Exibir somente o ícone Escudo aprovado no cabeçalho do painel de testes. **Implementado e validado visualmente pelo usuário.**
- [x] Aplicar somente o ícone Escudo à identidade da aplicação no cabeçalho web/mobile e na tela de acesso. **Feito nesta tarefa; aguardando validação visual do usuário.**
- [v] Criar dois avatares SVG genéricos (masculino e feminino), com silhuetas definidas e rostos menos arredondados. **Aprovados pelo usuário.**
- [v] Ajustar o ícone Escudo: insígnia redonda, “T” redesenhado e faixa preta com ponteira vermelha e três graus brancos. **Correção solicitada aplicada; ícone aprovado pelo usuário.**
- [ ] Preparar o ícone de instalação do iPhone nos formatos e dimensões exigidos pelo PWA e conferir sua leitura na tela inicial.
- [v] Validar os dois avatares placeholder. **Aprovados pelo usuário.**
- [v] Exigir testes visuais e funcionais de todas as telas em diferentes tamanhos de viewport a cada lote, incluindo larguras de referência, limites dos breakpoints, retrato/paisagem, altura curta, zoom/texto aumentado, sobreposições, recortes e modais. **Critério obrigatório definido pelo usuário; os testes de cada lote devem registrar e passar por essas verificações.**
- [v] Exigir conformidade com a LGPD e confirmar com o usuário informações e decisões sobre dados pessoais, finalidades, hipóteses legais, consentimento, retenção, compartilhamento, direitos dos titulares e declarações da política antes de implementá-las.
- [x] Acrescentar casos de aceite para o link de privacidade, modal no app, página HTML independente, sincronização do conteúdo e revisão de declarações antes da publicação. **Feito nesta tarefa; aguardando revisão/validação do usuário.**
- [ ] Confirmar com o usuário os dados pessoais tratados, suas finalidades, hipóteses legais, consentimento, retenção, compartilhamento, atendimento a direitos e conteúdo da política antes de redigi-la.
- [ ] Criar a página HTML da política e implementar no app o link que abre o modal; manter ambos sincronizados e testar acesso, conteúdo, fechamento, teclado e responsividade.
- [v] Desenvolver o app em branch separada de `main` e fazer merge apenas com autorização explícita; commits e pushes também exigem autorização e testes válidos.
- [v] Consultar o usuário quando houver muitos arquivos pendentes sem commit/push, antes de publicar ou iniciar operações de commit. **Regra aplicada nesta tarefa: 23 arquivos pendentes foram apresentados ao usuário; ele autorizou prosseguir sem commit/push.**
- [v] Remover do projeto os arquivos, propostas e recursos explicitamente descartados pelo usuário; não arquivar nem manter uma lista de descartes. **Regra definida pelo usuário; confirmar antes de excluir itens cujo descarte não esteja explícito.**
- [v] Manter a tela visual correspondente aberta no navegador do VS Code antes e durante cada alteração visual, atualizando-a para acompanhamento do usuário. **Regra definida pelo usuário.**
- [v] Encerrar cada prompt executado com um resumo de até 10 linhas sobre alterações, verificações, pendências e erros. **Regra definida pelo usuário.**
- [v] Pedir autorização ao usuário quando houver dúvida ou mais de uma interpretação razoável, antes de escolher uma regra de produto ou segurança. **Critério de trabalho definido pelo usuário.**
- [v] Adicionar o perfil de Instrutor: é um aluno com função de apoio, autorizado por aula; vê os alunos da turma apenas por nome e graduação atual, segue o conteúdo decidido pelo Professor e registra se seguiu a orientação. **Requisitos confirmados pelo usuário.**
- [v] Confirmar que o Adm será somente o usuário proprietário do projeto; a autorização e as permissões serão aplicadas no banco. **Confirmado pelo usuário.**
- [x] Acrescentar casos propostos para o perfil, acesso restrito, confirmação de aula, convite por link e sugestões de temas para o professor. **Feito nesta tarefa; aguardando revisão do usuário.**
- [ ] Revisar e validar os casos de aceite da F1, incluindo as permissões do instrutor; ajustar o escopo e os critérios antes de desenhar banco ou implementar telas.
- [v] Confirmar o destinatário do convite: o professor principal envia o link ao instrutor, que cria a própria conta. **Confirmado pelo usuário.**
- [ ] Definir no banco as regras de autorização, validade e reutilização do convite de instrutor antes de implementar o cadastro; a atribuição do perfil não será confiada ao navegador.
- [ ] Revisar os limites de leitura dos dados dos alunos necessários durante a aula e confirmar o texto dos casos do instrutor antes de desenhar RLS.
- [ ] A partir dos casos validados, mapear fluxos de acesso e permissões; definir somente as tabelas e políticas RLS necessárias e respectivos testes positivos/negativos.
- [ ] Construir um protótipo navegável de todas as telas da F1 do roadmap e dos requisitos confirmados do instrutor (acesso/convites, aluno, professor, Adm, pagamentos, graduações, atalhos e privacidade), mantendo a identidade visual: web otimizada para notebook com sidebar à esquerda e painel do usuário oculto à direita; mobile priorizado para iPhone 13 ou superior com navegação inferior e áreas seguras. Usar fixtures fictícias, sem integração ou lógica funcional. Manter termo e política como conteúdo pendente; validar visualmente com o usuário antes de iniciar as funções.
- [ ] Revisar com o usuário o desenho do Lote 1; só depois criar migrations incrementais, sem executá-las. A aplicação não dependerá delas até o desenvolvedor confirmar que foram revisadas e aplicadas.
- [ ] Após aprovação do desenho e confirmação de que o esquema necessário está aplicado, implementar o primeiro fluxo vertical: login, convite/liberação de professor, cadastro/convite de aluno e consentimento (RN01–RN04, RN25), com seus testes.
- [ ] Executar testes do Lote 1, corrigir falhas e apresentar o resultado para validação do usuário antes de iniciar o próximo lote.
- [ ] Lote 2 — Alunos e pagamentos: implementar e testar cobranças, descontos/isenções, aviso de pagamento e confirmação pelo professor (RN06, RN08–RN11).
- [ ] Lote 3 — Painel e graduações: implementar e testar painel do professor, pendências, atrasos, cobrança manual por WhatsApp e histórico de graduações (RN12–RN13, RN15–RN16).
- [ ] Fechar a F1: completar as telas, versão/atualização e regressão; validar a fase com o usuário.

### Fase 2 — operação completa

- [ ] Implementar e testar importação de extrato Pix e conciliação com confirmação manual (RN07).
- [ ] Implementar e testar mural, grade semanal, avisos e perguntas frequentes (RN22–RN24).
- [ ] Implementar e testar feedbacks, metas, notas privadas e conversa individual (RN19–RN21).
- [ ] Implementar e testar aniversários, alunos avulsos/diárias e alunos trancados (RN05, RN11, RN18).
- [ ] Implementar e testar configurações, tutorial, ajuda e modo simples (RN26, RN34–RN35).
- [ ] Implementar e testar painel administrativo, suporte auditado, diagnóstico e avisos globais (RN27–RN32).
- [ ] Implementar e testar plano semanal, biblioteca/cobertura de temas, sugestões para o Professor e delegação de aula ao Instrutor (RN36–RN42 e requisito adicional). O Professor decide o conteúdo; pode compartilhar o plano ou deixar o treino livre.
- [ ] Executar e aprovar os testes de regressão da F1 e F2; validar a fase com o usuário.

### Fase 3 — refinamentos e conclusão

- [ ] Implementar e testar métricas de graduação e recibos (RN14, RN17).
- [ ] Implementar e testar exportação, backup e consulta offline (RN33).
- [x] Registrar a regra de segurança: interromper e consultar o usuário se uma publicação Git aparentar conter dado sensível. **Regra confirmada pelo usuário.**
- [x] Especificar casos de aceite para bloquear publicação Git diante de suspeita de dado sensível. **Feito nesta tarefa; aguardando validação do usuário.**
- [ ] Executar os testes de publicação segura; suspeita de dado sensível bloqueia a ação até orientação do usuário.
- [ ] Executar a suíte completa: funcionalidades, permissões/RLS, regressão, PWA/offline, responsividade e revisão manual.
- [ ] Confirmar funcionamento ponta a ponta e obter validação do usuário para todos os lotes.
- [ ] Solicitar autorização explícita antes de qualquer commit ou push; não publicar enquanto houver teste pendente ou falho.
