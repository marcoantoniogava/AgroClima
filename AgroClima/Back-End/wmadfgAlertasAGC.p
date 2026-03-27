{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html.
run p_replace_html.
run p_show_html.

procedure p_load_html:
    copy-lob file "/agroweb/templates/wmadfgAlertasAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html:
    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.


/* p_carregarPropriedades
   Retorna propriedades do usuário — inclui id para o JS montar alertas corretamente */
procedure p_carregarPropriedades:

    def var vidusuario as int.
    def var vjson      as char.
    def var vsep       as char init "".

    assign vidusuario = int(get-value("vidusuario")).

    assign vjson = "[".

    for each mg-propriedades no-lock
         where mg-propriedades.id-usuario = vidusuario
         by mg-propriedades.nome:

        assign vjson = vjson + vsep
                     + "~{~"id~":"       + string(mg-propriedades.id-propriedade) + ","
                     +  "~"nome~":"      + "~"" + mg-propriedades.nome      + "~","
                     +  "~"latitude~":"  + replace(string(mg-propriedades.latitude,  "->>>9.999999"), ",", ".") + ","
                     +  "~"longitude~":" + replace(string(mg-propriedades.longitude, "->>>9.999999"), ",", ".") + "~}"
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


/* p_salvarAlertas
   Recebe JSON com lista de alertas e salva os que não existem ainda hoje */
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
           valertas   = get-value("valertas").

    assign vtotal = 0.
    do vi = 1 to length(valertas):
        if substring(valertas, vi, 6) = "~"tipo~"" then assign vtotal = vtotal + 1.
    end.

    do vi = 1 to vtotal:
        run p_extrairCampo(input valertas, input "tipo",          input vi, output vtipo).
        run p_extrairCampo(input valertas, input "descricao",     input vi, output vdescricao).
        run p_extrairCampo(input valertas, input "data",          input vi, output vdata).
        run p_extrairCampo(input valertas, input "hora",          input vi, output vhora).
        run p_extrairCampo(input valertas, input "idPropriedade", input vi, output vitem).
        assign vidpropriedade = int(vitem).

        assign vdataconv = date(int(substring(vdata,6,2)),
                                int(substring(vdata,9,2)),
                                int(substring(vdata,1,4))).

        find first mg-alertas no-lock
             where mg-alertas.id-usuario     = vidusuario
               and mg-alertas.id-propriedade = vidpropriedade
               and mg-alertas.tipo           = vtipo
               and mg-alertas.data-alerta    = vdataconv
             no-error.

        if not avail mg-alertas then do:
            assign vcodigo = 1.
            for each mg-alertas no-lock by mg-alertas.id-alerta descending:
                assign vcodigo = mg-alertas.id-alerta + 1.
                leave.
            end.

            create mg-alertas.
            assign mg-alertas.id-alerta      = vcodigo
                   mg-alertas.id-usuario     = vidusuario
                   mg-alertas.id-propriedade = vidpropriedade
                   mg-alertas.tipo           = vtipo
                   mg-alertas.descricao      = vdescricao
                   mg-alertas.data-alerta    = vdataconv
                   mg-alertas.hora-alerta    = vhora
                   mg-alertas.lido           = false.
            release mg-alertas.
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

    assign vbusca = '"' + pcampo + '":'.
    assign vcont  = 0.
    assign vpos1  = 0.

    do vi = 1 to length(pjson):
        if substring(pjson, vi, length(vbusca)) = vbusca then do:
            assign vcont = vcont + 1.
            if vcont = pidx then do:
                assign vpos1 = vi + length(vbusca).
                leave.
            end.
        end.
    end.

    if vpos1 = 0 then do:
        assign pvalor = "".
        return.
    end.

    if substring(pjson, vpos1, 1) = '"' then do:
        assign vpos1 = vpos1 + 1.
        assign vpos2 = index(substring(pjson, vpos1), '"') + vpos1 - 2.
    end.
    else do:
        assign vpos2 = vpos1.
        do while vpos2 <= length(pjson):
            if substring(pjson, vpos2, 1) = ',' or
               substring(pjson, vpos2, 1) = '}' then leave.
            assign vpos2 = vpos2 + 1.
        end.
        assign vpos2 = vpos2 - 1.
    end.

    assign pvalor = substring(pjson, vpos1, vpos2 - vpos1 + 1).

end procedure.


/* p_carregarAlertas
   Retorna alertas do dia atual (lido = false) do usuário */
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

    for each mg-alertas no-lock
         where mg-alertas.id-usuario  = vidusuario
           and mg-alertas.data-alerta = today
           and mg-alertas.lido        = false
         by mg-alertas.tipo:

        /* Zera variáveis antes de cada busca para não vazar dados da iteração anterior */
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


/* p_arquivarAlerta */
procedure p_arquivarAlerta:

    def var vidalerta as int.

    assign vidalerta = int(get-value("vidalerta")).

    find first mg-alertas exclusive-lock
         where mg-alertas.id-alerta = vidalerta
         no-error.

    if avail mg-alertas then do:
        assign mg-alertas.lido = true.
        release mg-alertas.
    end.

    {&out} "OK".
    quit.

end procedure.


/* p_arquivarVarios */
procedure p_arquivarVarios:

    def var vids      as char.
    def var vitem     as char.
    def var vi        as int.
    def var vtotal    as int.
    def var vidalerta as int.

    assign vids   = get-value("vids").
    assign vtotal = num-entries(vids, ",").

    do vi = 1 to vtotal:
        assign vitem     = entry(vi, vids, ",")
               vidalerta = int(trim(vitem)).

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
