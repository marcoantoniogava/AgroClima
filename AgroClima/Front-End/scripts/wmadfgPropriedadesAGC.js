/* ========================================
   AGROCLIMA - Tela de Propriedades
   JS principal
   ======================================== */

   $(document).ready(function () {

    /* --------------------------------------------------
       Dados de estado do modal
    -------------------------------------------------- */
    var localSelecionado = null; // Guarda o local escolhido da API { nome, latitude, longitude, detalhe }
    var timerBusca       = null; // Timer para o debounce da busca (evita chamada a cada tecla)


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

    // Fecha ao clicar fora do modal
    document.getElementById('modalFundo').addEventListener('click', function (e) {
        if (e.target === this) fecharModal();
    });


    /* --------------------------------------------------
       Funções auxiliares de validação do modal
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

    // Limpa todos os campos e estados do modal
    function limparModal() {
        document.getElementById('nomePropriedade').value   = '';
        document.getElementById('buscaLocalizacao').value  = '';
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
       Busca de localização via API Open-Meteo Geocoding
       Documentação: https://open-meteo.com/en/docs/geocoding-api
       Endpoint: https://geocoding-api.open-meteo.com/v1/search
       Parâmetros: name (texto), count (quantidade), language (pt)
    -------------------------------------------------- */
    document.getElementById('buscaLocalizacao').addEventListener('input', function () {
        var termo = this.value.trim();

        // Limpa resultado anterior se o campo ficou vazio
        if (!termo) {
            esconderListaLocais();
            return;
        }

        // Debounce: aguarda 500ms após o usuário parar de digitar para fazer a requisição
        clearTimeout(timerBusca);
        timerBusca = setTimeout(function () {
            buscarLocalizacao(termo);
        }, 500);
    });

    function buscarLocalizacao(termo) {
        document.getElementById('spinnerBusca').classList.add('visivel');
        esconderListaLocais();

        $.ajax({
            url: 'https://geocoding-api.open-meteo.com/v1/search',
            method: 'GET',
            data: {
                name:     termo,
                count:    8,       // Máximo de resultados retornados
                language: 'pt',    // Resultados em português
                format:   'json'
            },
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

    // Monta a lista de resultados retornados pela API
    function renderizarListaLocais(resultados) {
        var lista = document.getElementById('listaLocais');
        lista.innerHTML = '';

        if (resultados.length === 0) {
            lista.innerHTML = '<div class="sem-resultados">Nenhum local encontrado para esta busca.</div>';
            lista.classList.add('visivel');
            return;
        }

        resultados.forEach(function (local) {
            /*
              Campos retornados pela API Open-Meteo:
              - local.name        ? nome da cidade/local
              - local.admin1      ? estado/região
              - local.country     ? país
              - local.latitude    ? latitude (usado para salvar no back)
              - local.longitude   ? longitude (usado para salvar no back)
            */
            var nomeExibido   = local.name;
            var detalheExibido = [local.admin1, local.country].filter(Boolean).join(', ');

            var item = document.createElement('div');
            item.className = 'item-local';
            item.innerHTML =
                '<span class="item-local-nome">' + nomeExibido + '</span>' +
                '<span class="item-local-detalhe">' + detalheExibido + '</span>';

            // Ao clicar no item, registra o local selecionado
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

    // Registra o local escolhido e exibe o card de confirmação
    function selecionarLocal(local) {
        localSelecionado = local;

        document.getElementById('localSelecionadoNome').textContent   = local.nome + (local.detalhe ? ', ' + local.detalhe : '');
        document.getElementById('localSelecionadoCoords').textContent  = 'Lat: ' + local.latitude + ' | Lon: ' + local.longitude;
        document.getElementById('localSelecionado').classList.add('visivel');

        // Limpa a lista e o campo de busca após seleção
        esconderListaLocais();
        document.getElementById('buscaLocalizacao').value = '';
        limparErroModal('localizacao-err');
    }

    // Botão de remover o local selecionado
    document.getElementById('btnRemoverLocal').addEventListener('click', function () {
        localSelecionado = null;
        document.getElementById('localSelecionado').classList.remove('visivel');
        document.getElementById('localSelecionadoNome').textContent   = '';
        document.getElementById('localSelecionadoCoords').textContent = '';
    });


    /* --------------------------------------------------
       Salvar propriedade
       Chama p_salvarPropriedade no Progress via $.ajax
       Envia: vnome, vlatitude, vlongitude, vid-usuario
       Retornos: OK | SEM_USUARIO | ERRO
    -------------------------------------------------- */
    document.getElementById('btnSalvarPropriedade').addEventListener('click', function () {
        var valido = true;
        var nome   = document.getElementById('nomePropriedade').value.trim();

        limparBannerModal();
        limparErroModal('nomePropriedade-err');
        limparErroModal('localizacao-err');

        if (!nome) {
            mostrarErroModal('nomePropriedade-err');
            valido = false;
        }

        if (!localSelecionado) {
            mostrarErroModal('localizacao-err');
            valido = false;
        }

        if (!valido) return;

        // Bloqueia o cadastro se não houver usuário logado no localStorage
        var vidUsuario = localStorage.getItem('agc_id');
        if (!vidUsuario) {
            mostrarBannerModal('Você precisa estar logado para cadastrar uma propriedade.');
            return;
        }

        var btn = document.getElementById('btnSalvarPropriedade');
        btn.classList.add('carregando');
        btn.disabled = true;

        var vaux  = window.location.href.indexOf('?') > -1 ? '&' : '?';
        var vdata = 'vnome='      + encodeURIComponent(nome)
                  + '&vlatitude='  + encodeURIComponent(localSelecionado.latitude)
                  + '&vlongitude=' + encodeURIComponent(localSelecionado.longitude)
                  + '&vidusuario=' + vidUsuario;

        $.ajax({
            type: 'POST',
            contentType: 'Content-type: text/plain; charset=iso-8859-1',
            beforeSend: function (jqXHR) {
                jqXHR.overrideMimeType('text/html;charset=iso-8859-1');
            },
            url: window.location.href + vaux + 'vpad_proc=p_salvarPropriedade',
            data: vdata,
            dataType: 'html',
            success: function (vresult) {
                btn.classList.remove('carregando');
                btn.disabled = false;

                if (vresult.trim() === 'OK') {
                    fecharModal();
                    adicionarLinhaTabela({
                        nome:       nome,
                        localizacao: localSelecionado.nome + (localSelecionado.detalhe ? ', ' + localSelecionado.detalhe : ''),
                        latitude:   localSelecionado.latitude,
                        longitude:  localSelecionado.longitude
                    });
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

    // Adiciona uma nova linha na tabela após cadastro
    function adicionarLinhaTabela(propriedade) {
        var tbody = document.getElementById('corpoTabela');

        var linha = document.createElement('tr');
        linha.innerHTML =
            '<td>' + propriedade.nome + '</td>' +
            '<td>' + propriedade.localizacao + '</td>' +
            '<td>' + propriedade.latitude + '</td>' +
            '<td>' + propriedade.longitude + '</td>' +
            '<td><a href="#" class="link-painel" ' +
                'data-nome="' + propriedade.nome + '" ' +
                'data-lat="'  + propriedade.latitude  + '" ' +
                'data-lon="'  + propriedade.longitude + '">Acessar painel</a></td>';

        tbody.appendChild(linha);

        // Ao clicar em "Acessar painel", salva dados no localStorage e redireciona
        linha.querySelector('.link-painel').addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.setItem('agc_painel_nome', this.getAttribute('data-nome'));
            localStorage.setItem('agc_painel_lat',  this.getAttribute('data-lat'));
            localStorage.setItem('agc_painel_lon',  this.getAttribute('data-lon'));
            window.location.href = 'wmadfgPainelAGC';
        });

        atualizarVisibilidadeTabela();
        return linha;
    }

    // Mostra ou esconde a mensagem de "nenhuma propriedade"
    function atualizarVisibilidadeTabela() {
        var linhas   = document.querySelectorAll('#corpoTabela tr');
        var visiveis = Array.from(linhas).filter(function (l) { return l.style.display !== 'none'; });
        document.getElementById('tabelaVazia').classList.toggle('visivel', visiveis.length === 0);
    }


    /* --------------------------------------------------
       Busca na tabela (filtro por nome ou localização)
    -------------------------------------------------- */
    document.getElementById('campoBusca').addEventListener('input', function () {
        var termo  = this.value.toLowerCase().trim();
        var linhas = document.querySelectorAll('#corpoTabela tr');

        linhas.forEach(function (linha) {
            var texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(termo) ? '' : 'none';
        });

        atualizarVisibilidadeTabela();
    });


    /* --------------------------------------------------
       Inicialização
    -------------------------------------------------- */

    // Exibe o e-mail do usuário logado na sidebar
    var agcEmail = localStorage.getItem('agc_email');
    if (agcEmail) {
        document.getElementById('nomeUsuario').textContent = agcEmail;
    }

    // Carrega as propriedades do usuário logado via p_carregarPropriedades
    function carregarPropriedades() {
        var vidUsuario = localStorage.getItem('agc_id');
        if (!vidUsuario) {
            atualizarVisibilidadeTabela();
            return;
        }

        var vaux  = window.location.href.indexOf('?') > -1 ? '&' : '?';
        var vdata = 'vidusuario=' + vidUsuario;

        $.ajax({
            type: 'POST',
            contentType: 'Content-type: text/plain; charset=iso-8859-1',
            beforeSend: function (jqXHR) {
                jqXHR.overrideMimeType('text/html;charset=iso-8859-1');
            },
            url: window.location.href + vaux + 'vpad_proc=p_carregarPropriedades',
            data: vdata,
            dataType: 'html',
            success: function (vresult) {
                var retorno = vresult.trim();
                if (retorno === 'VAZIO') {
                    atualizarVisibilidadeTabela();
                    return;
                }
                try {
                    var lista = JSON.parse(retorno);
                    lista.forEach(function (prop) {
                        var linha = adicionarLinhaTabela({
                            nome:        prop.nome,
                            localizacao: '',
                            latitude:    prop.latitude,
                            longitude:   prop.longitude
                        });

                        // Busca o nome da cidade via Nominatim (reverse geocoding)
                        (function (tr, lat, lon) {
                            $.ajax({
                                url: 'https://nominatim.openstreetmap.org/reverse',
                                method: 'GET',
                                data: { lat: lat, lon: lon, format: 'json' },
                                dataType: 'json',
                                success: function (geo) {
                                    var cidade = (geo.address && (geo.address.city || geo.address.town || geo.address.village)) || '';
                                    if (cidade && tr) {
                                        tr.cells[1].textContent = cidade;
                                    }
                                }
                            });
                        })(linha, prop.latitude, prop.longitude);
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

    // Logout ? limpa o localStorage e volta para o login
    document.getElementById('btnLogout').addEventListener('click', function () {
        localStorage.removeItem('agc_id');
        localStorage.removeItem('agc_email');
        window.location.href = 'wmadfgLoginAGC';
    });

});