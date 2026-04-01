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

    def var vnome        as char.
    def var vlatitude    as char.
    def var vlongitude   as char.
    def var vlocalizacao as char.
    def var vid-usuario  as int.
    def var vcodigo      as int init 1.

    /* Pega os dados enviados pelo front-end */
    assign vnome        = get-value("vnome")
           vlocalizacao = get-value("vlocalizacao")
           vid-usuario  = int(get-value("vidusuario"))
           /* Troca ponto por vírgula para converter corretamente para decimal */
           vlatitude    = replace(get-value("vlatitude"),  ".", ",")
           vlongitude   = replace(get-value("vlongitude"), ".", ",").

    /* Verifica se o usuário que está cadastrando a propriedade existe */
    find first mg-usuarios
         where mg-usuarios.id-usuario = vid-usuario
         no-lock no-error.

    if not avail mg-usuarios then do:
        {&out} "SEM_USUARIO". /* Retorna "SEM_USUARIO" */
        quit.
    end.

    /* Gera o próximo id-propriedade (auto increment manual) */
    find last mg-propriedades no-lock no-error.
    if avail mg-propriedades
    then assign vcodigo = mg-propriedades.id-propriedade + 1.

    /* Cria o registro da nova propriedade */
    create mg-propriedades.
    assign mg-propriedades.id-propriedade = vcodigo
           mg-propriedades.id-usuario     = vid-usuario
           mg-propriedades.nome           = vnome
           mg-propriedades.latitude       = dec(vlatitude)
           mg-propriedades.longitude      = dec(vlongitude)
           mg-propriedades.localizacao    = vlocalizacao.

    release mg-propriedades. /* Limpa o buffer */

    {&out} "OK". /* Retorna "OK" */
    quit.

end procedure.


procedure p_carregarPropriedades:

    def var vid-usuario as int.
    def var vjson       as char.
    def var vsep        as char init "".

    assign vid-usuario = int(get-value("vidusuario")). /* ID enviado pelo front */

    assign vjson = "[". /* Inicia a montagem do array JSON */

    /* Busca todas as propriedades vinculadas a este usuário, ordenando pelo nome */
    for each mg-propriedades no-lock
         where mg-propriedades.id-usuario = vid-usuario
         by mg-propriedades.nome:

        /* Monta o objeto JSON da propriedade atual, usando o til (~) como escape para as aspas */
        assign vjson = vjson + vsep
                     + "~{~"id~":"         + string(mg-propriedades.id-propriedade) + ","
                     +  "~"nome~":"        + "~"" + mg-propriedades.nome        + "~","
                     +  "~"localizacao~":" + "~"" + mg-propriedades.localizacao + "~","
                     /* Formata lat/long e destroca a vírgula por ponto para manter o padrão JSON/Internacional */
                     +  "~"latitude~":"    + replace(string(mg-propriedades.latitude,  "->>>9.999999"), ",", ".") + ","
                     +  "~"longitude~":"   + replace(string(mg-propriedades.longitude, "->>>9.999999"), ",", ".") + "~}"
               vsep  = ",". /* Define a vírgula como separador para os próximos registros */
    end.

    assign vjson = vjson + "]". /* Fecha o array JSON */

    /* Se a string não mudou, significa que o usuário não tem propriedades cadastradas */
    if vjson = "[]" then do:
        {&out} "VAZIO". /* Retorna "VAZIO" */
        quit.
    end.

    {&out} vjson.
    quit.

end procedure.


procedure p_excluirPropriedade:

    def var vidpropriedade as int.

    assign vidpropriedade = int(get-value("vidpropriedade")). /* ID da propriedade a ser excluída */

    /* Exclui todos os alertas vinculados à propriedade */
    for each mg-alertas exclusive-lock
         where mg-alertas.id-propriedade = vidpropriedade:
        delete mg-alertas.
    end.

    /* Busca a propriedade para exclusão */
    find first mg-propriedades exclusive-lock
         where mg-propriedades.id-propriedade = vidpropriedade
         no-error.

    /* Se encontrar, exclui a propriedade */
    if avail mg-propriedades then
        delete mg-propriedades.

    {&out} "OK". /* Retorna "OK" */
    quit.

end procedure.
