/* ========================================
   AGROCLIMA - Tela de Alertas (AC004) - JS principal
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
var todosAlertas = [];     /* Cache local dos alertas ativos vindos do banco */
var filtroAtivo = 'TODOS'; /* Aba atual selecionada */

/* --------------------------------------------------
   Utilitários
-------------------------------------------------- */
function hojeString() {
    var d = new Date();
    return d.getFullYear() + '-'
        + String(d.getMonth() + 1).padStart(2, '0') + '-' 
        + String(d.getDate()).padStart(2, '0');
}

function horaAtual() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':'
        + String(d.getMinutes()).padStart(2, '0');
}

function formatarDataExibicao(dataStr, hora) {
    if (!dataStr) return '';
    var partes = dataStr.split('-');
    return partes[2] + '/' + partes[1] + '/' + partes[0] + ' ' + hora;
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

/* --------------------------------------------------
   Carrega propriedades e inicia a checagem
-------------------------------------------------- */
function iniciar() {
    if (!agcId) { mostrarEstado('estadoSemPropriedades'); return; }

    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

    /* Busca no banco as propriedades do usuário pra analisar o clima de cada uma */
    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_carregarPropriedades',
        data: 'vidusuario=' + agcId,
        dataType: 'html',
        success: function (vresult) {
            var retorno = vresult.trim();
            if (retorno === 'VAZIO') { mostrarEstado('estadoSemPropriedades'); return; }
            
            try {
                var propriedades = JSON.parse(retorno);
                verificarAlertas(propriedades);
            } catch (e) {
                mostrarEstado('estadoVazio');
                console.log('Erro ao carregar propriedades:', e);
            }
        },
        error: function () { mostrarEstado('estadoVazio'); }
    });
}

/* --------------------------------------------------
   Verifica condições climáticas (API Open-Meteo)
-------------------------------------------------- */
function verificarAlertas(propriedades) {
    if (propriedades.length === 0) { mostrarEstado('estadoSemPropriedades'); return; }

    var alertasGerados = [];
    var indice = 0;

    function processarProxima() {
        /* Condição de parada: terminou a fila de propriedades */
        if (indice >= propriedades.length) {
            if (alertasGerados.length === 0) carregarAlertas();
            else salvarAlertas(alertasGerados);
            return;
        }

        var prop = propriedades[indice];
        indice++;

        $.ajax({
            url: 'https://api.open-meteo.com/v1/forecast',
            method: 'GET',
            data: {
                latitude: prop.latitude,
                longitude: prop.longitude,
                hourly: 'relativehumidity_2m,windspeed_10m',
                daily: 'precipitation_sum',
                timezone: 'America/Sao_Paulo',
                forecast_days: 2
            },
            dataType: 'json',
            success: function (dados) {
                alertasGerados = alertasGerados.concat(analisarCondicoes(dados, prop));
            },
            complete: function () {
                processarProxima();
            }
        });
    }

    processarProxima();
}

/* Aplica os critérios na previsão recebida */
function analisarCondicoes(dados, prop) {
    var alertas = [];
    var hoje = hojeString();
    var hora = horaAtual();

    /* Alerta de chuva: Acumulado diário maior que 5mm */
    var chuva24h = dados.daily && dados.daily.precipitation_sum
        ? parseFloat(dados.daily.precipitation_sum[0]) || 0 : 0;

    if (chuva24h > 5) {
        alertas.push({
            tipo: 'CHUVA',
            descricao: 'Chuva prevista nas próximas 24 horas (' + chuva24h.toFixed(1) + 'mm). Evite realizar pulverizações.',
            data: hoje, hora: hora, idPropriedade: prop.id, nomePropriedade: prop.nome,
            lat: prop.latitude, lon: prop.longitude
        });
    }

    /* Alerta de vento: Rajadas maiores que 15km/h nas próximas 24h */
    if (dados.hourly && dados.hourly.windspeed_10m) {
        var ventoMax = Math.max.apply(null, dados.hourly.windspeed_10m.slice(0, 24));
        if (ventoMax > 15) {
            alertas.push({
                tipo: 'VENTO',
                descricao: 'Vento forte detectado (' + Math.round(ventoMax) + ' km/h). Alto risco de deriva durante pulverização.',
                data: hoje, hora: hora, idPropriedade: prop.id, nomePropriedade: prop.nome,
                lat: prop.latitude, lon: prop.longitude
            });
        }
    }

    /* Alerta de umidade: Picos menores que 40% nas próximas 24h */
    if (dados.hourly && dados.hourly.relativehumidity_2m) {
        var umidMin = Math.min.apply(null, dados.hourly.relativehumidity_2m.slice(0, 24));
        if (umidMin < 40) {
            alertas.push({
                tipo: 'UMIDADE',
                descricao: 'Umidade baixa detectada (' + Math.round(umidMin) + '%). Risco de evaporação durante aplicação agrícola.',
                data: hoje, hora: hora, idPropriedade: prop.id, nomePropriedade: prop.nome,
                lat: prop.latitude, lon: prop.longitude
            });
        }
    }

    return alertas;
}

/* Grava os alertas novos no banco do Progress */
function salvarAlertas(alertas) {
    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';
    
    /* Filtra as chaves para enviar só o essencial */
    var vjson = JSON.stringify(alertas.map(function (a) {
        return { tipo: a.tipo, descricao: a.descricao, data: a.data, hora: a.hora, idPropriedade: a.idPropriedade };
    }));

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_salvarAlertas',
        data: 'vidusuario=' + agcId + '&valertas=' + encodeURIComponent(vjson),
        dataType: 'html',
        success: function () { carregarAlertas(); },
        error: function () { carregarAlertas(); }
    });
}

/* --------------------------------------------------
   Carrega alertas não lidos do banco
-------------------------------------------------- */
function carregarAlertas() {
    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_carregarAlertas',
        data: 'vidusuario=' + agcId,
        dataType: 'html',
        success: function (vresult) {
            var retorno = vresult.trim();
            if (retorno === 'VAZIO') { todosAlertas = []; renderizarAlertas(); return; }
            
            try {
                todosAlertas = JSON.parse(retorno);
                /* Força o parse para inteiro para não bugar a exclusão depois */
                todosAlertas.forEach(function (a) { a.id = parseInt(a.id, 10); });
                renderizarAlertas(); 
            } catch (e) {
                todosAlertas = [];
                renderizarAlertas();
                console.log('Erro ao parsear alertas do banco:', e);
            }
        },
        error: function () { todosAlertas = []; renderizarAlertas(); }
    });
}

/* --------------------------------------------------
   Renderização e DOM
-------------------------------------------------- */
function renderizarAlertas() {
    var alertasFiltrados = filtroAtivo === 'TODOS'
        ? todosAlertas
        : todosAlertas.filter(function (a) { return a.tipo === filtroAtivo; });

    document.getElementById('badgeTotal').textContent =
        todosAlertas.length + (todosAlertas.length === 1 ? ' alerta' : ' alertas');

    mostrarEstado(null); 

    if (alertasFiltrados.length === 0) { mostrarEstado('estadoVazio'); return; }

    /* Agrupa os alertas pelo nome da propriedade para criar blocos separados */
    var grupos = {};
    alertasFiltrados.forEach(function (a) {
        var chave = a.nomePropriedade || 'Propriedade ' + a.idPropriedade;
        if (!grupos[chave]) grupos[chave] = [];
        grupos[chave].push(a);
    });

    var container = document.getElementById('containerAlertas');
    container.innerHTML = ''; 

    Object.keys(grupos).forEach(function (nomeGrupo) {
        var grupoEl = document.createElement('div');
        grupoEl.className = 'grupo-propriedade';

        var tituloEl = document.createElement('div');
        tituloEl.className = 'grupo-titulo';
        tituloEl.innerHTML =
            '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
            nomeGrupo;
        grupoEl.appendChild(tituloEl);

        grupos[nomeGrupo].forEach(function (alerta) {
            grupoEl.appendChild(criarCardAlerta(alerta));
        });

        container.appendChild(grupoEl);
    });

    document.getElementById('listaAlertas').style.display = '';
}

function criarCardAlerta(alerta) {
    var card = document.createElement('div');
    card.className = 'alerta-card ' + alerta.tipo; 
    card.setAttribute('data-id', alerta.id);

    card.innerHTML =
        '<div class="alerta-icone">' + iconePorTipo(alerta.tipo) + '</div>' +
        '<div class="alerta-corpo">' +
        '<div class="alerta-meta">' +
        '<span class="alerta-badge">' + labelPorTipo(alerta.tipo) + '</span>' +
        '<span class="alerta-data">' + formatarDataExibicao(alerta.data, alerta.hora) + '</span>' +
        '<span class="alerta-propriedade">' + (alerta.nomePropriedade || '') + '</span>' +
        '</div>' +
        '<div class="alerta-descricao">' + alerta.descricao + '</div>' +
        '</div>' +
        '<div class="alerta-acoes">' +
        '<button class="btn-ver-painel" ' +
        'data-lat="' + alerta.lat + '" ' +
        'data-lon="' + alerta.lon + '" ' +
        'data-nome="' + (alerta.nomePropriedade || '') + '" ' +
        'data-local="' + (alerta.localizacao || '') + '">' +
        '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
        'Ver painel' +
        '</button>' +
        '<button class="btn-arquivar" data-id="' + alerta.id + '">' +
        '<svg viewBox="0 0 24 24"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>' +
        'Arquivar' +
        '</button>' +
        '</div>';

    card.querySelector('.btn-ver-painel').addEventListener('click', function () {
        localStorage.setItem('agc_painel_nome', this.getAttribute('data-nome'));
        localStorage.setItem('agc_painel_local', this.getAttribute('data-local'));
        localStorage.setItem('agc_painel_lat', this.getAttribute('data-lat'));
        localStorage.setItem('agc_painel_lon', this.getAttribute('data-lon'));
        window.location.href = 'wmadfgPainelAGC';
    });

    card.querySelector('.btn-arquivar').addEventListener('click', function () {
        arquivarAlerta(alerta.id, card);
    });

    return card;
}

/* --------------------------------------------------
   Ações com o Banco de Dados
-------------------------------------------------- */
function arquivarAlerta(idAlerta, cardEl) {
    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_arquivarAlerta',
        data: 'vidalerta=' + idAlerta,
        dataType: 'html',
        success: function (vresult) {
            if (vresult.trim() === 'OK') {
                todosAlertas = todosAlertas.filter(function (a) { return a.id !== idAlerta; });
                
                cardEl.style.transition = 'opacity .25s';
                cardEl.style.opacity = '0';
                setTimeout(function () { cardEl.remove(); renderizarAlertas(); }, 250);
            }
        }
    });
}

document.getElementById('btnArquivarTodos').addEventListener('click', function () {
    /* Segue o filtro selecionado para arquivar apenas o que está aparecendo */
    var visiveis = filtroAtivo === 'TODOS'
        ? todosAlertas.slice()
        : todosAlertas.filter(function (a) { return a.tipo === filtroAtivo; });

    if (visiveis.length === 0) return;

    var vaux = window.location.href.indexOf('?') > -1 ? '&' : '?';
    var ids = visiveis.map(function (a) { return a.id; }).join(',');

    $.ajax({
        type: 'POST',
        contentType: 'Content-type: text/plain; charset=UTF-8',
        beforeSend: function (jqXHR) { jqXHR.overrideMimeType('text/html;charset=UTF-8'); },
        url: window.location.href + vaux + 'vpad_proc=p_arquivarVarios',
        data: 'vids=' + encodeURIComponent(ids),
        dataType: 'html',
        success: function () {
            var idsArr = visiveis.map(function (a) { return a.id; });
            todosAlertas = todosAlertas.filter(function (a) { return idsArr.indexOf(a.id) === -1; });
            
            renderizarAlertas(); 
        }
    });
});

/* --------------------------------------------------
   Filtros e Controles de Visualização
-------------------------------------------------- */
document.querySelectorAll('.filtro-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.filtro-btn').forEach(function (b) { b.classList.remove('ativo'); });
        this.classList.add('ativo');
        
        filtroAtivo = this.getAttribute('data-filtro');
        renderizarAlertas();
    });
});

function mostrarEstado(id) {
    ['estadoLoading', 'estadoVazio', 'estadoSemPropriedades'].forEach(function (elId) {
        document.getElementById(elId).style.display = elId === id ? '' : 'none';
    });
    
    document.getElementById('listaAlertas').style.display =
        id === null && todosAlertas.length > 0 ? '' : 'none';
}

/* --------------------------------------------------
   Inicia a aplicação
-------------------------------------------------- */
iniciar();
