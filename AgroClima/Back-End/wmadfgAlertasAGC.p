{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html.    /* Carrega layout HTML padrão */
run p_replace_html. /* Efetua a substituição das Tags coringas por conteudo dinâmico */
run p_show_html.    /* Gera o HTML final */

procedure p_load_html:
    copy-lob file "/agroweb/templates/wmadfgAlertasAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html: /* APENAS A PRIMEIRA VEZ QUE CARREGA A TELA */
    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.

procedure p_carregarPropriedades:

    def var vidusuario as int.
    def var vjson      as char.
    def var vsep       as char init "".

    assign vidusuario = int(get-value("vidusuario")).

    assign vjson = "[". /* Inicia a string do array JSON */

    /* Percorre todas as propriedades do usuário ordenando por nome */
    for each mg-propriedades no-lock
         where mg-propriedades.id-usuario = vidusuario
         by mg-propriedades.nome:

        /* Monta o JSON, O til (~) atua como caractere de escape para
           imprimir as aspas duplas exigidas pelo JSON */
        assign vjson = vjson + vsep
                     + "~{~"id~":"       + string(mg-propriedades.id-propriedade) + ","
                     +  "~"nome~":"      + "~"" + mg-propriedades.nome      + "~","
                     /* Troca vírgula por ponto nas coordenadas */
                     +  "~"latitude~":"  + replace(string(mg-propriedades.latitude,  "->>>9.999999"), ",", ".") + ","
                     +  "~"longitude~":" + replace(string(mg-propriedades.longitude, "->>>9.999999"), ",", ".") + "~}"
               vsep  = ",".
    end.

    assign vjson = vjson + "]". /* Fecha o array JSON */

    /* Se não houver dados, retorna "VAZIO" */
    if vjson = "[]" then do:
        {&out} "VAZIO".
        quit.
    end.

    {&out} vjson.
    quit.

end procedure.

procedure p_salvarAlertas:

    def var vidusuario     as int.
    def var valertas       as longchar.
    def var vitem          as char.
    def var vtipo          as char.
    def var vdescricao     as char.
    def var vdata          as char.
    def var vdataconv      as date.
    def var vhora          as char.
    def var vidpropriedade as int.
    def var vcodigo        as int init 1.
    def var vi             as int.
    def var vtotal         as int.

    assign vidusuario = int(get-value("vidusuario"))
           valertas   = get-value("valertas"). /* String JSON bruta com todos os alertas */

    /* Conta quantos alertas existem na string procurando por "tipo" */
    assign vtotal = 0.
    do vi = 1 to length(valertas):
        if substring(valertas, vi, 6) = "~"tipo~"" then assign vtotal = vtotal + 1.
    end.

    /* Itera sobre a quantidade de alertas encontrados no JSON */
    do vi = 1 to vtotal:
        /* Usa a 'p_extrairCampo' para retirar os valores do JSON. */
        run p_extrairCampo(input valertas, input "tipo",          input vi, output vtipo).
        run p_extrairCampo(input valertas, input "descricao",     input vi, output vdescricao).
        run p_extrairCampo(input valertas, input "data",          input vi, output vdata).
        run p_extrairCampo(input valertas, input "hora",          input vi, output vhora).
        run p_extrairCampo(input valertas, input "idPropriedade", input vi, output vitem).
        assign vidpropriedade = int(vitem).

        /* Converte a string de data enviada pelo JS para o tipo DATE do Progress */
        assign vdataconv = date(int(substring(vdata,6,2)),
                                int(substring(vdata,9,2)),
                                int(substring(vdata,1,4))).

        /* Checa se este alerta já foi salvo no banco. */
        find first mg-alertas no-lock
             where mg-alertas.id-usuario     = vidusuario
               and mg-alertas.id-propriedade = vidpropriedade
               and mg-alertas.tipo           = vtipo
               and mg-alertas.data-alerta    = vdataconv
             no-error.

        /* Se não existir, cria o novo alerta */
        if not avail mg-alertas then do:
            assign vcodigo = 1.
            for each mg-alertas no-lock by mg-alertas.id-alerta descending:
                assign vcodigo = mg-alertas.id-alerta + 1.
                leave.
            end.

            /* Insere o registro no banco */
            create mg-alertas.
            assign mg-alertas.id-alerta      = vcodigo
                   mg-alertas.id-usuario     = vidusuario
                   mg-alertas.id-propriedade = vidpropriedade
                   mg-alertas.tipo           = vtipo
                   mg-alertas.descricao      = vdescricao
                   mg-alertas.data-alerta    = vdataconv
                   mg-alertas.hora-alerta    = vhora
                   mg-alertas.lido           = false.
                   
            release mg-alertas. /* Limpa o buffer */
        end.
    end.

    {&out} "OK".
    quit.

end procedure.

procedure p_extrairCampo:

    def input  param pjson  as longchar.
    def input  param pcampo as char.
    def input  param pidx   as int.
    def output param pvalor as char.

    def var vpos1  as int.
    def var vpos2  as int.
    def var vbusca as char.
    def var vcont  as int.
    def var vi     as int.

    assign vbusca = '"' + pcampo + '":'. /* Prepara a chave a ser buscada (Ex: "tipo":) */
    assign vcont  = 0.
    assign vpos1  = 0.

    /* Procura a X ocorrência da chave */
    do vi = 1 to length(pjson):
        if substring(pjson, vi, length(vbusca)) = vbusca then do:
            assign vcont = vcont + 1.
            if vcont = pidx then do:
                assign vpos1 = vi + length(vbusca). /* Guarda a posição onde o valor começa */
                leave.
            end.
        end.
    end.

    /* Se não achou, retorna vazio */
    if vpos1 = 0 then do:
        assign pvalor = "".
        return.
    end.

    /* Captura o conteúdo do valor, seja texto ou número */
    if substring(pjson, vpos1, 1) = '"' then do:
        assign vpos1 = vpos1 + 1.
        assign vpos2 = index(substring(pjson, vpos1), '"') + vpos1 - 2. /* Acha o fim da aspa */
    end.
    else do:
        assign vpos2 = vpos1.
        do while vpos2 <= length(pjson):
            /* Se for número, o valor termina numa , ou } */
            if substring(pjson, vpos2, 1) = ',' or
               substring(pjson, vpos2, 1) = '}' then leave.
            assign vpos2 = vpos2 + 1.
        end.
        assign vpos2 = vpos2 - 1.
    end.

    /* Extrai o conteúdo baseado na posição inicial e final */
    assign pvalor = substring(pjson, vpos1, vpos2 - vpos1 + 1).

end procedure.

procedure p_carregarAlertas:

    def var vidusuario as int.
    def var vjson      as char.
    def var vsep       as char init "".
    def var vnome      as char.
    def var vlocal     as char.
    def var vlat       as char.
    def var vlon       as char.

    assign vidusuario = int(get-value("vidusuario")).
    assign vjson = "[".

    /* Filtra os alertas do usuário logado, apenas do dia de hoje e que ainda não foram marcados como lidos */
    for each mg-alertas no-lock
         where mg-alertas.id-usuario  = vidusuario
           and mg-alertas.data-alerta = today
           and mg-alertas.lido        = false
         by mg-alertas.tipo:

        /* Zera as variáveis antes de cada busca */
        assign vnome  = ""
               vlocal = ""
               vlat   = "0"
               vlon   = "0".

        find first mg-propriedades no-lock
             where mg-propriedades.id-propriedade = mg-alertas.id-propriedade
             no-error.

        if avail mg-propriedades then do:
            assign vnome  = mg-propriedades.nome
                   vlocal = mg-propriedades.localizacao
                   vlat   = replace(string(mg-propriedades.latitude,  "->>>9.999999"), ",", ".")
                   vlon   = replace(string(mg-propriedades.longitude, "->>>9.999999"), ",", ".").
        end.

        /* Monta o objeto JSON do alerta para enviar ao JS */
        assign vjson = vjson + vsep
                     + "~{~"id~":"             + string(mg-alertas.id-alerta) + ","
                     +  "~"tipo~":"            + "~"" + mg-alertas.tipo      + "~","
                     +  "~"descricao~":"       + "~"" + mg-alertas.descricao + "~","
                     +  "~"data~":"            + "~"" + string(year(mg-alertas.data-alerta),  "9999") + "-"
                                                      + string(month(mg-alertas.data-alerta), "99")   + "-"
                                                      + string(day(mg-alertas.data-alerta),   "99")   + "~","
                     +  "~"hora~":"            + "~"" + mg-alertas.hora-alerta + "~","
                     +  "~"idPropriedade~":"   + string(mg-alertas.id-propriedade) + ","
                     +  "~"nomePropriedade~":" + "~"" + vnome  + "~","
                     +  "~"localizacao~":"     + "~"" + vlocal + "~","
                     +  "~"lat~":"             + vlat + ","
                     +  "~"lon~":"             + vlon + "~}"
               vsep  = ",".
    end.

    assign vjson = vjson + "]".

    if vjson = "[]" then do:
        {&out} "VAZIO".
        quit.
    end.

    {&out} vjson.
    quit.

end procedure.

procedure p_arquivarAlerta:

    def var vidalerta as int.

    assign vidalerta = int(get-value("vidalerta")).

    find first mg-alertas exclusive-lock
         where mg-alertas.id-alerta = vidalerta
         no-error.

    if avail mg-alertas then do:
        assign mg-alertas.lido = true.
        release mg-alertas. /* Grava e limpa o buffer */
    end.

    {&out} "OK".
    quit.

end procedure.

procedure p_arquivarVarios:

    def var vids      as char.
    def var vitem     as char.
    def var vi        as int.
    def var vtotal    as int.
    def var vidalerta as int.

    assign vids   = get-value("vids").
    assign vtotal = num-entries(vids, ","). /* Conta quantos IDs vieram na lista, separados por vírgula */

    /* Trata cada ID da lista */
    do vi = 1 to vtotal:
        /* Extrai o ID na posição 'vi' da lista */
        assign vitem     = entry(vi, vids, ",")
               vidalerta = int(trim(vitem)). /* Remove espaços e converte pra inteiro */

        /* Marca como lido */
        find first mg-alertas exclusive-lock
             where mg-alertas.id-alerta = vidalerta
             no-error.

        if avail mg-alertas then do:
            assign mg-alertas.lido = true.
            release mg-alertas.
        end.
    end.

    {&out} "OK".
    quit.

end procedure.
