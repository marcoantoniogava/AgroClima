{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html. /* Carrega layout HTML padrão */
run p_replace_html. /* Efetua a substituição das Tags coringas por conteudo dinâmico */
run p_show_html. /* Gera o HTML final */

procedure p_load_html:

    copy-lob file "/agroweb/templates/wmadfgPropriedadesAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html: /* APENAS A PRIMEIRA VEZ QUE CARREGA A TELA */

    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.

procedure p_salvarPropriedade:

    def var vnome       as char.
    def var vlatitude   as char.
    def var vlongitude  as char.
    def var vid-usuario as int.
    def var vcodigo     as int init 1.
    def var vretorno    as char.

    assign vnome       = get-value("vnome")
           vlatitude   = replace(get-value("vlatitude"),  ".", ",")
           vlongitude  = replace(get-value("vlongitude"), ".", ",")
           vid-usuario = int(get-value("vidusuario")).

    /* Valida se o usuário existe */
    find first mg-usuarios
         where mg-usuarios.id-usuario = vid-usuario
         no-lock no-error.

    if not avail mg-usuarios then do:
        assign vretorno = "SEM_USUARIO".
        {&out} vretorno.
        quit.
    end.

    /* Gera o próximo id-propriedade */
    find last mg-propriedades no-lock no-error.
    if avail mg-propriedades
    then assign vcodigo = mg-propriedades.id-propriedade + 1.

    /* Cria o registro da propriedade */
    create mg-propriedades.
    assign mg-propriedades.id-propriedade = vcodigo
           mg-propriedades.id-usuario     = vid-usuario
           mg-propriedades.nome           = vnome
           mg-propriedades.latitude       = dec(vlatitude)
           mg-propriedades.longitude      = dec(vlongitude).

    release mg-propriedades.

    assign vretorno = "OK".
    {&out} vretorno.
    quit.

end procedure.

procedure p_carregarPropriedades:

    def var vid-usuario as int.
    def var vjson       as char.
    def var vsep        as char init "".

    assign vid-usuario = int(get-value("vidusuario")).

    /* Monta o JSON com todas as propriedades do usuário */
    assign vjson = "[".

    for each mg-propriedades no-lock
         where mg-propriedades.id-usuario = vid-usuario
         by mg-propriedades.nome:

        assign vjson = vjson + vsep
                     + "~{~"nome~":" + "~"" + mg-propriedades.nome + "~","
                     +  "~"latitude~":"  + replace(string(mg-propriedades.latitude,  "->9.999999"), ",", ".") + ","
                     +  "~"longitude~":" + replace(string(mg-propriedades.longitude, "->9.999999"), ",", ".") + "~}"
               vsep  = ",".
    end.

    assign vjson = vjson + "]".

    /* Se não houver nenhuma, retorna VAZIO */
    if vjson = "[]" then do:
        {&out} "VAZIO".
        quit.
    end.

    {&out} vjson.
    quit.

end procedure.