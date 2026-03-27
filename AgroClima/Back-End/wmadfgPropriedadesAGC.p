{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html.
run p_replace_html.
run p_show_html.

procedure p_load_html:
    copy-lob file "/agroweb/templates/wmadfgPropriedadesAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html:
    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.


procedure p_salvarPropriedade:

    def var vnome        as char.
    def var vlatitude    as char.
    def var vlongitude   as char.
    def var vlocalizacao as char.
    def var vid-usuario  as int.
    def var vcodigo      as int init 1.

    assign vnome        = get-value("vnome")
           vlatitude    = replace(get-value("vlatitude"),  ".", ",")
           vlongitude   = replace(get-value("vlongitude"), ".", ",")
           vlocalizacao = get-value("vlocalizacao")
           vid-usuario  = int(get-value("vidusuario")).

    find first mg-usuarios
         where mg-usuarios.id-usuario = vid-usuario
         no-lock no-error.

    if not avail mg-usuarios then do:
        {&out} "SEM_USUARIO".
        quit.
    end.

    find last mg-propriedades no-lock no-error.
    if avail mg-propriedades
    then assign vcodigo = mg-propriedades.id-propriedade + 1.

    create mg-propriedades.
    assign mg-propriedades.id-propriedade = vcodigo
           mg-propriedades.id-usuario     = vid-usuario
           mg-propriedades.nome           = vnome
           mg-propriedades.latitude       = dec(vlatitude)
           mg-propriedades.longitude      = dec(vlongitude)
           mg-propriedades.localizacao    = vlocalizacao.

    release mg-propriedades.

    {&out} "OK".
    quit.

end procedure.


procedure p_carregarPropriedades:

    def var vid-usuario as int.
    def var vjson       as char.
    def var vsep        as char init "".

    assign vid-usuario = int(get-value("vidusuario")).

    assign vjson = "[".

    for each mg-propriedades no-lock
         where mg-propriedades.id-usuario = vid-usuario
         by mg-propriedades.nome:

        assign vjson = vjson + vsep
                     + "~{~"id~":"         + string(mg-propriedades.id-propriedade) + ","
                     +  "~"nome~":"        + "~"" + mg-propriedades.nome        + "~","
                     +  "~"localizacao~":" + "~"" + mg-propriedades.localizacao + "~","
                     +  "~"latitude~":"    + replace(string(mg-propriedades.latitude,  "->>>9.999999"), ",", ".") + ","
                     +  "~"longitude~":"   + replace(string(mg-propriedades.longitude, "->>>9.999999"), ",", ".") + "~}"
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


procedure p_excluirPropriedade:

    def var vidpropriedade as int.

    assign vidpropriedade = int(get-value("vidpropriedade")).

    /* Exclui todos os alertas vinculados à propriedade */
    for each mg-alertas exclusive-lock
         where mg-alertas.id-propriedade = vidpropriedade:
        delete mg-alertas.
    end.

    /* Exclui a propriedade */
    find first mg-propriedades exclusive-lock
         where mg-propriedades.id-propriedade = vidpropriedade
         no-error.

    if avail mg-propriedades then
        delete mg-propriedades.

    {&out} "OK".
    quit.

end procedure.
