# Tatame

PWA de gestão de academia de jiu-jitsu, em desenvolvimento.

## Visão do projeto

Aplicativo web instalável para apoiar a rotina de uma academia de jiu-jitsu: gestão de alunos, pagamentos, graduações, aulas e comunicação. Os perfis incluem Adm, Professor, Instrutor e Aluno. O Instrutor é um aluno com função de apoio, vê uma única turma e só ministra aulas delegadas pelo Professor, que decide o conteúdo. Cada Professor tem uma única turma.

O roadmap do produto é a especificação principal. As imagens de referência de estilo não são requisitos: quando houver divergência, vale o roadmap. A interface usa preto, grafite neutro e dourado no tema escuro; branco e azul no tema claro. O vermelho da marca é um detalhe pequeno, distinto do vermelho de alerta. O app terá experiências de interface próprias para notebook e mobile, mantendo as funcionalidades disponíveis e utilizáveis em toda a faixa de telas.

O estudo inicial de identidade visual fica em [`assets/identidade.html`](assets/identidade.html): o ícone Escudo aprovado, usado sozinho sem nome integrado, e dois avatares SVG (masculino e feminino), também aprovados pelo usuário. O símbolo tem insígnia circular, “T” personalizado e faixa preta com ponteira vermelha e três graus brancos. Os avatares têm silhuetas definidas e rostos angulosos. O ícone foi aplicado ao cabeçalho do painel de testes; será aplicado ao app quando sua interface for criada.

## Princípios e tecnologia

- HTML, CSS e JavaScript puros, sem frameworks ou etapa de build.
- GitHub Pages para hospedagem; o banco Supabase já foi criado. Supabase será usado para autenticação e dados, com políticas RLS por perfil; tabelas e migrations serão definidas e acrescentadas conforme cada lote precisar delas.
- Custo de infraestrutura zero. Não adicionar dependências externas sem autorização.
- O papel e as permissões de cada pessoa vêm do banco de dados, nunca de uma regra confiada ao navegador.
- O sistema não processa transações. O aluno pode registrar pagamento em dinheiro, pendente até confirmação do Professor; o Professor também pode lançar diretamente um recebimento em dinheiro como confirmado. Na demonstração, o comprovante simulado é descartado após a confirmação e ficam o valor e a data de recebimento; no fluxo real, o comprovante guarda só o tipo e o valor, sem imagem, e nenhum pagamento é apagado: apenas muda de estado.
- Os avisos do app ficam dentro dele. O app não envia mensagens fora dele nem usa notificações push.
- Usar apenas dados fictícios nos testes; nunca incluir credenciais, tokens ou dados reais de pessoas no repositório.
- Conformidade com a LGPD é requisito do produto. Antes de definir ou implementar dados pessoais coletados, finalidades, hipóteses legais, consentimento, prazos de retenção, compartilhamento, atendimento aos direitos dos titulares ou conteúdo da política de privacidade, confirmar os fatos e obter aprovação do usuário. Não presumir práticas ou declarações legais, nem afirmar conformidade sem revisão apropriada.
- A política de privacidade deverá estar em uma página HTML própria e ter um link clicável no app que abre um modal para leitura. Manter a página e o modal sincronizados quando houver mudanças; os testes devem verificar o acesso, leitura, fechamento, teclado, responsividade e consistência do conteúdo. A publicação da política depende de conteúdo confirmado pelo usuário.
- Criar migrations sem executá-las. Só podem ser aplicadas após conferência do desenvolvedor; o app não pode depender de uma migration ainda não aplicada.

## Login Google em configuração

O Google usa a biblioteca oficial `@supabase/supabase-js` **2.49.8**, distribuída localmente em `js/vendor/`, obtida de `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.8/` com sua licença. A autenticação real é separada das contas de demonstração e ainda não conecta as telas fictícias ao perfil real. Ao retornar do Google, o app consulta `public.perfis`; se não encontrar perfil, chama `public.ativar_professor()` uma vez por sessão. Quando a função confirma a ativação, o app relê e mostra o papel e o nome do perfil; quando recusa, informa que pode não haver convite pendente para o e-mail Google ou que o e-mail não está confirmado. A função só ativa um Professor com convite e e-mail confirmado; não cria nome. Falhas de consulta não são tratadas como ausência de perfil. A saída Google encerra a sessão neste navegador, separadamente da saída da demonstração.

A migration `20261109_10_definir_nome_professor.sql` define a RPC `public.definir_nome_professor(p_nome text)` e já foi aplicada no banco. Na tela Conta Google, o Professor real ativo vinculado a uma academia pode definir o próprio nome; o app valida a entrada, traduz os códigos de retorno e relê `perfis.nome` após o sucesso. A demonstração continua separada e simulada.

Para configurar e testar manualmente:
1. Copie `js/config.example.js` para criar o arquivo local `js/config.js` e preencha `url` e `publicKey` com os dados do projeto. `js/config.js` é versionado e publicado pelo Pages; contém somente a URL do projeto e a chave publicável, nunca chave secreta; a conferência antes de cada commit é feita pelo Aylton. Use apenas uma chave pública **publishable** ou **anon**; nunca coloque `service_role`, `sb_secret_` ou outro segredo no arquivo, pois a chave fica acessível ao navegador. Não compartilhe tokens ou sessões.
2. No Supabase, habilite o provedor Google e configure **Site URL** com o endereço real do app escolhido para uso principal. Em **Redirect URLs**, autorize a URL completa da página do app no Live Server e a URL completa efetiva do GitHub Pages. Use os endereços e portas realmente usados; o app retorna à origem e ao caminho da página atual, sem URL fixa.
3. No Google Cloud, configure as origens JavaScript autorizadas com as origens reais do Live Server e do Pages, sem caminho. Em URIs de redirecionamento autorizados do cliente OAuth, adicione a URL de callback exibida pelo Supabase para o provedor Google (para este projeto, `https://zpmszmbcgdanokgiznal.supabase.co/auth/v1/callback`). Cadastre o cliente no provedor Google do Supabase sem colocar seus segredos em arquivos do app.
4. Abra pelo Live Server ou HTTPS, não por `file:`. Com configuração aprovada e dados de teste, confira entrada, retorno, sessão, ausência de perfil, falhas e saída. A configuração vazia impede o login real, mas não impede a demonstração. Antes de uso real, revise e aprove as decisões de privacidade e LGPD.

## Fotos e avatar (protótipo)

As fotos, declarações de idade e escolhas de consentimento são somente demonstrativas e ficam em memória durante a sessão: não há Supabase Storage, chamadas de rede para fotos, gravação de arquivo, `localStorage` ou `sessionStorage` para esses dados. Ao fechar ou recarregar a página, a foto temporária é descartada. O app não pede data de nascimento para classificar idade.

No primeiro acesso de demonstração, a pessoa escolhe “Tenho 18 anos ou mais” ou “Sou menor de 18 anos”. Para maiores, o consentimento é recusável; o texto está identificado como provisório e pendente de revisão jurídica. Como nenhuma foto Google é baixada, a aceitação usa um avatar local como cópia simulada; a recusa mantém o avatar padrão. Menores usam somente avatar. Para alunos sem registro, o Professor informa a classificação na ficha ou no cadastro, sem data de nascimento.

Uma pessoa adulta pode escolher uma foto própria, ajustar zoom e enquadramento e salvar a prévia em memória. O arquivo não sai do navegador; o limite provisório é 5 MB. Salvar outra foto substitui a anterior e libera o endereço temporário anterior. O Professor vê fotos de alunos adultos da própria turma; o Adm pode ver fotos de Professores, nunca de alunos. Ao excluir uma conta demonstrativa, a foto temporária é removida; a exclusão real continua em construção.

As conversas entre Aluno/Instrutor e Professor são fictícias e ficam no armazenamento local deste navegador. Não há conversas entre pares não vinculados; ao excluir uma conta demonstrativa, as conversas que a envolvem são removidas.

Para simular falhas nas ações de idade e foto, use `?erro-simulado=perfil-idade`, `perfil-foto-consentimento`, `perfil-foto-selecao`, `perfil-foto-salvar`, `perfil-foto-remover` ou `perfil-idade-aluno` como valor de `erro-simulado`. Os estados de idade, consentimento e foto não persistem, mesmo quando a demonstração está sem falha.

## Padrão de ações pendente

Os botões de entrada, cadastro, vínculo, aluno e pagamentos do Professor usam o padrão de processamento e mensagens. Os fluxos reais de convites, vínculos, academia, gestão de Professores e alunos sem conta também reutilizam `runButtonAction`; falta a validação pelo usuário. Os parâmetros seguintes descrevem falhas da demonstração e não enumeram controles reais pendentes.

Para testar a falha simulada dos dois botões de entrada, abra `index.html?erro-simulado=entrada`; remova o parâmetro para voltar ao resultado normal. Com esse parâmetro nenhum login é iniciado; sem ele, o Google pode realizar autenticação real quando configurado, enquanto a entrada por e-mail permanece simulada.

Para simular falha ao validar um convite de cadastro, abra `index.html?erro-simulado=cadastro`, entre em Cadastro e preencha os campos com dados fictícios.

Para simular falha nas ações da tela de vínculo, use `?erro-simulado=vinculo-consulta`, `?erro-simulado=vinculo-solicitacao` ou `?erro-simulado=vinculo-cancelamento`; `?erro-simulado=vinculo` provoca falha em todas elas. Solicitação e cancelamento exigem os estados fictícios correspondentes.

Para simular falha nas ações do aluno, use `?erro-simulado=aluno-dinheiro`, `?erro-simulado=aluno-comprovante` ou `?erro-simulado=aluno-mensagem`. Para testar falha ao salvar conversa em qualquer papel, use `?erro-simulado=conversa-salvar`. Para enviar comprovante, primeiro selecione um arquivo fictício.

Para simular falhas nas ações de pagamentos do Professor, use `?erro-simulado=professor-pagamento-dinheiro-lancar`, `professor-pagamento-dinheiro-confirmar`, `professor-pagamento-dinheiro-recusar`, `professor-pagamento-comprovante-confirmar`, `professor-pagamento-comprovante-recusar`, `professor-pagamento-pix-confirmar` ou `professor-pagamento-pix-revisar`, sempre como valor de `erro-simulado`.

Para simular falha ao corrigir um lançamento em dinheiro, use `?erro-simulado=professor-pagamento-dinheiro-desfazer` ou `?erro-simulado=professor-pagamento-dinheiro-estornar`. O Professor informa tipo e referência, confirma o lançamento e pode desfazê-lo em até 120 segundos; depois, pode estorná-lo. Os registros de pagamentos fictícios ficam no armazenamento local do navegador; arquivos de comprovantes não são armazenados.

Na demonstração, o Professor configura mensalidade e vencimento de 1 a 28 por aluno e gera no máximo 24 cobranças por lote. Os estados são aberta, paga, isenta e cancelada; só a confirmação do Professor marca como paga. Pode aplicar desconto fixo em reais ou percentual, ou isenção, por um mês, N meses (contando o mês inicial) ou até remover; motivos de isenção são opcionais e não devem conter dados sensíveis. Regras iguais mantêm o mês inicial; para reiniciar a duração, remova e configure a regra novamente. Cobranças já geradas preservam valor-base, desconto e valor final. O aluno pode vincular um aviso em dinheiro ou comprovante a uma cobrança; pagamentos parciais só reduzem o saldo depois da confirmação do Professor. A carência começa em 5 dias e pode ser ajustada por Professor entre 0 e 30. Atrasos são calculados após vencimento + carência, nunca gravados. O painel por mês mostra previsto, confirmado, aguardando confirmação, em aberto, atrasado e isento. Não há gateway nem movimentação de dinheiro. O Instrutor não vê cobranças nem valores. A ação de cancelamento aparece apenas para o Professor e somente em cobranças abertas; com aviso pendente ou pagamento confirmado, primeiro deve rejeitar o aviso ou estornar o pagamento. Canceladas permanecem no histórico do Professor e não entram no painel nem em atrasos.

O Professor envia ou reenvia individualmente uma cobrança aberta na demonstração; só então o Aluno a vê em Meus pagamentos. O registro guarda as datas de envio e reenvio, sem guardar mensagem. Uma cobrança enviada e cancelada deixa de aparecer para o Aluno; se isenta, aparece como isenta. O Professor pode copiar uma mensagem fixa com nome, valor final e vencimento. O app não envia mensagens fora dele.

Para simular falha sem alterar dados ao salvar as regras ou gerar o lote, use `?erro-simulado=professor-cobranca-salvar` ou `?erro-simulado=professor-cobranca-lote`.

Para simular falha ao graduar um aluno da própria turma, use `?erro-simulado=professor-graduacao`. A graduação é manual, exige faixa e/ou grau superiores e data e fica neste navegador. A convenção adulta usada é branca, azul, roxa e marrom com 0 a 4 graus; preta com 0 a 6; coral vermelha e preta no 7º; coral vermelha e branca no 8º; e vermelha no 9º e 10º.

No modo real, o Professor atribui graduações na ficha; Professor e Aluno leem a faixa atual e o histórico. Instrutor e Adm consultam somente nome e faixa/grau atuais conforme suas permissões, sem histórico.

Para simular falha no cadastro inicial de aluno, use `?erro-simulado=professor-cadastro-aluno`. Nome, faixa e grau ficam no navegador; os demais campos são apenas visuais, sem criação de login ou convite.

Na tela Academia, o Adm cadastra ou altera nome, telefone e e-mail fictícios; Professores vinculados podem alterar os mesmos campos. Podem existir vários Professores vinculados à academia, cada um com uma turma. O botão de foto alterna apenas uma representação com iniciais ou ícone, sem selecionar ou armazenar arquivos. Os campos e a foto são escolhas provisórias; autoria de alterações e tratamento de conflitos ainda dependem de decisão. Os dados ficam no navegador, com formato versionado; dados anteriores continuam legíveis. Para testar falhas sem alterar dados, use `?erro-simulado=academia-salvar` ou `?erro-simulado=academia-foto`.

O login e o painel da conta mostram a versão definida em `APP_VERSION` (atualmente `5.14`); atualize essa constante sempre antes de cada push. As próximas versões seguem `5.15`, `5.16` e assim por diante. Sete cliques na versão do painel revelam diagnósticos temporários com categorias e horários de erros, sem mensagens, nomes, arquivos ou dados da conta. Para simular falhas nas ações do painel, use `?erro-simulado=painel-atualizar`, `?erro-simulado=painel-sincronizar` ou `?erro-simulado=painel-excluir`. A exclusão remove apenas dados fictícios locais, mantém registros compartilhados anonimizados e encerra a sessão demonstrativa; exclusão real ainda não existe. A verificação de atualização não baixa arquivos, e a sincronização não envia dados. Uma atualização real requer um mecanismo de distribuição e controle de versão, por exemplo um service worker e uma estratégia de cache.

## Gestão real do Adm

Somente uma sessão Google com perfil Adm ativo usa estas operações reais; a demonstração continua isolada. A tela Academia lê e cria registros e atualiza nome/foto pela RPC `atualizar_academia`, com a versão de edição esperada. A tela Professores e papéis lê Professores e Instrutores permitidos pela policy atual, vincula o Adm por `vincular_adm_professor`, troca Professor por `trocar_professor_academia` e permite desativar/reativar pelos RPCs correspondentes. A troca só oferece Professores inativos da academia com convite aceito (`status = 'ativo'`). Mensagens de erro ao usuário são genéricas; as respostas conhecidas das funções são traduzidas para português. As operações ainda aguardam teste manual e validação do usuário.

A tela Código e convites lê `turmas.codigo` e chama `gerar_codigo()` somente para o Professor real ativo vinculado a uma academia. A tela também lista pedidos pendentes permitidos pelas policies, mostra somente o nome do aluno e permite aprovar ou recusar com confirmação pela RPC `decidir_pedido`. Um Professor real ativo também lista seus alunos sem conta pela policy de `alunos_sem_conta`, cria registros por `criar_aluno_sem_conta` e altera a idade declarada por `atualizar_idade_aluno_sem_conta`; as opções são Adulto e Menor de 18 anos, sem data de nascimento ou foto. A lista usa somente avatar com iniciais. Para a conta real de Aluno ativo, Vincular a um Professor envia o código normalizado pela RPC `solicitar_vinculo` e consulta o último estado permitido em `pedidos_vinculo`. A função não distingue código inválido, vínculo existente e pedido pendente; nesses casos o app informa uma mensagem genérica, sem confirmar se o código existe. Bloqueio por tentativas informa a espera de 15 minutos. A demonstração continua simulada e separada.

Na conta real do Professor, a tela Cobranças mensais também permite selecionar um aluno sem conta, informar valor e vencimento e copiar uma mensagem local; não salva cobrança ou texto. A tela real do Instrutor consulta `listar_alunos_do_instrutor` e exibe somente nome e faixa/grau atuais dos alunos do Professor, sem histórico ou outros dados.

A navegação lateral agrupa as telas disponíveis por assunto e pelo papel da conta ativa; não há troca de visão dentro da sessão. O painel da conta reúne preferências disponíveis, ajuda, ações simuladas do app, diagnósticos desbloqueados e saída. A área de risco é recolhível e aparece separada ao final. Digitar `EXCLUIR` libera a exclusão demonstrativa: os dados pessoais fictícios e a foto temporária da conta são removidos deste navegador, pagamentos/vínculos/graduações compartilhados continuam com a identificação “Conta excluída”, as conversas são removidas e a sessão demonstrativa é encerrada. A conta real não é apagada. O texto é provisório, feito sem revisão jurídica, e não declara conformidade legal.

- **Acesso:** Tenho um código de convite; Entrar como Adm, Professor, Instrutor, Aluno registrado e Aluno sem registro; Ver política e termo, Voltar para entrar; Voltar e Validar convite de instrutor.
- **Aluno:** Ver histórico de graduações, Ver academia; Trocar de professor, Vincular a um professor, Cancelar pedido; Escolher comprovante Pix.
- **Painel do professor:** Cadastrar aluno, Papéis e autorizações, Importar extrato Pix, Confirmar pagamentos, Configurar cobranças mensais e Conversas.
- **Alunos e ficha:** Novo aluno, filtros Todos, Ativos, Trancados e Sem acesso, Abrir ficha; abas Resumo, Pagamentos, Graduações, Feedbacks e Notas privadas.
- **Novo aluno e convite:** Limpar campos e Pré-visualizar convite.
- **Código e convites:** Copiar código, Trocar código, Gerar link, Aprovar e Recusar pedidos de vínculo. Na conta real, Professor ativo lê/gera o código, decide pedidos e administra alunos sem conta; Aluno ativo envia pedido e consulta seu estado. A demonstração permanece simulada.
- **Papéis e autorizações:** Vincular à Academia Fictícia/Academia vinculada, Graduar a Professor, Promover a instrutor/Papel atualizado, Autorizar/Autorizado e Delegar aula.
- **Importar extrato Pix:** seletor Arquivo do extrato Pix.
- **Cobranças mensais:** Salvar regras e gerar cobranças (até 24 por vez); enviar ou reenviar cobrança aberta ao aluno e copiar mensagem.
- **Atrasados e cobrança:** Ver cobranças atrasadas calculadas por vencimento e carência.
- **Ações rápidas:** Novo aluno, Papéis e autorizações, Importar extrato Pix, Confirmar pagamento, Consultar atrasos, Ver alunos e Voltar ao painel.
- **Conversas:** Enviar nas telas do Professor e Instrutor.
- **Adm e Instrutor:** Ver professores convidados, Prévia do convite; Segui e Não segui.
- **Academia, preferências e privacidade:** Publicar grade/Voltar para rascunho; Alternar tema, Buscar versão, Consultar, Abrir ajuda; Continuar e Abrir aviso em modal.
- **Navegação lateral e inferior:** Abrir/Fechar navegação; Entrar, Cadastro por convite, Vincular a um professor, Aguardando liberação, Convite de instrutor, Início, Meu vínculo, Meus pagamentos, Minhas graduações, Conversa com o professor, Painel do professor, Alunos, Ficha do aluno, Novo aluno e convite, Código e convites, Papéis e autorizações, Importar extrato Pix, Pagamentos a confirmar, Cobranças mensais, Atrasados, Ações rápidas, Conversas, Treino compartilhado, Painel do Adm, Professores convidados, Academia, Preferências e Privacidade.
- **Painéis e modais:** Abrir/Fechar painel do usuário, Preferências, Privacidade, Tutorial, Alternar tema e Sair; Termo de consentimento, Fechar modais e Voltar, Pular, Próximo/Concluir no tutorial.

## Estado do real

- **Professor:** cobranças mensais, pagamentos (confirmar, rejeitar, estornar e lançar dinheiro), graduações, seleção de alunos vinculados nas cobranças e graduações e convites de Instrutor.
- **Aluno:** cobranças enviadas pelo Professor, aviso de pagamento, faixa atual e histórico próprios; pode solicitar vínculo pelo código.
- **Instrutor:** lista de alunos do Professor com nome e faixa/grau atuais. O Aluno que também é Instrutor mantém as telas próprias de Aluno.
- **Adm:** gestão de academias, convites e Professores; lista de alunos ativos com nome e faixa/grau atuais, sem foto, por função.

Nada acima foi validado em uso real.

## Como testar no iPhone (app publicado)

1. Abra no Safari o link publicado do GitHub Pages.
2. Toque em Compartilhar e escolha **Adicionar à Tela de Início**.
3. Abra o app pelo ícone e entre com a conta Google de teste autorizada.
4. Teste o cadastro de Aluno ou Instrutor com e-mail e senha de teste.
5. Use **Esqueci a senha** e conclua a recuperação pelo link recebido no e-mail de teste.
6. Confira a barra inferior nas contas de Aluno, Instrutor, Professor e Adm; o Adm deve ter quatro itens.
7. Alterne entre os temas escuro e claro e confira a apresentação.

## O que ainda é em construção no real

- Exclusão real de conta.
- Notas privadas reais.
- Armazenamento de fotos (Storage).
- Conversa real.
- Exportação.
- Tutoriais.

## Acompanhar os testes

Abra [`tests/teste.html`](tests/teste.html) no navegador a partir do VS Code para ver o painel e os casos de aceite separados em [F1](tests/casos-f1.js), [F2](tests/casos-f2.js) e [F3/segurança](tests/casos-f3.js). Acompanhe as etapas e estados na página visual do [plano do projeto](tests/plano.html), disponível também pelo cabeçalho do painel. Os estados dessa página espelham o plano registrado neste README; atualize ambos juntos e confira a distribuição de tarefas após cada mudança. Os casos são especificações test-first: permanecem pendentes até poderem ser executados contra o aplicativo; os casos do instrutor, das sugestões de aula e da política LGPD aguardam revisão quando indicado. A política ainda não foi redigida nem publicada: os detalhes de tratamento precisam ser confirmados primeiro. As verificações do catálogo não contam como aprovação funcional. O `index.html` da raiz fica reservado para a aplicação.

Cada lote deverá trazer seus testes junto com a implementação. A cobertura deve crescer por fase e incluir:

- **Base e interface:** carregamento, navegação, responsividade, estados vazios e mensagens de erro.
- **Acesso e privacidade:** perfis, convites, consentimento e tentativas de acesso não autorizado, incluindo validação das políticas RLS.
- **Alunos e pagamentos:** cadastro e vínculo, cobranças mensais fictícias, descontos/isenções com duração, avisos, confirmação/recusa e pagamentos parciais. O app apenas controla pagamentos; não existe gateway.
- **Graduações e operação:** histórico e permissões, mural, mensagens, feedbacks, aulas, backups e demais funcionalidades da fase correspondente.
- **Experiências por dispositivo:** manter a identidade visual dos projetos; priorizar no mobile a experiência de iPhone 13 ou superior, com navegação inferior e respeito às áreas seguras. Na web, otimizar o mesmo padrão para notebook, com sidebar à esquerda e painel do usuário oculto à direita. Preservar as funcionalidades nos dois layouts.
- **Interface em todos os tamanhos de tela:** em cada lote, testar as experiências próprias de notebook e mobile e todas as telas/fluxos em larguras de referência de 320, 360, 390, 768, 1024, 1280, 1440 e 1920 px, incluindo iPhone 13 (390 × 844 CSS px) e iPhone 13 Pro Max (428 × 926 CSS px), na menor largura suportada e 1 px abaixo/no/acima de cada breakpoint responsivo. Redimensionar continuamente na faixa suportada; repetir em retrato, paisagem, altura curta, áreas seguras do iPhone e com texto aumentado. Procurar sobreposições, componentes cortados ou fora do lugar, textos e campos desalinhados ou truncados, barras fixas que encobrem conteúdo, rolagem inesperada e modais/caixas de diálogo que não cabem ou não podem ser operados; verificar que as funcionalidades permanecem disponíveis nos dois layouts.
- **Qualidade de entrega:** regressão das fases anteriores, uso com dados fictícios, comportamento offline/PWA e conferência manual nos dispositivos e navegadores definidos para o lote.

Não marcar uma verificação como aprovada sem executá-la e conferir o resultado. Para concluir um lote, todos os testes previstos para ele devem passar e o resultado precisa ser conferido pelo usuário.

## Plano do projeto

Resumo dos marcos; o acompanhamento detalhado fica na página visual do [plano do projeto](tests/plano.html). Estados: `[ ]` a fazer, `[x]` feito, `[v]` validado.
Contagem atual: **127 itens — 85 validados, 0 feitos e 42 pendentes.**
O plano não cresce a cada tarefa: tarefas viram prompts; só mudam estado com a validação do Aylton.


### MARCO 1 — App completo
Todas as telas e funcionalidades do app funcionando de verdade.
**85 / 104 validados**

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
- [ ] Aprimorar navegação, painel da conta e apresentação instalada no iPhone. **Interface ampliada, menus agrupados por assunto, paletas dos dois temas aplicadas e ícones PWA declarados; faltam testes responsivos e validação no iPhone e pelo usuário.** [SIMULADO]
- [ ] Aplicar estados e mensagens acessíveis aos botões de ação. **Padrão reutilizável aplicado aos botões de entrada e saída Google e aos controles reais solicitados neste lote; falta validação pelo usuário.** [PENDENTE]
- [v] Regra do navegador ajustada em `.github/copilot-instructions.md` para conferir a demonstração; sem teste com conta real.
- [v] Validar os dois avatares placeholder. **Aprovados pelo usuário.**
- [v] Exigir testes visuais e funcionais de todas as telas em diferentes tamanhos de viewport a cada lote, incluindo larguras de referência, limites dos breakpoints, retrato/paisagem, altura curta, zoom/texto aumentado, sobreposições, recortes e modais. **Critério obrigatório definido pelo usuário; os testes de cada lote devem registrar e passar por essas verificações.**
- [v] Exigir conformidade com a LGPD e confirmar com o usuário informações e decisões sobre dados pessoais, finalidades, hipóteses legais, consentimento, retenção, compartilhamento, direitos dos titulares e declarações da política antes de implementá-las.
- [v] Acrescentar casos de aceite para o link de privacidade, modal no app, página HTML independente, sincronização do conteúdo e revisão de declarações antes da publicação. **Validado pelo usuário.**
- [ ] Confirmar com o usuário os dados pessoais tratados, suas finalidades, hipóteses legais, consentimento, retenção, compartilhamento, atendimento a direitos e conteúdo da política antes de redigi-la. [PENDENTE]
- [ ] Criar a página HTML da política e implementar no app o link que abre o modal; manter ambos sincronizados e testar acesso, conteúdo, fechamento, teclado e responsividade. [PENDENTE]
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
- [ ] Construir um protótipo navegável de todas as telas da F1 do roadmap e dos requisitos confirmados do instrutor (acesso/convites, aluno, professor, Adm, pagamentos, graduações, atalhos e privacidade), mantendo a identidade visual: web otimizada para notebook com sidebar à esquerda e painel do usuário oculto à direita; mobile priorizado para iPhone 13 ou superior com navegação inferior e áreas seguras. Usar fixtures fictícias nesta etapa intermediária; as telas simuladas serão ligadas ao Supabase nos Lotes 1 a 3. Manter termo e política como conteúdo pendente; validar visualmente com o usuário antes da integração dos fluxos reais. No lançamento fictício em dinheiro, foram adicionados busca, confirmação, desfazer e estorno; faltam priorização por cobrança vinculada, testes responsivos e validação do usuário. [SIMULADO]
- [v] Ativar uma única vez por sessão o perfil de Professor convidado após o retorno do Google; reler papel e nome do banco e explicar a recusa sem revelar qual condição falhou. Validado pelo Aylton. [REAL]
- [v] Rascunhar `supabase/migrations/20261109_10_definir_nome_professor.sql` para o Professor ativo definir o próprio nome; migration aplicada no banco após conferência do desenvolvedor.
- [v] Acrescentar ao protótipo a graduação manual de faixa superior pelo Professor, com data, confirmação e histórico; fluxo validado pelo usuário; ainda faltam os testes responsivos. [SIMULADO]
- [v] Ampliar a simulação de graduação para faixas e graus adultos e cadastro inicial, e o painel com versão, diagnósticos, atualização e sincronização simuladas. Implementação presente; validado pelo usuário; faltam testes funcionais/responsivos completos. [SIMULADO]
- [v] Persistir o estado fictício no navegador. **Pagamentos, contas, alunos, vínculos, graduações e conversas com Professor foram implementados, com rollback e mensagens de erro em falha de armazenamento; validado pelo usuário. Arquivos de comprovantes não são armazenados.** [SIMULADO]
- [ ] Cadastrar e editar academia fictícia por Adm e Professor vinculado, com telefone, e-mail e foto simulada. **Persistência local e edições existentes; a conferência deste lote não encontrou falha de estado. Ainda faltam testes completos, validação do usuário e decisões sobre autoria e conflitos.** [SIMULADO]
- [v] Criar academia no banco pela conta real de Adm, inserindo nome e URL de foto de fundo opcional e lendo o registro criado; Validado pelo Aylton. [REAL]
- [v] Simular declaração de idade, consentimento e fotos de perfil, com enquadramento local e permissões por papel. Adm não recebe modal; Professor recebe apenas consentimento na primeira entrada, salvo na demonstração, sem idade/tutorial ao abrir; Aluno e Instrutor mantêm o fluxo de idade, consentimento e tutorial. O Tutorial continua acessível pelo painel do usuário. Inclui classificação pelo Professor de alunos sem registro e restrição de fotos para menores. A demonstração permite escolher avatar Masculino ou Feminino como imagem, sem campo de gênero; a escolha não é persistida no modo real. A cópia Google usa avatar local demonstrativo; o limite de arquivo de 5 MB é provisório. Feito; validado pelo usuário e execução de F1-AVATAR-01. [SIMULADO]
- [v] Substituir os avatares de pessoas do protótipo por fotos JPG locais masculino/feminino, quadradas em 512x512 e com recorte circular centralizado; sem novo campo de gênero/estilo. Validado pelo Aylton. [SIMULADO]
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
- [v] Remover o atraso artificial de 2.500 ms do modal de onboarding no fluxo real, preservando o atraso da demonstração. Feito; sem teste com conta real. [REAL]
- [v] Convite de Instrutor: uso único, validade de 3 dias, somente adulto; Aluno vinculado a outro Professor pode aceitar e manter papel de Aluno; conta já Instrutor de outro Professor é recusada. Regra implementada na migration 16; validado pelo usuário. [REAL]
- [v] Ligar ao app o campo para definir o nome do Professor real ativo pela RPC `definir_nome_professor`; validar a entrada, traduzir os retornos e reler o nome do banco após salvar. Validado pelo usuário; ainda falta teste manual. [REAL]
- [v] Convidar Professor pela conta real de Adm, normalizando e-mail, escolhendo academia, listando convites reais e permitindo excluir somente os pendentes; validado pelo usuário; ainda aguardam testes manuais. [REAL]
- [v] Ligar ao banco as telas reais do Adm para editar academias, vincular o Adm a Professor, consultar Professores e Instrutores, trocar Professor e desativar/reativar; validado pelo usuário; ainda aguarda teste manual. [REAL]
- [v] Conectar ao banco os vínculos reais de Aluno e Professor: Aluno ativo envia código e consulta o último pedido; Professor ativo lista, aprova/recusa pedidos, gera e copia o código e administra alunos sem conta com idade declarada. Manter a demonstração simulada. Validado pelo usuário; ainda aguardam testes reais e conferência responsiva. [REAL]
- [v] Vincular o Aluno real pelo código de seis caracteres usando `solicitar_vinculo`; validado pelo usuário; ainda faltam teste manual com conta real e conferência responsiva. [REAL]
- [v] Permitir ao Professor real listar e decidir pedidos de vínculo; validado pelo usuário; ainda faltam testes manuais de aprovação/recusa e conferência responsiva. [REAL]
- [v] Gerenciar alunos sem registro pela conta real do Professor, incluindo idade declarada; validado pelo usuário; ainda faltam testes manuais e conferência responsiva. [REAL]
- [v] Gerar, listar, revogar e aceitar convites reais de Instrutor, preservando a demonstração simulada; validado pelo usuário; ainda faltam testes com contas reais e conferência responsiva. [REAL]
- [v] Cadastro real de Aluno e Instrutor por e-mail e senha. Feito; validado pelo usuário. [REAL]
- [v] Confirmação de e-mail para cadastro real por e-mail e senha. Feito; validado pelo usuário. [REAL]
- [v] Recuperação de senha real por link enviado ao e-mail. Feito; validado pelo usuário. [REAL]
- [v] Definir nova senha real após abrir o link de recuperação. Feito; validado pelo usuário. [REAL]
- [v] Convite real de Instrutor com acesso por e-mail e senha. Feito; validado pelo usuário. [REAL]
- [ ] Implementar e testar importação de extrato Pix e conciliação com confirmação manual (RN07). [SIMULADO]
- [ ] Implementar e testar mural, grade semanal, avisos e perguntas frequentes (RN22–RN24).
- [ ] Implementar e testar feedbacks, metas e conversa individual (RN19–RN21). [SIMULADO]
- [ ] Notas privadas reais (tabela, RLS só Professor, política de privacidade) — Fase 2.
- [ ] Implementar e testar alunos avulsos/diárias e alunos trancados (RN11, RN18). [SIMULADO]
- [ ] Implementar e testar configurações, tutorial, ajuda e modo simples (RN26, RN34–RN35). [SIMULADO]
- [ ] Implementar e testar painel administrativo, suporte auditado, diagnóstico e avisos globais (RN27–RN32). [SIMULADO]
- [ ] Implementar e testar plano semanal, biblioteca/cobertura de temas, sugestões para o Professor e delegação de aula ao Instrutor (RN36–RN42 e requisito adicional). O Professor decide o conteúdo; pode compartilhar o plano ou deixar o treino livre. [SIMULADO]
- [ ] Implementar e testar métricas de graduação e recibos (RN14, RN17). [SIMULADO]
- [ ] Implementar e testar exportação, backup e consulta offline (RN33). [PENDENTE]
- [v] Registrar a regra de segurança: interromper e consultar o usuário se uma publicação Git aparentar conter dado sensível. **Regra confirmada pelo usuário.**
- [v] Especificar casos de aceite para bloquear publicação Git diante de suspeita de dado sensível. **Validado pelo usuário.**
- [v] copilot-instructions.md com regras de config.js, comandos em loop e navegador. Feito; também inclui regras para perguntas e dúvidas de escopo.
- [v] contato de privacidade preenchido nos 3 textos. Feito; modal e tela do app usam a renderização compartilhada.

### MARCO 2 — Publicar e testar
Publicar o app e executar os testes finais.
**0 / 21 validados**

- [ ] Preparar o ícone de instalação do iPhone nos formatos e dimensões exigidos pelo PWA e conferir sua leitura na tela inicial. **Ícones 180/192 e maskable gerados e declarados; falta conferir no iPhone e validar pelo usuário.** [PENDENTE]
- [ ] Conferir visualmente a página, o modal e a tela de privacidade em 360, 390, 430 e 768 px, nos temas claro e escuro, sem sobreposições, cortes ou desalinhamentos. [PENDENTE]
- [ ] A partir dos casos validados, mapear fluxos de acesso e permissões; definir somente as tabelas e políticas RLS necessárias e respectivos testes positivos/negativos. [PENDENTE]
- [ ] Configurar e validar login Google real, recuperação de sessão, consulta de perfil e saída, mantendo a demonstração separada. Integração inicial criada; faltam configuração manual, testes reais, conferência responsiva e validação do usuário. [PENDENTE]
- [ ] Investigar e corrigir a rolagem com a roda do mouse em telas largas, sem alterar o layout do celular; ajustado o bloqueio de encadeamento no body para tela larga. Faltam reprodução com roda, confirmação da causa e testes em telas, papéis e modais.
- [ ] Executar testes do Lote 1, corrigir falhas e apresentar o resultado para validação do usuário antes de iniciar o próximo lote.
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
- [ ] Conferir no iPhone a barra inferior do Adm (4 itens) e a frase do Disponível agora. [REAL]
- [ ] Fechar a F1: completar as telas, versão/atualização e regressão; validar a fase com o usuário. [SIMULADO]
- [ ] Executar e aprovar os testes de regressão da F1 e F2; validar a fase com o usuário.
- [ ] Executar os testes de publicação segura; suspeita de dado sensível bloqueia a ação até orientação do usuário.
- [ ] Executar a suíte completa: funcionalidades, permissões/RLS, regressão, PWA/offline, responsividade e revisão manual.

### MARCO 3 — Entrega ao professor
Entregar ao Professor após a validação ponta a ponta.
**0 / 2 validados**

- [ ] Confirmar funcionamento ponta a ponta e obter validação do usuário para todos os lotes.
- [ ] Solicitar autorização explícita antes de qualquer commit ou push; não publicar a partir da `main` enquanto houver teste pendente ou falho, sem aplicar esse bloqueio ao push da branch `feat/telas-iniciais`.

### Atualizações futuras (fora do plano e da barra)
Ideias que não são urgentes ficam aqui, sem entrar na contagem. Ideias urgentes viram prompt direto, sem item novo.
- Nenhuma por enquanto
