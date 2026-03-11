/* ========================================
   AGROCLIMA - Tela de Cadastro
   JS principal
   ======================================== */

   $(document).ready(function () {

    /* --------------------------------------------------
       Mostrar / ocultar senha
       Configura o botão do olho para alternar o tipo
       do input entre "password" e "text"
    -------------------------------------------------- */
    function configurarToggleSenha(idBotao, idInput) {
        document.getElementById(idBotao).addEventListener('click', function () {
            var input = document.getElementById(idInput);
            input.type = input.type === 'text' ? 'password' : 'text';
        });
    }

    configurarToggleSenha('toggleSenha', 'senha');
    configurarToggleSenha('toggleConfirma', 'confirma');


    /* --------------------------------------------------
       Barra de força da senha
       Avalia a senha em tempo real e atualiza a barra
       com as classes s1 (fraca) até s4 (forte)
    -------------------------------------------------- */
    var barraForca = document.getElementById('barraForca');
    var labelForca = document.getElementById('labelForca');

    var niveis = [
        { classe: '',   texto: '' },
        { classe: 's1', texto: 'Fraca' },
        { classe: 's2', texto: 'Razoável' },
        { classe: 's3', texto: 'Boa' },
        { classe: 's4', texto: 'Forte' },
    ];

    function calcularForcaSenha(senha) {
        if (!senha) return 0;
        var pontos = 0;
        if (senha.length >= 8)  pontos++;
        if (senha.length >= 12) pontos++;
        if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) pontos++; // tem maiúscula e minúscula
        if (/\d/.test(senha))            pontos++; // tem número
        if (/[^A-Za-z0-9]/.test(senha)) pontos++; // tem caractere especial
        return Math.min(4, Math.ceil(pontos * 4 / 5));
    }

    document.getElementById('senha').addEventListener('input', function () {
        var nivel = calcularForcaSenha(this.value);
        barraForca.className   = 'barra-forca' + (nivel ? ' s' + nivel : '');
        labelForca.className   = 'label-forca' + (nivel ? ' s' + nivel : '');
        labelForca.textContent = this.value ? niveis[nivel].texto : '';
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

    // Oculta o aviso de sucesso
    function limparSucesso() {
        document.getElementById('avisoSucesso').classList.remove('visivel');
    }

    // Valida formato de e-mail
    function emailValido(valor) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
    }


    /* --------------------------------------------------
       Limpa os erros enquanto o usuário digita
    -------------------------------------------------- */
    ['email', 'senha', 'confirma'].forEach(function (id) {
        document.getElementById(id).addEventListener('input', function () {
            limparErro(id + '-err');
            limparBanner();
            limparSucesso();
        });
    });


    /* --------------------------------------------------
       Envio do formulário
       Chama a procedure p_cadastrar no Progress via $.ajax
       Parâmetros enviados: vemail, vsenha
       Retornos esperados do Progress:
         OK              ? cadastro realizado com sucesso
         EMAIL_DUPLICADO ? e-mail já existe na tabela mg-usuarios
    -------------------------------------------------- */
    function enviarFormulario() {
        var valido   = true;
        var email    = document.getElementById('email').value.trim();
        var senha    = document.getElementById('senha').value;
        var confirma = document.getElementById('confirma').value;

        limparBanner();
        limparSucesso();
        limparErro('email-err');
        limparErro('senha-err');
        limparErro('confirma-err');

        if (!email || !emailValido(email)) {
            mostrarErro('email-err');
            valido = false;
        }

        if (senha.length < 8) {
            mostrarErro('senha-err');
            valido = false;
        }

        if (senha !== confirma) {
            mostrarErro('confirma-err');
            valido = false;
        }

        if (!valido) return;

        var btn = document.getElementById('btnCadastro');
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
            url: window.location.href + vaux + 'vpad_proc=p_cadastrar',
            data: vdata,
            dataType: 'html',
            success: function (vresult) {
                btn.classList.remove('carregando');
                btn.disabled = false;

                if (vresult.trim() === 'OK') {
                    // Limpa os campos
                    document.getElementById('email').value    = '';
                    document.getElementById('senha').value    = '';
                    document.getElementById('confirma').value = '';

                    // Reseta a barra de força da senha
                    barraForca.className   = 'barra-forca';
                    labelForca.className   = 'label-forca';
                    labelForca.textContent = '';

                    // Exibe aviso de sucesso
                    document.getElementById('avisoSucesso').classList.add('visivel');

                } else if (vresult.trim() === 'EMAIL_DUPLICADO') {
                    mostrarBanner('Este e-mail já está cadastrado.');

                } else {
                    mostrarBanner('Erro ao criar conta. Tente novamente.');
                    console.log('Retorno inesperado:', vresult);
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
    document.getElementById('btnCadastro').addEventListener('click', enviarFormulario);

    // Tecla Enter em qualquer campo
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') enviarFormulario();
    });

});