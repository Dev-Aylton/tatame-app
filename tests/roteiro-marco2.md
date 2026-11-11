# Roteiro de testes reais — Marco 2

Use contas de teste e dados sintéticos. Preencha a coluna **Resultado** durante a execução.

| # | Papel | Passo | Resultado esperado | Resultado |
|---:|---|---|---|---|
| 1 | Adm | Entrar com uma conta Adm de teste. | A sessão real abre o painel do Adm com o resumo permitido e sem dados de pagamento. | |
| 2 | Adm | Criar um convite de Professor e consultar academias, Professores ativos e convites pendentes. | O convite é criado para a academia escolhida; os totais e listas correspondem aos registros de teste. | |
| 3 | Adm | Tentar abrir pagamentos, notas, feedbacks e metas. | As telas não são liberadas para o Adm e nenhum dado aparece. | |
| 4 | Adm | Instalar o app pela tela inicial do iPhone e abrir sem conexão. | O shell estático abre; leituras que exigem rede não exibem dados autenticados em cache. | |
| 5 | Professor | Entrar e gerar um convite de Instrutor; aceitar com a conta de teste correspondente. | O vínculo é criado e o Instrutor aparece entre os vinculados. | |
| 6 | Professor | Gerar o código da turma; solicitar vínculo com a conta Aluno de teste e aprovar o pedido. | O Aluno aparece como vinculado ao Professor correto. | |
| 7 | Professor | Criar e enviar uma cobrança; abrir os pagamentos do mês. | A cobrança aparece para o Aluno vinculado e o resumo/histórico reflete os registros carregados. | |
| 8 | Professor | Confirmar um aviso de pagamento, rejeitar outro e estornar um pagamento confirmado. | Os estados e saldos são atualizados; o estorno fica no histórico. O desfazer é conferido no teste do lançamento manual. | |
| 9 | Professor | Registrar um pagamento manual usando cada opção disponível; abrir o histórico e um recibo. | O tipo aparece como foi salvo; o recibo mostra os dados disponíveis e pode ser impresso. | |
| 10 | Professor | Atribuir graduação a um Aluno vinculado e abrir notas, feedbacks e metas. | O histórico é atualizado; notas e registros de acompanhamento ficam restritos aos alunos do Professor. | |
| 11 | Professor | Criar grade, aviso e FAQ; criar e compartilhar um plano semanal e uma aula delegada. | O Professor edita seus registros; apenas o Instrutor vinculado recebe os itens compartilhados. | |
| 12 | Professor | Exportar cobranças/pagamentos carregados e a lista de alunos. | Os arquivos JSON/CSV contêm apenas os dados carregados permitidos e não incluem notas ou feedbacks. | |
| 13 | Professor | Instalar pela tela inicial do iPhone e abrir sem conexão. | O shell estático abre; consultas e ações que exigem rede mostram erro amigável e não usam dados autenticados em cache. | |
| 14 | Instrutor | Entrar pelo convite aceito e abrir aula/plano compartilhados. | Só aparecem as aulas e os planos compartilhados pelo Professor vinculado; é possível registrar se seguiu a aula. | |
| 15 | Instrutor | Tentar abrir pagamentos, notas, feedbacks e metas; tentar acessar exportação de dados. | Nenhum pagamento, registro privado ou botão de exportação proibido é exibido ou acessível. | |
| 16 | Instrutor | Abrir mural, grade, avisos e FAQ da academia vinculada. | Os itens são somente leitura; não aparecem controles de edição. | |
| 17 | Instrutor | Instalar pela tela inicial do iPhone e abrir sem conexão. | O shell estático abre; leituras autenticadas não são servidas do cache. | |
| 18 | Aluno | Entrar e solicitar vínculo usando o código do Professor de teste; aguardar aprovação. | O estado do pedido é mostrado e, após aprovação, a conta fica vinculada ao Professor correto. | |
| 19 | Aluno | Consultar cobranças; enviar avisos nos tipos Dinheiro e Comprovante, com e sem anexo. | O comprovante é opcional; quando anexado, o envio é registrado e o aviso fica pendente para o Professor. | |
| 20 | Aluno | Consultar pagamentos, tipos salvos, recibos disponíveis e graduações próprias. | São mostrados somente os próprios dados; o tipo de pagamento é exibido como veio do banco. | |
| 21 | Aluno | Consultar feedbacks e metas; tentar acessar notas privadas e registros de outro Aluno. | Só aparecem os próprios feedbacks e metas; notas privadas e dados de outra conta não são acessíveis. | |
| 22 | Aluno | Consultar mural, grade, avisos e FAQ; exportar os próprios dados após carregar cobranças, pagamentos e graduações. | O conteúdo é somente leitura; JSON/CSV incluem apenas os próprios dados carregados. | |
| 23 | Aluno | Instalar pela tela inicial do iPhone e abrir sem conexão. | O shell estático abre; leituras e ações que exigem rede mostram erro amigável sem expor dados autenticados em cache. | |
| 24 | Aluno | Anexar um comprovante JPG ou PDF ao aviso de pagamento e enviar pelo iPhone. | O comprovante aparece para o Professor vinculado; o aviso continua pendente e o Aluno não vê comprovantes de outras contas. | |
| 25 | Professor | Abrir um comprovante pendente no iPhone e confirmar o pagamento. | O link temporário abre o arquivo; após a confirmação, o arquivo deixa de estar disponível e o registro permanece. | |
| 26 | Professor | Abrir outro comprovante pendente e rejeitar o aviso. | O arquivo é removido do Storage, o aviso fica rejeitado e o registro permanece. | |
| 27 | Adm e Professor | Enviar foto da academia pelo iPhone com cada perfil. | A foto é exibida por URL temporária aos perfis autenticados autorizados. | |
| 28 | Professor, Aluno, Adm e Instrutor | Enviar foto do Professor e consultar com os perfis indicados. | O Professor vinculado e o Adm veem a foto; Instrutor não. Aluno, Instrutor e menores usam somente avatar próprio. | |
| 29 | Professor | Lançar manualmente um recebimento em dinheiro sem comprovante e desfazê-lo em até 120 segundos. | O lançamento aparece como confirmado; desfazer dentro do prazo restaura os saldos e o histórico corretamente. | |
| 30 | Aluno, Instrutor e Adm | Tentar abrir comprovantes e fotos de Professor sem vínculo ou permissão; tentar consultar pagamentos com Instrutor e Adm. | Nenhum arquivo ou dado não autorizado é exibido; as telas de pagamento continuam indisponíveis para Instrutor e Adm. | |
