/* ========================================
   AGROCLIMA - Histórico de Alertas (AC006) - JS principal
   ======================================== */

var agcEmail = localStorage.getItem('agc_email');
var agcId = localStorage.getItem('agc_id');

if (agcEmail) document.getElementById('nomeUsuario').textContent = agcEmail;

document.getElementById('btnLogout').addEventListener('click', function () {
    localStorage.removeItem('agc_id');
    localStorage.removeItem('agc_email');
    window.location.href = 'wmadfgLoginAGC';
});

/* --------------------------------------------------
   Estado
-------------------------------------------------- */
var todosRegistros = [];     /* Cache local de todos os registros vindos do banco */
var registrosFiltrados = []; /* Registros após aplicar busca e abas de filtro */
var filtroAtivo = 'TODOS';
var termoBusca = '';
var paginaAtual = 1;
var POR_PAGINA = 10;

/* --------------------------------------------------
   Utilitários
-------------------------------------------------- */
function formatarData(dataStr, hora) {
    if (!dataStr) return '?';
    var p = dataStr.split('-');
    return p[2] + '/' + p[1] + '/' + p[0] + ' ' + hora;
}

function iconePorTipo(tipo) {
    var icones = {
        CHUVA: '<svg viewBox="0 0 24 24"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>',
        VENTO: '<svg viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
        UMIDADE: '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'
    };
    return icones[tipo] || '';
}

function labelPorTipo(tipo) {
    return { CHUVA: 'Chuva', VENTO: 'Vento Forte', UMIDADE: 'Baixa Umidade' }[tipo] || tipo;
}

var ICONE_LIXEIRA =
    '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/>' +
    '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
    '<path d="M10 11v6"/><path d="M14 11v6"/>' +
    '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>';

/* --------------------------------------------------
   Parser do retorno Progress (chave:valor)
-------------------------------------------------- */
function parsearRetorno(texto) {
    var resultado = [];
    var inner = texto.trim();
    
    if (inner.charAt(0) === '[') inner = inner.substring(1);
    if (inner.charAt(inner.length - 1) === ']') inner = inner.substring(0, inner.length - 1);
    if (!inner) return resultado;

    /* Separa cada objeto do array bruto */
    var objetos = inner.split('},{');
    
    objetos.forEach(function (obj) {
        obj = obj.replace(/^\{/, '').replace(/\}$/, '');
        var item = {};
        var campos = ['id', 'tipo', 'descricao', 'data', 'hora', 'nomePropriedade'];
        
        campos.forEach(function (campo, i) {
            var chave = campo + ':';
            var pos = obj.indexOf(chave);
            if (pos === -1) return;
            
            var inicio = pos + chave.length;
            var fim = obj.length;
            
            /* Acha onde a próxima chave começa para fatiar o valor atual */
            for (var j = i + 1; j < campos.length; j++) {
                var posProx = obj.indexOf(',' + campos[j] + ':');
                if (posProx !== -1 && posProx < fim) fim = posProx;
            }
            item[campo] = obj.substring(inicio, fim).trim();
        });
        
        if (item.id) resultado.push(item);
    });
    return resultado;
}

/* --------------------------------------------------
   Carrega histórico do banco via Progress
-------------------------------------------------- */
function carregarHistorico() {
    if (!agcId) {
        mostrarEstado('estadoVazio');
        return;
    }

    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_carregarHistorico',
        data: 'vidusuario=' + agcId,
        dataType: 'html',
        success: function (vresult) {
            var retorno = vresult.trim();
            if (retorno === 'VAZIO') {
                todosRegistros = [];
                aplicarFiltros();
                return;
            }
            try {
                todosRegistros = parsearRetorno(retorno);
                aplicarFiltros();
            } catch (e) {
                todosRegistros = [];
                aplicarFiltros();
                console.log('Erro ao parsear histórico:', e);
            }
        },
        error: function () {
            mostrarEstado('estadoVazio');
        }
    });
}

/* --------------------------------------------------
   Aplica filtro de tipo + busca por texto
-------------------------------------------------- */
function aplicarFiltros() {
    registrosFiltrados = todosRegistros.filter(function (a) {
        var passaTipo = filtroAtivo === 'TODOS' || a.tipo === filtroAtivo;
        var termo = termoBusca.toLowerCase();
        
        /* Busca global no texto: valida se o termo existe na categoria, descrição ou nome da propriedade */
        var passaBusca = termo === ''
            || (a.tipo || '').toLowerCase().indexOf(termo) > -1
            || (a.descricao || '').toLowerCase().indexOf(termo) > -1
            || (a.nomePropriedade || '').toLowerCase().indexOf(termo) > -1
            || labelPorTipo(a.tipo).toLowerCase().indexOf(termo) > -1;
            
        return passaTipo && passaBusca;
    });

    atualizarBadge();
    paginaAtual = 1; /* Reset da paginação a cada nova busca */
    renderizarTabela();
}

function atualizarBadge() {
    document.getElementById('badgeTotal').textContent =
        todosRegistros.length + (todosRegistros.length === 1 ? ' registro' : ' registros');

    /* Habilita/desabilita botão Excluir Todos se a lista geral estiver vazia */
    var btnTodos = document.getElementById('btnExcluirTodos');
    if (btnTodos) btnTodos.disabled = todosRegistros.length === 0;
}

/* --------------------------------------------------
   Renderiza tabela com paginação
-------------------------------------------------- */
function renderizarTabela() {
    mostrarEstado(null);

    if (registrosFiltrados.length === 0) {
        mostrarEstado('estadoVazio');
        return;
    }

    /* Lógica de fatiamento do array baseado na página atual */
    var totalPags = Math.ceil(registrosFiltrados.length / POR_PAGINA);
    var inicio = (paginaAtual - 1) * POR_PAGINA;
    var fim = Math.min(inicio + POR_PAGINA, registrosFiltrados.length);
    var pagina = registrosFiltrados.slice(inicio, fim);

    var tbody = document.getElementById('corpoTabela');
    tbody.innerHTML = '';

    pagina.forEach(function (a) {
        var tr = document.createElement('tr');
        tr.setAttribute('data-id', a.id);
        tr.innerHTML =
            '<td><span class="hist-tipo-badge ' + a.tipo + '">'
            + iconePorTipo(a.tipo) + labelPorTipo(a.tipo)
            + '</span></td>'
            + '<td>' + (a.descricao || '?') + '</td>'
            + '<td class="hist-data">' + formatarData(a.data, a.hora) + '</td>'
            + '<td class="hist-prop">' + (a.nomePropriedade || '?') + '</td>'
            + '<td class="col-acao">'
            + '<button class="btn-excluir-linha" title="Excluir alerta" data-id="' + a.id + '">'
            + ICONE_LIXEIRA
            + '</button>'
            + '</td>';
        tbody.appendChild(tr);
    });

    document.getElementById('infoPaginacao').textContent =
        'Mostrando ' + (inicio + 1) + ' a ' + fim + ' de ' + registrosFiltrados.length + ' registros';

    renderizarPaginacao(totalPags);
    document.getElementById('wrapHistorico').style.display = '';

    /* Delega evento de clique para os botões de lixeira dinâmicos */
    tbody.querySelectorAll('.btn-excluir-linha').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var idAlerta = this.getAttribute('data-id');
            var tr = this.closest('tr');
            confirmar(
                'Excluir alerta',
                'Tem certeza que deseja excluir este alerta? Esta ação não pode ser desfeita.',
                function () { excluirAlerta(idAlerta, tr); }
            );
        });
    });
}

/* --------------------------------------------------
   Paginação
-------------------------------------------------- */
function renderizarPaginacao(totalPags) {
    var container = document.getElementById('containerPaginacao');
    container.innerHTML = '';
    if (totalPags <= 1) return;

    var btnAnterior = criarBtnPag('Anterior', paginaAtual === 1);
    btnAnterior.addEventListener('click', function () {
        if (paginaAtual > 1) { paginaAtual--; renderizarTabela(); }
    });
    container.appendChild(btnAnterior);

    calcularPaginas(paginaAtual, totalPags).forEach(function (p) {
        if (p === '...') {
            var span = document.createElement('span');
            span.className = 'hist-pag-reticencias';
            span.textContent = '...';
            container.appendChild(span);
        } else {
            var btn = criarBtnPag(p, false);
            if (p === paginaAtual) btn.classList.add('ativo');
            
            (function (num) {
                btn.addEventListener('click', function () {
                    paginaAtual = num;
                    renderizarTabela();
                });
            })(p);
            
            container.appendChild(btn);
        }
    });

    var btnProximo = criarBtnPag('Próximo', paginaAtual === totalPags);
    btnProximo.addEventListener('click', function () {
        if (paginaAtual < totalPags) { paginaAtual++; renderizarTabela(); }
    });
    container.appendChild(btnProximo);
}

function criarBtnPag(texto, desabilitado) {
    var btn = document.createElement('button');
    btn.className = 'hist-pag-btn';
    btn.textContent = texto;
    btn.disabled = desabilitado;
    return btn;
}

/* Gera os intervalos de páginas intercalando com "..." */
function calcularPaginas(atual, total) {
    if (total <= 7) {
        var arr = [];
        for (var i = 1; i <= total; i++) arr.push(i);
        return arr;
    }
    var paginas = [1];
    if (atual > 3) paginas.push('...');
    for (var p = Math.max(2, atual - 1); p <= Math.min(total - 1, atual + 1); p++) paginas.push(p);
    if (atual < total - 2) paginas.push('...');
    paginas.push(total);
    return paginas;
}

/* --------------------------------------------------
   Modal de confirmação reutilizável
-------------------------------------------------- */
function confirmar(titulo, mensagem, onConfirmar) {
    var anterior = document.getElementById('histModal');
    if (anterior) anterior.remove();

    var overlay = document.createElement('div');
    overlay.className = 'hist-modal-overlay';
    overlay.id = 'histModal';
    overlay.innerHTML =
        '<div class="hist-modal">'
        + '<div class="hist-modal-icone">'
        + '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/>'
        + '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'
        + '<path d="M10 11v6"/><path d="M14 11v6"/>'
        + '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
        + '</div>'
        + '<h3>' + titulo + '</h3>'
        + '<p>' + mensagem + '</p>'
        + '<div class="hist-modal-acoes">'
        + '<button class="hist-modal-cancelar" id="histModalCancelar">Cancelar</button>'
        + '<button class="hist-modal-confirmar" id="histModalConfirmar">Excluir</button>'
        + '</div>'
        + '</div>';

    document.body.appendChild(overlay);

    document.getElementById('histModalCancelar').addEventListener('click', function () {
        overlay.remove();
    });

    document.getElementById('histModalConfirmar').addEventListener('click', function () {
        overlay.remove();
        onConfirmar();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.remove();
    });
}

/* --------------------------------------------------
   Excluir alerta individual
-------------------------------------------------- */
function excluirAlerta(idAlerta, tr) {
    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_excluirAlerta',
        data: 'vidalerta=' + idAlerta,
        dataType: 'html',
        success: function (vresult) {
            if (vresult.trim() === 'OK') {
                tr.classList.add('hist-linha-removendo');
                
                setTimeout(function () {
                    /* Remove do cache local para re-renderizar sem bater no banco */
                    todosRegistros = todosRegistros.filter(function (a) { return a.id !== idAlerta; });
                    
                    /* Trata recuo de página caso delete o último item da última página */
                    var totalPagsNovo = Math.ceil(registrosFiltrados.filter(function (a) { return a.id !== idAlerta; }).length / POR_PAGINA);
                    if (paginaAtual > totalPagsNovo && paginaAtual > 1) paginaAtual--;
                    
                    aplicarFiltros();
                }, 300);
            } else {
                alert('Erro ao excluir o alerta. Tente novamente.');
            }
        },
        error: function () {
            alert('Erro de comunicação. Tente novamente.');
        }
    });
}

/* --------------------------------------------------
   Excluir todos os alertas do usuário
-------------------------------------------------- */
function excluirTodos() {
    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_excluirTodos',
        data: 'vidusuario=' + agcId,
        dataType: 'html',
        success: function (vresult) {
            if (vresult.trim() === 'OK') {
                todosRegistros = [];
                aplicarFiltros();
            } else {
                alert('Erro ao excluir os alertas. Tente novamente.');
            }
        },
        error: function () {
            alert('Erro de comunicação. Tente novamente.');
        }
    });
}

/* --------------------------------------------------
   Filtros por tipo
-------------------------------------------------- */
document.querySelectorAll('.filtro-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filtro-btn').forEach(function (b) { b.classList.remove('ativo'); });
        this.classList.add('ativo');
        filtroAtivo = this.getAttribute('data-filtro');
        aplicarFiltros();
    });
});

/* --------------------------------------------------
   Busca por texto (debounce 300ms)
-------------------------------------------------- */
var timerBusca;
document.getElementById('campoBusca').addEventListener('input', function () {
    var val = this.value;
    
    /* Evita engasgos na tela caso o usuário digite rápido demais */
    clearTimeout(timerBusca);
    timerBusca = setTimeout(function () {
        termoBusca = val;
        aplicarFiltros();
    }, 300);
});

/* --------------------------------------------------
   Botão "Excluir Todos" (Injetado via DOM)
-------------------------------------------------- */
var cabecalho = document.querySelector('.pagina-cabecalho');
if (cabecalho) {
    var btnTodos = document.createElement('button');
    btnTodos.id = 'btnExcluirTodos';
    btnTodos.className = 'btn-excluir-todos';
    btnTodos.disabled = true;
    btnTodos.innerHTML =
        '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/>'
        + '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'
        + '<path d="M10 11v6"/><path d="M14 11v6"/>'
        + '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>'
        + 'Excluir Todos';
        
    btnTodos.addEventListener('click', function () {
        confirmar(
            'Excluir todos os alertas',
            'Todos os alertas arquivados serão excluídos permanentemente. Esta ação não pode ser desfeita.',
            excluirTodos
        );
    });
    cabecalho.appendChild(btnTodos);
}

/* --------------------------------------------------
   Auxiliar: mostra/esconde estados
-------------------------------------------------- */
function mostrarEstado(id) {
    document.getElementById('estadoLoading').style.display = id === 'estadoLoading' ? '' : 'none';
    document.getElementById('estadoVazio').style.display = id === 'estadoVazio' ? '' : 'none';
    document.getElementById('wrapHistorico').style.display =
        (id === null && registrosFiltrados.length > 0) ? '' : 'none';
}

/* --------------------------------------------------
   Inicia a aplicação
-------------------------------------------------- */
carregarHistorico();
