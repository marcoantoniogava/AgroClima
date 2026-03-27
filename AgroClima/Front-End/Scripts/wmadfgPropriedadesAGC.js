/* ========================================
   AGROCLIMA - Tela de Propriedades
   JS principal
   ======================================== */

   $(document).ready(function () {

    var localSelecionado = null;
    var timerBusca       = null;

    var ICONE_LIXEIRA =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<polyline points="3 6 5 6 21 6"/>' +
        '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
        '<path d="M10 11v6"/><path d="M14 11v6"/>' +
        '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

    /* --------------------------------------------------
       Abrir / fechar modal
    -------------------------------------------------- */
    function abrirModal() {
        document.getElementById('modalFundo').classList.add('visivel');
        limparModal();
    }

    function fecharModal() {
        document.getElementById('modalFundo').classList.remove('visivel');
    }

    document.getElementById('btnAbrirModal').addEventListener('click', abrirModal);
    document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
    document.getElementById('btnCancelarModal').addEventListener('click', fecharModal);

    document.getElementById('modalFundo').addEventListener('click', function (e) {
        if (e.target === this) fecharModal();
    });

    /* --------------------------------------------------
       Validação do modal
    -------------------------------------------------- */
    function mostrarErroModal(idErro, mensagem) {
        var elErro  = document.getElementById(idErro);
        var idCampo = idErro.replace('-err', '');
        if (mensagem) elErro.textContent = mensagem;
        elErro.classList.add('visivel');
        var campo = document.getElementById(idCampo);
        if (campo) campo.classList.add('erro');
    }

    function limparErroModal(idErro) {
        document.getElementById(idErro).classList.remove('visivel');
        var idCampo = idErro.replace('-err', '');
        var campo   = document.getElementById(idCampo);
        if (campo) campo.classList.remove('erro');
    }

    function mostrarBannerModal(mensagem) {
        document.getElementById('bannerModal-msg').textContent = mensagem;
        document.getElementById('bannerModal').classList.add('visivel');
    }

    function limparBannerModal() {
        document.getElementById('bannerModal').classList.remove('visivel');
    }

    function limparModal() {
        document.getElementById('nomePropriedade').value  = '';
        document.getElementById('buscaLocalizacao').value = '';
        localSelecionado = null;

        limparBannerModal();
        limparErroModal('nomePropriedade-err');
        limparErroModal('localizacao-err');

        document.getElementById('listaLocais').classList.remove('visivel');
        document.getElementById('listaLocais').innerHTML = '';
        document.getElementById('localSelecionado').classList.remove('visivel');
        document.getElementById('spinnerBusca').classList.remove('visivel');

        var btn = document.getElementById('btnSalvarPropriedade');
        btn.classList.remove('carregando');
        btn.disabled = false;
    }

    /* --------------------------------------------------
       Busca de localização via Open-Meteo Geocoding
    -------------------------------------------------- */
    document.getElementById('buscaLocalizacao').addEventListener('input', function () {
        var termo = this.value.trim();
        if (!termo) { esconderListaLocais(); return; }
        clearTimeout(timerBusca);
        timerBusca = setTimeout(function () { buscarLocalizacao(termo); }, 500);
    });

    function buscarLocalizacao(termo) {
        document.getElementById('spinnerBusca').classList.add('visivel');
        esconderListaLocais();

        $.ajax({
            url: 'https://geocoding-api.open-meteo.com/v1/search',
            method: 'GET',
            data: { name: termo, count: 8, language: 'pt', format: 'json' },
            success: function (resposta) {
                document.getElementById('spinnerBusca').classList.remove('visivel');
                renderizarListaLocais(resposta.results || []);
            },
            error: function () {
                document.getElementById('spinnerBusca').classList.remove('visivel');
                mostrarBannerModal('Erro ao buscar localização. Verifique sua conexão e tente novamente.');
            }
        });
    }

    function renderizarListaLocais(resultados) {
        var lista = document.getElementById('listaLocais');
        lista.innerHTML = '';

        if (resultados.length === 0) {
            lista.innerHTML = '<div class="sem-resultados">Nenhum local encontrado para esta busca.</div>';
            lista.classList.add('visivel');
            return;
        }

        resultados.forEach(function (local) {
            var nomeExibido    = local.name;
            var detalheExibido = [local.admin1, local.country].filter(Boolean).join(', ');

            var item = document.createElement('div');
            item.className = 'item-local';
            item.innerHTML =
                '<span class="item-local-nome">'    + nomeExibido    + '</span>' +
                '<span class="item-local-detalhe">' + detalheExibido + '</span>';

            item.addEventListener('click', function () {
                selecionarLocal({
                    nome:      nomeExibido,
                    detalhe:   detalheExibido,
                    latitude:  local.latitude,
                    longitude: local.longitude
                });
            });

            lista.appendChild(item);
        });

        lista.classList.add('visivel');
    }

    function esconderListaLocais() {
        var lista = document.getElementById('listaLocais');
        lista.classList.remove('visivel');
        lista.innerHTML = '';
    }

    function selecionarLocal(local) {
        localSelecionado = local;
        document.getElementById('localSelecionadoNome').textContent   = local.nome + (local.detalhe ? ', ' + local.detalhe : '');
        document.getElementById('localSelecionadoCoords').textContent = 'Lat: ' + local.latitude + ' | Lon: ' + local.longitude;
        document.getElementById('localSelecionado').classList.add('visivel');
        esconderListaLocais();
        document.getElementById('buscaLocalizacao').value = '';
        limparErroModal('localizacao-err');
    }

    document.getElementById('btnRemoverLocal').addEventListener('click', function () {
        localSelecionado = null;
        document.getElementById('localSelecionado').classList.remove('visivel');
        document.getElementById('localSelecionadoNome').textContent   = '';
        document.getElementById('localSelecionadoCoords').textContent = '';
    });

    /* --------------------------------------------------
       Salvar propriedade
    -------------------------------------------------- */
    document.getElementById('btnSalvarPropriedade').addEventListener('click', function () {
        var valido = true;
        var nome   = document.getElementById('nomePropriedade').value.trim();

        limparBannerModal();
        limparErroModal('nomePropriedade-err');
        limparErroModal('localizacao-err');

        if (!nome)             { mostrarErroModal('nomePropriedade-err'); valido = false; }
        if (!localSelecionado) { mostrarErroModal('localizacao-err');     valido = false; }
        if (!valido) return;

        var vidUsuario = localStorage.getItem('agc_id');
        if (!vidUsuario) {
            mostrarBannerModal('Você precisa estar logado para cadastrar uma propriedade.');
            return;
        }

        var btn = document.getElementById('btnSalvarPropriedade');
        btn.classList.add('carregando');
        btn.disabled = true;

        var localizacaoStr = localSelecionado.nome + (localSelecionado.detalhe ? ', ' + localSelecionado.detalhe : '');

        var vaux  = window.location.href.indexOf('?') > -1 ? '&' : '?';
        var vdata = 'vnome='         + encodeURIComponent(nome)
                  + '&vlatitude='    + encodeURIComponent(localSelecionado.latitude)
                  + '&vlongitude='   + encodeURIComponent(localSelecionado.longitude)
                  + '&vlocalizacao=' + encodeURIComponent(localizacaoStr)
                  + '&vidusuario='   + vidUsuario;

        $.ajax({
            type: 'POST',
            contentType: 'Content-type: text/plain; charset=UTF-8',
            beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
            url: window.location.href + vaux + 'vpad_proc=p_salvarPropriedade',
            data: vdata,
            dataType: 'html',
            success: function (vresult) {
                btn.classList.remove('carregando');
                btn.disabled = false;

                if (vresult.trim() === 'OK') {
                    fecharModal();
                    document.getElementById('corpoTabela').innerHTML = '';
                    carregarPropriedades();
                } else if (vresult.trim() === 'SEM_USUARIO') {
                    mostrarBannerModal('Usuário não encontrado. Faça login novamente.');
                } else {
                    mostrarBannerModal('Erro ao salvar a propriedade. Tente novamente.');
                    console.log('Retorno inesperado:', vresult);
                }
            },
            error: function (verror) {
                btn.classList.remove('carregando');
                btn.disabled = false;
                mostrarBannerModal('Erro na requisição. Tente novamente.');
                console.log(verror);
            }
        });
    });

    /* --------------------------------------------------
       Tabela de propriedades
    -------------------------------------------------- */
    function adicionarLinhaTabela(propriedade) {
        var tbody = document.getElementById('corpoTabela');
        var linha = document.createElement('tr');
        linha.setAttribute('data-id', propriedade.id);
        linha.innerHTML =
            '<td>' + propriedade.nome + '</td>' +
            '<td>' + (propriedade.localizacao || '') + '</td>' +
            '<td>' + propriedade.latitude  + '</td>' +
            '<td>' + propriedade.longitude + '</td>' +
            '<td style="display:flex;gap:8px;align-items:center;">' +
                '<a href="#" class="link-painel" ' +
                    'data-nome="'  + propriedade.nome        + '" ' +
                    'data-local="' + (propriedade.localizacao || '') + '" ' +
                    'data-lat="'   + propriedade.latitude    + '" ' +
                    'data-lon="'   + propriedade.longitude   + '">Acessar painel</a>' +
                '<button class="btn-excluir-linha btn-excluir-prop" title="Excluir propriedade" data-id="' + propriedade.id + '">' +
                    ICONE_LIXEIRA +
                '</button>' +
            '</td>';

        tbody.appendChild(linha);

        linha.querySelector('.link-painel').addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.setItem('agc_painel_nome',  this.getAttribute('data-nome'));
            localStorage.setItem('agc_painel_local', this.getAttribute('data-local'));
            localStorage.setItem('agc_painel_lat',   this.getAttribute('data-lat'));
            localStorage.setItem('agc_painel_lon',   this.getAttribute('data-lon'));
            window.location.href = 'wmadfgPainelAGC';
        });

        linha.querySelector('.btn-excluir-prop').addEventListener('click', function () {
            var idProp = this.getAttribute('data-id');
            var tr     = this.closest('tr');
            confirmar(
                'Excluir propriedade',
                'Todos os alertas vinculados a esta propriedade também serão excluídos. Deseja continuar?',
                function () { excluirPropriedade(idProp, tr); }
            );
        });

        atualizarVisibilidadeTabela();
        return linha;
    }

    function atualizarVisibilidadeTabela() {
        var linhas   = document.querySelectorAll('#corpoTabela tr');
        var visiveis = Array.from(linhas).filter(function (l) { return l.style.display !== 'none'; });
        document.getElementById('tabelaVazia').classList.toggle('visivel', visiveis.length === 0);
    }

    /* --------------------------------------------------
       Excluir propriedade
    -------------------------------------------------- */
    function excluirPropriedade(idProp, tr) {
        var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

        $.ajax({
            type: 'POST',
            contentType: 'Content-type: text/plain; charset=UTF-8',
            beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
            url: window.location.href + vaux + 'vpad_proc=p_excluirPropriedade',
            data: 'vidpropriedade=' + idProp,
            dataType: 'html',
            success: function (vresult) {
                if (vresult.trim() === 'OK') {
                    tr.style.transition = 'opacity .25s';
                    tr.style.opacity    = '0';
                    setTimeout(function () {
                        tr.remove();
                        atualizarVisibilidadeTabela();
                    }, 250);
                } else {
                    alert('Erro ao excluir a propriedade. Tente novamente.');
                }
            },
            error: function () {
                alert('Erro de comunicação. Tente novamente.');
            }
        });
    }

    /* --------------------------------------------------
       Modal de confirmação
    -------------------------------------------------- */
    function confirmar(titulo, mensagem, onConfirmar) {
        var anterior = document.getElementById('propModal');
        if (anterior) anterior.remove();

        var overlay = document.createElement('div');
        overlay.className = 'hist-modal-overlay';
        overlay.id = 'propModal';
        overlay.innerHTML =
            '<div class="hist-modal">' +
            '<div class="hist-modal-icone">' + ICONE_LIXEIRA + '</div>' +
            '<h3>' + titulo + '</h3>' +
            '<p>' + mensagem + '</p>' +
            '<div class="hist-modal-acoes">' +
                '<button class="hist-modal-cancelar" id="propModalCancelar">Cancelar</button>' +
                '<button class="hist-modal-confirmar" id="propModalConfirmar">Excluir</button>' +
            '</div></div>';

        document.body.appendChild(overlay);

        document.getElementById('propModalCancelar').addEventListener('click', function () { overlay.remove(); });
        document.getElementById('propModalConfirmar').addEventListener('click', function () { overlay.remove(); onConfirmar(); });
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
    }

    /* --------------------------------------------------
       Busca na tabela
    -------------------------------------------------- */
    document.getElementById('campoBusca').addEventListener('input', function () {
        var termo  = this.value.toLowerCase().trim();
        var linhas = document.querySelectorAll('#corpoTabela tr');
        linhas.forEach(function (linha) {
            linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
        });
        atualizarVisibilidadeTabela();
    });

    /* --------------------------------------------------
       Inicialização
    -------------------------------------------------- */
    var agcEmail = localStorage.getItem('agc_email');
    if (agcEmail) document.getElementById('nomeUsuario').textContent = agcEmail;

    function carregarPropriedades() {
        var vidUsuario = localStorage.getItem('agc_id');
        if (!vidUsuario) { atualizarVisibilidadeTabela(); return; }

        var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

        $.ajax({
            type: 'POST',
            contentType: 'Content-type: text/plain; charset=UTF-8',
            beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
            url: window.location.href + vaux + 'vpad_proc=p_carregarPropriedades',
            data: 'vidusuario=' + vidUsuario,
            dataType: 'html',
            success: function (vresult) {
                var retorno = vresult.trim();
                if (retorno === 'VAZIO') { atualizarVisibilidadeTabela(); return; }
                try {
                    var lista = JSON.parse(retorno);
                    lista.forEach(function (prop) {
                        adicionarLinhaTabela({
                            id:          prop.id,
                            nome:        prop.nome,
                            localizacao: prop.localizacao,
                            latitude:    prop.latitude,
                            longitude:   prop.longitude
                        });
                    });
                } catch (e) {
                    console.log('Erro ao carregar propriedades:', e);
                }
                atualizarVisibilidadeTabela();
            },
            error: function (verror) {
                console.log('Erro ao carregar propriedades:', verror);
                atualizarVisibilidadeTabela();
            }
        });
    }

    carregarPropriedades();

    document.getElementById('nav-alertas').addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = 'wmadfgAlertasAGC';
    });

    document.getElementById('btnLogout').addEventListener('click', function () {
        localStorage.removeItem('agc_id');
        localStorage.removeItem('agc_email');
        window.location.href = 'wmadfgLoginAGC';
    });

});