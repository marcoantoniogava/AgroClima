{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html.    /* Carrega layout HTML padrão */
run p_replace_html. /* Efetua a substituição das Tags coringas por conteudo dinâmico */
run p_show_html.    /* Gera o HTML final */

procedure p_load_html:
    copy-lob file "/agroweb/templates/wmadfgHistoricoAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html: /* APENAS A PRIMEIRA VEZ QUE CARREGA A TELA */
    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.

procedure p_carregarHistorico:

    def var vidusuario as int.
    def var vjson      as char.
    def var vsep       as char init "".
    def var vnome      as char.
    def var vdesc      as char.
    def var vano       as char.
    def var vmes       as char.
    def var vdia       as char.
    def var vdata      as char.
    def var vid        as char.
    def var vtipo      as char.
    def var vhora      as char.
    def var vobj       as char.
    def var vpar       as char.

    /* Recupera o ID do usuário enviado pelo Ajax */
    assign vidusuario = int(get-value("vidusuario")).
    assign vjson = "[". /* Abre o array do JSON */

    /* Busca apenas os alertas do usuário que já foram lidos */
    for each mg-alertas no-lock
         where mg-alertas.id-usuario = vidusuario
           and mg-alertas.lido       = true
         by mg-alertas.data-alerta descending
         by mg-alertas.hora-alerta  descending:

        /* Busca a propriedade relacionada a este alerta */
        find first mg-propriedades no-lock
             where mg-propriedades.id-propriedade = mg-alertas.id-propriedade
             no-error.

        assign vnome = "".
        if avail mg-propriedades then
            assign vnome = mg-propriedades.nome.

        /* Prepara as variáveis convertendo os tipos do banco pra char */
        assign vdesc = mg-alertas.descricao.
        assign vid   = string(mg-alertas.id-alerta).
        assign vtipo = mg-alertas.tipo.
        assign vhora = mg-alertas.hora-alerta.
        
        /* Formata a data */
        assign vano  = string(year(mg-alertas.data-alerta),  "9999").
        assign vmes  = string(month(mg-alertas.data-alerta), "99").
        assign vdia  = string(day(mg-alertas.data-alerta),   "99").
        assign vdata = vano + "-" + vmes + "-" + vdia.

        assign vobj = "~{".

        /* Monta e concatena cada par de informação no objeto */
        assign vpar = "id:" + vid.
        assign vobj = vobj + vpar + ",".

        assign vpar = "tipo:" + vtipo.
        assign vobj = vobj + vpar + ",".

        assign vpar = "descricao:" + vdesc.
        assign vobj = vobj + vpar + ",".

        assign vpar = "data:" + vdata.
        assign vobj = vobj + vpar + ",".

        assign vpar = "hora:" + vhora.
        assign vobj = vobj + vpar + ",".

        assign vpar = "nomePropriedade:" + vnome.
        assign vobj = vobj + vpar.

        assign vobj = vobj + "}". /* Fecha o objeto */

        /* Adiciona o objeto construído dentro do array */
        assign vjson = vjson + vsep + vobj.
        assign vsep  = ",". /* A partir do segundo registro, coloca vírgula para separar da linha anterior */
    end.

    assign vjson = vjson + "]". /* Fecha o array */

    /* Se a string estiver apenas com os colchetes, o histórico está vazio */
    if vjson = "[]" then do:
        {&out} "VAZIO".
        quit.
    end.

    {&out} vjson.
    quit.

end procedure.

procedure p_excluirAlerta:

    def var vidalerta as int.

    assign vidalerta = int(get-value("vidalerta")).

    find first mg-alertas exclusive-lock
         where mg-alertas.id-alerta = vidalerta
         no-error.

    if avail mg-alertas then do:
        delete mg-alertas.
        {&out} "OK".
    end.
    else do:
        {&out} "ERRO". /* Retorna erro caso o registro não exista mais */
    end.

    quit.

end procedure.

procedure p_excluirTodos:

    def var vidusuario as int.

    assign vidusuario = int(get-value("vidusuario")).

    for each mg-alertas exclusive-lock
         where mg-alertas.id-usuario = vidusuario
           and mg-alertas.lido       = true:
           
        delete mg-alertas. /* Remove do banco cada alerta encontrado */
    end.

    {&out} "OK".
    quit.

end procedure.
