/* ========================================
   AGROCLIMA - Tela de Propriedades
   JS principal
   ======================================== */

   var localSelecionado = null; // Armazena o local escolhido pelo usuário na busca
   var timerBusca = null;       // Usado para o debounce (evitar requisições a cada letra digitada)
   
   /* Ícone SVG da lixeira armazenado em string */
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
       limparModal(); // Sempre limpa os dados antigos ao abrir para um novo cadastro
   }
   
   function fecharModal() {
       document.getElementById('modalFundo').classList.remove('visivel');
   }
   
   // Vincula os eventos de clique aos botões do modal
   document.getElementById('btnAbrirModal').addEventListener('click', abrirModal);
   document.getElementById('btnFecharModal').addEventListener('click', fecharModal);
   document.getElementById('btnCancelarModal').addEventListener('click', fecharModal);
   
   // Fecha o modal se o usuário clicar fora da caixinha
   document.getElementById('modalFundo').addEventListener('click', function (e) {
       if (e.target === this) fecharModal();
   });
   
   /* --------------------------------------------------
      Validação do modal
   -------------------------------------------------- */
   // Exibe mensagens de erro específicas para cada campo
   function mostrarErroModal(idErro, mensagem) {
       var elErro = document.getElementById(idErro);
       var idCampo = idErro.replace('-err', ''); // Descobre o ID do input baseado no ID do erro
       if (mensagem) elErro.textContent = mensagem;
       elErro.classList.add('visivel');
       var campo = document.getElementById(idCampo);
       if (campo) campo.classList.add('erro'); // Adiciona borda vermelha ao input
   }
   
   // Remove os alertas de erro visualmente
   function limparErroModal(idErro) {
       document.getElementById(idErro).classList.remove('visivel');
       var idCampo = idErro.replace('-err', '');
       var campo = document.getElementById(idCampo);
       if (campo) campo.classList.remove('erro');
   }
   
   // Exibe um banner de aviso genérico no topo do modal
   function mostrarBannerModal(mensagem) {
       document.getElementById('bannerModal-msg').textContent = mensagem;
       document.getElementById('bannerModal').classList.add('visivel');
   }
   
   function limparBannerModal() {
       document.getElementById('bannerModal').classList.remove('visivel');
   }
   
   // Reseta todo o estado do modal (inputs, variáveis e mensagens)
   function limparModal() {
       document.getElementById('nomePropriedade').value = '';
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
   // Evento disparado toda vez que o usuário digita no campo de localização
   document.getElementById('buscaLocalizacao').addEventListener('input', function () {
       var termo = this.value.trim();
       if (!termo) { esconderListaLocais(); return; }
       
       // Debounce: cancela o timer anterior e inicia um novo de 500ms
       // Evita sobrecarregar a API enquanto o usuário ainda está digitando
       clearTimeout(timerBusca);
       timerBusca = setTimeout(function () { buscarLocalizacao(termo); }, 500);
   });
   
   function buscarLocalizacao(termo) {
       document.getElementById('spinnerBusca').classList.add('visivel');
       esconderListaLocais();
   
       // Requisição para a API Open-Meteo para buscar cidades/locais
       $.ajax({
           url: 'https://geocoding-api.open-meteo.com/v1/search',
           method: 'GET',
           data: { name: termo, count: 8, language: 'pt', format: 'json' },
           success: function (resposta) {
               document.getElementById('spinnerBusca').classList.remove('visivel');
               renderizarListaLocais(resposta.results || []); // Se não houver results, passa array vazio
           },
           error: function () {
               document.getElementById('spinnerBusca').classList.remove('visivel');
               mostrarBannerModal('Erro ao buscar localização. Verifique sua conexão e tente novamente.');
           }
       });
   }
   
   // Monta o HTML da lista com os resultados da API
   function renderizarListaLocais(resultados) {
       var lista = document.getElementById('listaLocais');
       lista.innerHTML = '';
   
       if (resultados.length === 0) {
           lista.innerHTML = '<div class="sem-resultados">Nenhum local encontrado para esta busca.</div>';
           lista.classList.add('visivel');
           return;
       }
   
       resultados.forEach(function (local) {
           var nomeExibido = local.name;
           // Junta estado e país, ignorando valores nulos
           var detalheExibido = [local.admin1, local.country].filter(Boolean).join(', ');
   
           var item = document.createElement('div');
           item.className = 'item-local';
           item.innerHTML =
               '<span class="item-local-nome">' + nomeExibido + '</span>' +
               '<span class="item-local-detalhe">' + detalheExibido + '</span>';
   
           // Quando o usuário clica em um item da lista, salva os dados
           item.addEventListener('click', function () {
               selecionarLocal({
                   nome: nomeExibido,
                   detalhe: detalheExibido,
                   latitude: local.latitude,
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
   
   // Fixa o local escolhido na interface e guarda as coordenadas
   function selecionarLocal(local) {
       localSelecionado = local;
       document.getElementById('localSelecionadoNome').textContent = local.nome + (local.detalhe ? ', ' + local.detalhe : '');
       document.getElementById('localSelecionadoCoords').textContent = 'Lat: ' + local.latitude + ' | Lon: ' + local.longitude;
       
       // Mostra o card do local selecionado e esconde o input/lista
       document.getElementById('localSelecionado').classList.add('visivel');
       esconderListaLocais();
       document.getElementById('buscaLocalizacao').value = '';
       limparErroModal('localizacao-err');
   }
   
   // Permite ao usuário apagar o local escolhido e buscar de novo
   document.getElementById('btnRemoverLocal').addEventListener('click', function () {
       localSelecionado = null;
       document.getElementById('localSelecionado').classList.remove('visivel');
       document.getElementById('localSelecionadoNome').textContent = '';
       document.getElementById('localSelecionadoCoords').textContent = '';
   });
   
   /* --------------------------------------------------
      Salvar propriedade
   -------------------------------------------------- */
   document.getElementById('btnSalvarPropriedade').addEventListener('click', function () {
       var valido = true;
       var nome = document.getElementById('nomePropriedade').value.trim();
   
       // Limpa validações anteriores
       limparBannerModal();
       limparErroModal('nomePropriedade-err');
       limparErroModal('localizacao-err');
   
       // Validações de campos obrigatórios
       if (!nome) { mostrarErroModal('nomePropriedade-err'); valido = false; }
       if (!localSelecionado) { mostrarErroModal('localizacao-err'); valido = false; }
       if (!valido) return;
   
       // Pega o ID do usuário da sessão do navegador
       var vidUsuario = localStorage.getItem('agc_id');
       if (!vidUsuario) {
           mostrarBannerModal('Você precisa estar logado para cadastrar uma propriedade.');
           return;
       }
   
       // Feedback visual: bloqueia o botão e mostra um "loading"
       var btn = document.getElementById('btnSalvarPropriedade');
       btn.classList.add('carregando');
       btn.disabled = true;
   
       var localizacaoStr = localSelecionado.nome + (localSelecionado.detalhe ? ', ' + localSelecionado.detalhe : '');
   
       // Monta a string de dados que será enviada pro progress
       var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';
       var vdata = 'vnome=' + encodeURIComponent(nome)
           + '&vlatitude=' + encodeURIComponent(localSelecionado.latitude)
           + '&vlongitude=' + encodeURIComponent(localSelecionado.longitude)
           + '&vlocalizacao=' + encodeURIComponent(localizacaoStr)
           + '&vidusuario=' + vidUsuario;
   
       // Ajax pra rodar a procedure p_salvarPropriedade no progress
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
   
               // Tratamento do retorno do Progress
               if (vresult.trim() === 'OK') {
                   fecharModal();
                   document.getElementById('corpoTabela').innerHTML = ''; // Limpa a tabela atual
                   carregarPropriedades();                                // Recarrega a lista do banco
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
   // Cria uma nova linha <tr> na tabela para cada propriedade retornada do banco
   function adicionarLinhaTabela(propriedade) {
       var tbody = document.getElementById('corpoTabela');
       var linha = document.createElement('tr');
       linha.setAttribute('data-id', propriedade.id);
       
       // Monta o HTML interno da linha
       linha.innerHTML =
           '<td>' + propriedade.nome + '</td>' +
           '<td>' + (propriedade.localizacao || '') + '</td>' +
           '<td>' + propriedade.latitude + '</td>' +
           '<td>' + propriedade.longitude + '</td>' +
           '<td style="display:flex;gap:8px;align-items:center;">' +
           '<a href="#" class="link-painel" ' +
           'data-nome="' + propriedade.nome + '" ' +
           'data-local="' + (propriedade.localizacao || '') + '" ' +
           'data-lat="' + propriedade.latitude + '" ' +
           'data-lon="' + propriedade.longitude + '">Acessar painel</a>' +
           '<button class="btn-excluir-linha btn-excluir-prop" title="Excluir propriedade" data-id="' + propriedade.id + '">' +
           ICONE_LIXEIRA +
           '</button>' +
           '</td>';
   
       tbody.appendChild(linha);
   
       // Evento do botão "Acessar painel": Salva os dados no localStorage e redireciona a página
       linha.querySelector('.link-painel').addEventListener('click', function (e) {
           e.preventDefault();
           localStorage.setItem('agc_painel_nome', this.getAttribute('data-nome'));
           localStorage.setItem('agc_painel_local', this.getAttribute('data-local'));
           localStorage.setItem('agc_painel_lat', this.getAttribute('data-lat'));
           localStorage.setItem('agc_painel_lon', this.getAttribute('data-lon'));
           window.location.href = 'wmadfgPainelAGC';
       });
   
       // Evento do botão de lixeira: Chama a confirmação antes de excluir
       linha.querySelector('.btn-excluir-prop').addEventListener('click', function () {
           var idProp = this.getAttribute('data-id');
           var tr = this.closest('tr');
           confirmar(
               'Excluir propriedade',
               'Todos os alertas vinculados a esta propriedade também serão excluídos. Deseja continuar?',
               function () { excluirPropriedade(idProp, tr); } // Callback executado se o usuário confirmar
           );
       });
   
       atualizarVisibilidadeTabela();
       return linha;
   }
   
   // Verifica se há linhas visíveis na tabela. Se não, exibe a mensagem de "tabelaVazia"
   function atualizarVisibilidadeTabela() {
       var linhas = document.querySelectorAll('#corpoTabela tr');
       var visiveis = Array.from(linhas).filter(function (l) { return l.style.display !== 'none'; });
       document.getElementById('tabelaVazia').classList.toggle('visivel', visiveis.length === 0);
   }
   
   /* --------------------------------------------------
      Excluir propriedade
   -------------------------------------------------- */
   function excluirPropriedade(idProp, tr) {
       var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';
   
       // Ajax pra procedure p_excluirPropriedade do progress
       $.ajax({
           type: 'POST',
           contentType: 'Content-type: text/plain; charset=UTF-8',
           beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
           url: window.location.href + vaux + 'vpad_proc=p_excluirPropriedade',
           data: 'vidpropriedade=' + idProp,
           dataType: 'html',
           success: function (vresult) {
               if (vresult.trim() === 'OK') {
                   // Faz a linha sumir suavemente antes de remover do DOM
                   tr.style.transition = 'opacity .25s';
                   tr.style.opacity = '0';
                   setTimeout(function () {
                       tr.remove();
                       atualizarVisibilidadeTabela(); // Atualiza a mensagem de tabela vazia, se necessário
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
   
   /* ----------------------------------
      Modal de confirmação genérico
   ---------------------------------- */
   // Cria um modal na tela dinamicamente
   function confirmar(titulo, mensagem, onConfirmar) {
       var anterior = document.getElementById('propModal');
       if (anterior) anterior.remove(); // Garante que não duplique modais
   
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
   
       // Eventos dos botões do modal de confirmação
       document.getElementById('propModalCancelar').addEventListener('click', function () { overlay.remove(); });
       document.getElementById('propModalConfirmar').addEventListener('click', function () { overlay.remove(); onConfirmar(); });
       overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
   }
   
   /* ---------------------------
      Busca na tabela
   --------------------------- */
   // Filtra as linhas da tabela em tempo real conforme o usuário digita
   document.getElementById('campoBusca').addEventListener('input', function () {
       var termo = this.value.toLowerCase().trim();
       var linhas = document.querySelectorAll('#corpoTabela tr');
       
       linhas.forEach(function (linha) {
           // Se a linha tiver o termo digitado, mostra, se não, oculta
           linha.style.display = linha.textContent.toLowerCase().includes(termo) ? '' : 'none';
       });
       atualizarVisibilidadeTabela(); // Revalida se deve mostrar a mensagem de "Tabela Vazia"
   });
   
   /* -----------------------
      Inicialização
   ----------------------- */
   // Recupera o email salvo no login e exibe na tela
   var agcEmail = localStorage.getItem('agc_email');
   if (agcEmail) document.getElementById('nomeUsuario').textContent = agcEmail;
   
   // Função chamada ao carregar a página para popular a tabela
   function carregarPropriedades() {
       var vidUsuario = localStorage.getItem('agc_id');
       if (!vidUsuario) { atualizarVisibilidadeTabela(); return; } // Aborta se não houver usuário logado
   
       var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';
   
       // Chama a procedure p_carregarPropriedades do progress
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
               
               // Tenta converter o JSON string retornado pelo Progress em um array de objetos
               try {
                   var lista = JSON.parse(retorno);
                   // Itera criando as linhas da tabela
                   lista.forEach(function (prop) {
                       adicionarLinhaTabela({
                           id: prop.id,
                           nome: prop.nome,
                           localizacao: prop.localizacao,
                           latitude: prop.latitude,
                           longitude: prop.longitude
                       });
                   });
               } catch (e) {
                   console.log('Erro ao fazer parse do JSON das propriedades:', e);
               }
               atualizarVisibilidadeTabela();
           },
           error: function (verror) {
               console.log('Erro na requisição ao carregar propriedades:', verror);
               atualizarVisibilidadeTabela();
           }
       });
   }
   
   // Inicia o processo de carregamento automaticamente ao ler o script
   carregarPropriedades();
   
   // Redirecionamento da barra de navegação para a tela de Alertas
   document.getElementById('nav-alertas').addEventListener('click', function (e) {
       e.preventDefault();
       window.location.href = 'wmadfgAlertasAGC';
   });
   
   // Logout
   document.getElementById('btnLogout').addEventListener('click', function () {
       // Limpa a sessão local e manda de volta pra tela de login
       localStorage.removeItem('agc_id');
       localStorage.removeItem('agc_email');
       window.location.href = 'wmadfgLoginAGC';
   });
