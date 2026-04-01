{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html. /* Carrega layout HTML padrão */
run p_replace_html. /* Efetua a substituição das Tags coringas por conteudo dinâmico */
run p_show_html. /* Gera o HTML final */

procedure p_load_html:
    copy-lob file "/agroweb/templates/wmadfgCadastroAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html: /* APENAS A PRIMEIRA VEZ QUE CARREGA A TELA */
    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.

procedure p_cadastrar:

    def var vemail   as char.
    def var vsenha   as char.
    def var vcodigo  as int init 1.
    def var vretorno as char.

    assign vemail  = get-value("vemail")   /* e-mail enviado pelo front */
           vsenha  = get-value("vsenha").  /* senha enviada pelo front */

    /* Verifica se já existe um usuário com esse e-mail */
    find first mg-usuarios
         where mg-usuarios.email = vemail
         no-lock no-error.

    if avail mg-usuarios then do:
        assign vretorno = "EMAIL_DUPLICADO". /* Retorna "EMAIL_DUPLICADO" */
        {&out} vretorno.
        quit.
    end.

    /* Gera o próximo id-usuario (auto increment manual) */
    find last mg-usuarios no-lock no-error.
    if avail mg-usuarios
    then assign vcodigo = mg-usuarios.id-usuario + 1.

    /* Cria o registro do novo usuário */
    create mg-usuarios.
    assign mg-usuarios.id-usuario = vcodigo
           mg-usuarios.email      = vemail
           mg-usuarios.usu-senha  = vsenha.

    release mg-usuarios. /* Limpa o buffer */

    assign vretorno = "OK". /* Retorna "OK" */
    {&out} vretorno.
    quit.

end procedure.
