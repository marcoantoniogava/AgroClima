/* ========================================
   AGROCLIMA - Tela de Login
   JS principal
   ======================================== */

   $(document).ready(function () {

    /* --------------------------------------------------
       Mostrar / ocultar senha
    -------------------------------------------------- */
    document.getElementById('toggleSenha').addEventListener('click', function () {
        var input = document.getElementById('senha');
        input.type = input.type === 'text' ? 'password' : 'text';
    });


    /* --------------------------------------------------
       Funções auxiliares de validação
    -------------------------------------------------- */

    // Exibe a mensagem de erro abaixo do campo
    function mostrarErro(idErro, mensagem) {
        var elErro  = document.getElementById(idErro);
        var idCampo = idErro.replace('-err', '');
        if (mensagem) elErro.textContent = mensagem;
        elErro.classList.add('visivel');
        document.getElementById(idCampo).classList.add('erro');
    }

    // Remove a mensagem de erro do campo
    function limparErro(idErro) {
        var idCampo = idErro.replace('-err', '');
        document.getElementById(idErro).classList.remove('visivel');
        document.getElementById(idCampo).classList.remove('erro');
    }

    // Exibe o banner de erro geral no topo do formulário
    function mostrarBanner(mensagem) {
        document.getElementById('banner-msg').textContent = mensagem;
        document.getElementById('banner').classList.add('visivel');
    }

    // Oculta o banner de erro geral
    function limparBanner() {
        document.getElementById('banner').classList.remove('visivel');
    }

    // Valida formato de e-mail
    function emailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }


    /* --------------------------------------------------
       Limpa os erros enquanto o usuário digita
    -------------------------------------------------- */
    ['email', 'senha'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () {
            limparErro(id + '-err');
            limparBanner();
        });
    });


    /* --------------------------------------------------
       Envio do formulário
       Chama a procedure p_login no Progress via $.ajax
       Parâmetros enviados: vemail, vsenha
       Retornos esperados do Progress:
         JSON { id, email } ? login OK, salva no localStorage e redireciona
         INVALIDO           ? e-mail ou senha incorretos
    -------------------------------------------------- */
    function enviarFormulario() {
        var valido = true;
        var email  = document.getElementById('email').value.trim();
        var senha  = document.getElementById('senha').value;

        limparBanner();
        limparErro('email-err');
        limparErro('senha-err');

        if (!email || !emailValido(email)) {
            mostrarErro('email-err');
            valido = false;
        }

        if (!senha) {
            mostrarErro('senha-err');
            valido = false;
        }

        if (!valido) return;

        var btn = document.getElementById('btnLogin');
        btn.classList.add('carregando');
        btn.disabled = true;

        var vaux  = window.location.href.indexOf('?') > -1 ? '&' : '?';
        var vdata = 'vemail=' + encodeURIComponent(email)
                  + '&vsenha=' + encodeURIComponent(senha);

        $.ajax({
            type: 'POST',
            contentType: 'Content-type: text/plain; charset=iso-8859-1',
            beforeSend: function (jqXHR) {
                jqXHR.overrideMimeType('text/html;charset=iso-8859-1');
            },
            url: window.location.href + vaux + 'vpad_proc=p_login',
            data: vdata,
            dataType: 'html',
            success: function (vresult) {
                var retorno = vresult.trim();

                if (retorno === 'INVALIDO') {
                    btn.classList.remove('carregando');
                    btn.disabled = false;
                    mostrarBanner('E-mail ou senha incorretos.');
                    return;
                }

                // Tenta interpretar o retorno como JSON com os dados do usuário
                try {
                    var usuario = JSON.parse(retorno);

                    // Salva os dados do usuário no localStorage
                    localStorage.setItem('agc_id',    usuario.id);
                    localStorage.setItem('agc_email', usuario.email);

                    // Redireciona para a tela de propriedades
                    window.location.href = 'wmadfgPropriedadesAGC';

                } catch (e) {
                    btn.classList.remove('carregando');
                    btn.disabled = false;
                    mostrarBanner('Erro ao processar login. Tente novamente.');
                    console.log('Retorno inesperado:', retorno);
                }
            },
            error: function (verror) {
                btn.classList.remove('carregando');
                btn.disabled = false;
                mostrarBanner('Erro na requisição. Tente novamente.');
                console.log(verror);
            }
        });
    }


    /* --------------------------------------------------
       Eventos de disparo do envio
    -------------------------------------------------- */

    // Clique no botão
    document.getElementById('btnLogin').addEventListener('click', enviarFormulario);

    // Tecla Enter em qualquer campo
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') enviarFormulario();
    });

});