{webpro.i}
{wpadfunc.i}

def var vtpl      as class Template.
def var vpad-html as longchar.

run p_load_html. /* Carrega layout HTML padrão */
run p_replace_html. /* Efetua a substituição das Tags coringas por conteudo dinâmico */
run p_show_html. /* Gera o HTML final */

procedure p_load_html:

    copy-lob file "/agroweb/templates/wmadfgLoginAGC.tpl" to vpad-html.
    assign vtpl = new Template(vpad-html).
end procedure.

procedure p_replace_html: /* APENAS A PRIMEIRA VEZ QUE CARREGA A TELA */

    vtpl:troca("[cache]", string(today, "99999999") + string(time, "999999")).
    vtpl:block("BLOCK_CACHE").
end procedure.

procedure p_show_html:
    vtpl:show().
end procedure.

procedure p_login:

    def var vemail   as char.
    def var vsenha   as char.
    def var vretorno as char.

    assign vemail = get-value("vemail")   /* e-mail enviado pelo front */
           vsenha = get-value("vsenha").  /* senha enviada pelo front */

    /* Busca o usuário pelo e-mail e senha */
    find first mg-usuarios
         where mg-usuarios.email     = vemail
           and mg-usuarios.usu-senha = vsenha
         no-lock no-error.

    if not avail mg-usuarios then do:
        assign vretorno = "INVALIDO".
        {&out} vretorno.
        quit.
    end.

    /* Monta o JSON com os dados do usuário para o front salvar no localStorage */
    assign vretorno = '~{"id":' + string(mg-usuarios.id-usuario)
                    + ',"email":"' + mg-usuarios.email + '"~}'.

    {&out} vretorno.
    quit.

end procedure.
