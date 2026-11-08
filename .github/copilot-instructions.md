# Regras do projeto Tatame (Copilot)

Projeto: PWA de gestão de academia de jiu-jitsu (nome Tatame). Interface e commits em português do Brasil.

## Stack e custo
- HTML, CSS e JavaScript puros, sem frameworks e sem etapa de build.
- Hospedagem no GitHub Pages; login e banco no Supabase com RLS por perfil. O papel do usuário fica no banco, nunca no código.
- Nada que gere custo. Bibliotecas externas só com autorização, copiadas para js/vendor/ (não alterar js/vendor/).
- Node não existe nesta máquina; não instalar nada.

## Segurança e privacidade
- Nunca colocar chaves secretas, tokens ou senhas no repositório.
- Nunca usar dados reais de pessoas nem valores reais em arquivos, testes ou commits.
- Tratar conformidade com a LGPD como requisito do produto. Antes de decidir ou implementar coleta/uso de dados pessoais, finalidade, hipótese legal, consentimento, retenção, compartilhamento, direitos do titular ou texto da política, confirmar as informações e obter aprovação do usuário; não declarar conformidade legal sem revisão e validação apropriadas.
- A política de privacidade deverá existir em página HTML própria e ser acessível por link no app que abre um modal legível e acessível. Manter as duas apresentações atualizadas em conjunto e cobrir a navegação/modal nos testes responsivos.
- Migrations: criar o arquivo sem rodar; só rodam depois de conferidas pelo desenvolvedor.
- Não subir código do app que dependa de coluna ou migration ainda não rodada.

## Fluxo de trabalho
- Trabalhar em modo manual. Sem Playwright e sem subagentes.
- Um lote por vez; ao final de cada prompt executado, enviar um resumo de até 10 linhas com alterações, verificações, pendências e qualquer erro ou item que não foi possível concluir.
- Ao terminar, fechar as abas do navegador, servidores e shells que abriu.
- Commits curtos em português, sem Co-authored-by. Push normal, nunca --force.
- Quando a implementação do app começar, trabalhar em branch separada de `main`. Só fazer merge para `main` com autorização explícita do Aylton e testes validados por ele. Commit e push da branch `feat/telas-iniciais` exigem pedido explícito do Aylton; se houver muitos arquivos pendentes sem commit/push, consultar o usuário antes de prosseguir, exceto para commit ou push dessa branch quando ele pedir.
- Antes de alterar a interface ou qualquer conteúdo visual, abrir a tela correspondente no navegador integrado ao VS Code e mantê-la aberta durante a edição; atualizar a página após cada conjunto coerente de mudanças para que o usuário acompanhe visualmente. Se não for possível abrir ou manter a tela disponível, informar e pedir orientação antes de prosseguir com a alteração visual.
- Quando o usuário descartar ou rejeitar explicitamente um arquivo, proposta ou recurso, removê-lo do projeto; não manter cópias, arquivos de arquivo morto nem listas de itens descartados. Antes de concluir ou publicar, conferir que esses itens não estão entre os arquivos do projeto. Se não estiver claro se um item foi descartado, perguntar antes de excluí-lo.
- Ao alterar fases, tarefas ou estados do plano no README, atualizar também `tests/plano.js` para manter o painel visual sincronizado; conferir quantidade de itens, fases e distribuição de estados.
- Antes de qualquer push para o GitHub, revisar localmente o conteúdo que será publicado. Se houver suspeita de credencial, dado pessoal ou outra informação sensível, parar sem publicar, informar o risco e pedir orientação ao usuário. Não enviar esse conteúdo para serviços externos para análise.
- Atualizar a versão do app sempre antes de cada push.
- O plano de trabalho fica no final do README. Cada item usa exatamente um destes estados: `[ ]` a fazer; `[x]` feito, aguardando validação do usuário; `[v]` validado pelo usuário. Ao final de cada tarefa, atualizar o estado do que foi feito e descrever o que falta. Se surgir trabalho necessário que ainda não esteja listado, acrescentá-lo ao plano sem apagar o histórico. O assistente não marca `[v]` por conta própria.
- Um lote só avança depois que sua implementação e todos os testes previstos passam e o usuário valida o resultado. A conclusão do projeto exige todos os lotes validados, a suíte de regressão aprovada e o app funcional de ponta a ponta. Não fazer commit nem push sem autorização explícita. O merge na `main` exige autorização do Aylton e testes validados por ele.
- Pedido de commit ou push da branch feat/telas-iniciais não é bloqueado por estado de lote, teste ou validação.
- Atualize os tutoriais por tipo de conta sempre que surgir funcionalidade nova.

## Regras acrescentadas em 07/11/2026

1. **Push e testes:** o merge na main exige autorização do Aylton e testes validados por ele; commit e push da branch `feat/telas-iniciais` não exigem testes válidos, validação, estado de lote ou app funcional de ponta a ponta. Quando o Aylton pedir explicitamente commit ou push dessa branch, o Copilot deve fazer o solicitado, sem --force, sem tocar na main, sem Co-authored-by e sem menção a IA. Push na main e merge continuam proibidos sem autorização explícita.

2. **Botões de ação** (entrar, enviar, baixar, importar, salvar, confirmar etc.): todo botão de ação deve ter estados visíveis e acessíveis: normal, pressionado, foco, desabilitado, carregando (ex.: "Enviando..."), sucesso e erro. O estado fica DENTRO do botão; erro aparece só quando ocorre, com explicação simples e o que fazer, perto do botão, com role="alert". Bloqueio contra toque duplo, nunca só cor. Para importar e baixar, cobrir também arquivo inválido, arquivo grande demais e cancelado. Usar o padrão existente (runButtonAction), sem criar outro.

3. **Conferência visual:** em toda alteração de interface, conferir que nada se sobreponha indevidamente, que textos não fiquem quebrados ou cortados e que itens não fiquem desalinhados, em 360, 390, 430 e 768 px, nos temas claro e escuro, antes do resumo final. Se não conseguir conferir alguma largura, informar.

## Regra de execução econômica (modo executar, sem repensar)

1. Execute exatamente o que o prompt pede. As decisões já foram tomadas pelo usuário e pelo Claude; não reabra, não reavalie e não proponha alternativas.
2. Não faça análise ampla nem releia arquivos que o prompt não cita. Abra só o que for necessário para a edição pedida.
3. Não explique raciocínio durante o trabalho e não repita no resumo o que já está nos arquivos.
4. Dúvida real (conflito entre o prompt e uma regra do projeto): relate no resumo e siga com o resto. Pergunte só se for impossível continuar.
5. Não faça melhorias, refatorações ou verificações extras que o prompt não pediu.
6. Mantenha todas as regras existentes: branch, sem commit/push sem pedido, fechar abas/servidores/shells, resumo final de até 10 linhas (feito / parcial / não feito por item).

## Regras acrescentadas em 08/11/2026

1. **`js/config.js`:** nunca ler, exibir ou commitar; manter no `.gitignore` e fora do índice Git.
2. **Comandos:** é proibido executar comandos vazios ou em loop.
3. **Execução:** não abrir o navegador nem fazer perguntas interativas, salvo se o prompt pedir; não testar com conta real.
4. **Dúvidas:** se houver dúvida sobre o escopo, parar e reportar em vez de decidir.
