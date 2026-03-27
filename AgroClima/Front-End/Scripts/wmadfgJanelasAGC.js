/* ========================================
   AGROCLIMA - Janelas Operacionais (AC005)
   JS principal
   ======================================== */

   $(document).ready(function () {

    /* --------------------------------------------------
       Propriedade selecionada (vinda do localStorage)
    -------------------------------------------------- */
    var propriedade = {
        nome:      localStorage.getItem('agc_painel_nome')  || 'Propriedade',
        local:     localStorage.getItem('agc_painel_local') || '',
        latitude:  parseFloat(localStorage.getItem('agc_painel_lat'))  || 0,
        longitude: parseFloat(localStorage.getItem('agc_painel_lon'))  || 0
    };

    /* --------------------------------------------------
       Header
    -------------------------------------------------- */
    document.getElementById('headerNome').textContent = propriedade.nome;

    if (propriedade.local) {
        document.getElementById('headerLocalTxt').textContent = propriedade.local;
    }

    document.getElementById('btnVoltar').addEventListener('click', function () {
        window.location.href = 'wmadfgPropriedadesAGC';
    });

    /* --------------------------------------------------
       Estado do período selecionado
    -------------------------------------------------- */
    var periodoAtivo = '24h';

    /* --------------------------------------------------
       Nomes dos dias da semana
    -------------------------------------------------- */
    var DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    var MESES       = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

    /* --------------------------------------------------
       Busca dados da Open-Meteo e processa
    -------------------------------------------------- */
    function carregarDados() {
        $.ajax({
            url: 'https://api.open-meteo.com/v1/forecast',
            method: 'GET',
            data: {
                latitude:      propriedade.latitude,
                longitude:     propriedade.longitude,
                hourly:        'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
                daily:         'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,wind_speed_10m_mean,relative_humidity_2m_mean',
                timezone:      'America/Sao_Paulo',
                forecast_days: 8
            },
            dataType: 'json',
            success: function (dados) {
                processarDados(dados);
            },
            error: function () {
                document.getElementById('estadoLoading').innerHTML =
                    '<p style="color:#E53E3E">Erro ao buscar dados meteorológicos. Tente novamente.</p>';
            }
        });
    }

    /* --------------------------------------------------
       Processa dados e renderiza os 3 blocos
    -------------------------------------------------- */
    function processarDados(dados) {
        var horario  = dados.hourly;
        var diario   = dados.daily;
        var agora    = new Date();
        var horaAtual = agora.getHours();

        var idxAtual = horaAtual;

        var horas24 = [];
        for (var i = 0; i < 24; i++) {
            var idx = idxAtual + i;
            if (idx >= horario.time.length) break;
            horas24.push({
                idx:   idx,
                label: formatarHora(horario.time[idx]),
                temp:  horario.temperature_2m[idx],
                umid:  horario.relative_humidity_2m[idx],
                chuva: horario.precipitation[idx],
                vento: horario.wind_speed_10m[idx],
                atual: i === 0
            });
        }

        var dias7 = [];
        for (var d = 0; d < 7; d++) {
            if (d >= diario.time.length) break;
            dias7.push({
                data:       diario.time[d],
                tempMax:    diario.temperature_2m_max[d],
                tempMin:    diario.temperature_2m_min[d],
                chuva:      diario.precipitation_sum[d],
                ventoMax:   diario.wind_speed_10m_max[d],
                ventoMedio: diario.wind_speed_10m_mean ? diario.wind_speed_10m_mean[d] : diario.wind_speed_10m_max[d] * 0.6,
                umidMedia:  diario.relative_humidity_2m_mean[d]
            });
        }

        renderizarBloco('pulv',  horas24, dias7, avaliarPulv,  indicadoresPulv);
        renderizarBloco('plant', horas24, dias7, avaliarPlant, indicadoresPlant);
        renderizarBloco('colh',  horas24, dias7, avaliarColh,  indicadoresColh);

        document.getElementById('estadoLoading').style.display   = 'none';
        document.getElementById('conteudoJanelas').style.display = '';

        document.getElementById('aba24h').addEventListener('click', function () {
            periodoAtivo = '24h';
            this.classList.add('ativo');
            document.getElementById('aba7d').classList.remove('ativo');
            alternarPeriodo('24h');
        });

        document.getElementById('aba7d').addEventListener('click', function () {
            periodoAtivo = '7d';
            this.classList.add('ativo');
            document.getElementById('aba24h').classList.remove('ativo');
            alternarPeriodo('7d');
        });
    }

    function alternarPeriodo(periodo) {
        var sufixos = ['Pulv', 'Plant', 'Colh'];
        sufixos.forEach(function (s) {
            document.getElementById('janelas' + s + '24h').style.display = periodo === '24h' ? '' : 'none';
            document.getElementById('janelas' + s + '7d').style.display  = periodo === '7d'  ? '' : 'none';
        });
    }

    function renderizarBloco(id, horas24, dias7, fnAvaliarHora, fnIndicadores) {
        var idCap = id.charAt(0).toUpperCase() + id.slice(1);

        var contagem = { favoravel: 0, atencao: 0, desfavoravel: 0 };
        for (var i = 0; i < Math.min(6, horas24.length); i++) {
            contagem[fnAvaliarHora(horas24[i])]++;
        }
        var statusGeral = contagem.desfavoravel >= 3 ? 'desfavoravel'
                        : contagem.favoravel    >= 3 ? 'favoravel'
                        : 'atencao';

        var badge = document.getElementById('status' + idCap);
        badge.textContent = labelStatus(statusGeral);
        badge.className   = 'jan-status-badge ' + statusGeral;

        document.getElementById('indic' + idCap).innerHTML    = fnIndicadores(horas24[0]);
        document.getElementById('janelas' + idCap + '24h').innerHTML = renderTimeline(horas24, fnAvaliarHora);
        document.getElementById('janelas' + idCap + '7d').innerHTML  = renderCalendario(dias7, fnAvaliarHora);

        document.getElementById('reco' + idCap).innerHTML =
            '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
            gerarRecomendacao(id, statusGeral, horas24, dias7, fnAvaliarHora);
    }

    function renderTimeline(horas24, fnAvaliar) {
        var html = '<div class="jan-timeline-titulo">Condição hora a hora</div><div class="jan-timeline">';
        var primeiraFav = -1, ultimaFav = -1;

        horas24.forEach(function (h, i) {
            var status = fnAvaliar(h);
            if (status === 'favoravel') {
                if (primeiraFav === -1) primeiraFav = i;
                ultimaFav = i;
            }
            html += '<div class="jan-hora' + (h.atual ? ' atual' : '') + '">'
                  +   '<div class="jan-hora-barra ' + status + '">' + iconeStatus(status) + '</div>'
                  +   '<span class="jan-hora-label">' + h.label + '</span>'
                  + '</div>';
        });

        html += '</div>';
        html += '<div class="jan-timeline-legenda">'
              + '<span class="jan-legenda-item"><span class="jan-legenda-dot favoravel"></span>Favorável</span>'
              + '<span class="jan-legenda-item"><span class="jan-legenda-dot atencao"></span>Atenção</span>'
              + '<span class="jan-legenda-item"><span class="jan-legenda-dot desfavoravel"></span>Desfavorável</span>'
              + '</div>';

        html += primeiraFav !== -1
            ? '<div class="jan-janela-resumo">Janela favorável: <strong>' + horas24[primeiraFav].label + 'h / ' + horas24[ultimaFav].label + 'h</strong></div>'
            : '<div class="jan-janela-resumo">Nenhuma janela favorável nas próximas 24h.</div>';

        return html;
    }

    function renderCalendario(dias7, fnAvaliarHora) {
        var html = '<div class="jan-timeline-titulo">Previsão para os próximos 7 dias</div><div class="jan-calendario">';

        dias7.forEach(function (dia, i) {
            var hSim   = { temp: (dia.tempMax + dia.tempMin) / 2, umid: dia.umidMedia, chuva: dia.chuva / 24, vento: dia.ventoMedio };
            var status = fnAvaliarHora(hSim);
            var d      = new Date(dia.data + 'T12:00:00');
            var diaSem = DIAS_SEMANA[d.getDay()];
            var diaNum = d.getDate();
            var mes    = MESES[d.getMonth()];

            html += '<div class="jan-dia-card ' + status + '">'
                  +   '<div class="jan-dia-semana">' + (i === 0 ? 'Hoje' : diaSem) + '</div>'
                  +   '<div class="jan-dia-num">' + diaNum + ' ' + mes + '</div>'
                  +   '<div class="jan-dia-status-icone">' + iconeStatus(status) + '</div>'
                  +   '<div class="jan-dia-detalhe">'
                  +     Math.round(dia.tempMin) + '/' + Math.round(dia.tempMax) + '°C<br>'
                  +     Math.round(dia.umidMedia) + '% umid<br>'
                  +     dia.chuva.toFixed(1) + 'mm chuva'
                  +   '</div>'
                  + '</div>';
        });

        html += '</div>';
        return html;
    }

    /* --------------------------------------------------
       Regras de avaliação
    -------------------------------------------------- */
    function avaliarPulv(h) {
        if (h.vento > 15 || h.umid < 40 || h.chuva > 0.2 || h.temp > 32) return 'desfavoravel';
        if (h.vento >= 3 && h.vento <= 10 && h.umid >= 50 && h.chuva < 0.05 && h.temp < 30) return 'favoravel';
        return 'atencao';
    }

    function indicadoresPulv(h) {
        return montarIndicadores([
            { label: 'Vento',       icone: icoVento(),  valor: Math.round(h.vento)  + ' km/h', aval: h.vento > 15 ? 'ruim' : (h.vento >= 3 && h.vento <= 10 ? 'ok' : 'atencao') },
            { label: 'Umidade',     icone: icoUmid(),   valor: Math.round(h.umid)   + '%',      aval: h.umid  < 40 ? 'ruim' : (h.umid >= 50 ? 'ok' : 'atencao') },
            { label: 'Temperatura', icone: icoTemp(),   valor: Math.round(h.temp)   + '°C',     aval: h.temp  > 32 ? 'ruim' : (h.temp < 30  ? 'ok' : 'atencao') },
            { label: 'Chuva',       icone: icoChuva(),  valor: h.chuva.toFixed(1)   + ' mm/h',  aval: h.chuva > 0.2 ? 'ruim' : 'ok' }
        ]);
    }

    function avaliarPlant(h) {
        if (h.chuva > 5 || h.temp > 35) return 'desfavoravel';
        if (h.chuva >= 0.1 && h.chuva <= 2 && h.temp >= 15 && h.temp <= 30) return 'favoravel';
        return 'atencao';
    }

    function indicadoresPlant(h) {
        return montarIndicadores([
            { label: 'Temperatura', icone: icoTemp(),  valor: Math.round(h.temp)  + '°C',    aval: h.temp > 35 ? 'ruim' : (h.temp >= 15 && h.temp <= 30 ? 'ok' : 'atencao') },
            { label: 'Chuva',       icone: icoChuva(), valor: h.chuva.toFixed(1)  + ' mm/h', aval: h.chuva > 5 ? 'ruim' : (h.chuva >= 0.1 ? 'ok' : 'atencao') },
            { label: 'Umidade',     icone: icoUmid(),  valor: Math.round(h.umid)  + '%',      aval: h.umid < 30 ? 'ruim' : 'ok' }
        ]);
    }

    function avaliarColh(h) {
        if (h.chuva > 0.2 || h.umid > 80 || h.vento > 20) return 'desfavoravel';
        if (h.chuva < 0.05 && h.umid >= 40 && h.umid <= 70 && h.vento <= 10) return 'favoravel';
        return 'atencao';
    }

    function indicadoresColh(h) {
        return montarIndicadores([
            { label: 'Chuva',   icone: icoChuva(), valor: h.chuva.toFixed(1)  + ' mm/h', aval: h.chuva > 0.2 ? 'ruim' : 'ok' },
            { label: 'Umidade', icone: icoUmid(),  valor: Math.round(h.umid)  + '%',      aval: h.umid > 80 ? 'ruim' : (h.umid <= 70 ? 'ok' : 'atencao') },
            { label: 'Vento',   icone: icoVento(), valor: Math.round(h.vento) + ' km/h',  aval: h.vento > 20 ? 'ruim' : (h.vento <= 10 ? 'ok' : 'atencao') }
        ]);
    }

    function montarIndicadores(lista) {
        var html = '';
        lista.forEach(function (ind) {
            var textoAval = ind.aval === 'ok' ? 'Adequado' : (ind.aval === 'atencao' ? 'Atenção' : 'Inadequado');
            html += '<div class="jan-indicador">'
                  +   '<div class="jan-ind-label">' + ind.icone + ind.label + '</div>'
                  +   '<div class="jan-ind-valor">' + ind.valor + '</div>'
                  +   '<span class="jan-ind-avaliacao ' + ind.aval + '">' + textoAval + '</span>'
                  + '</div>';
        });
        return html;
    }

    function gerarRecomendacao(id, statusGeral, horas24, dias7, fnAvaliar) {
        var diasFav = 0;
        dias7.forEach(function (dia) {
            var hSim = { temp: (dia.tempMax + dia.tempMin) / 2, umid: dia.umidMedia, chuva: dia.chuva / 24, vento: dia.ventoMedio };
            if (fnAvaliar(hSim) === 'favoravel') diasFav++;
        });

        var proximaJanela = '';
        for (var i = 0; i < horas24.length; i++) {
            if (fnAvaliar(horas24[i]) === 'favoravel') { proximaJanela = horas24[i].label + 'h'; break; }
        }

        if (id === 'pulv') {
            if (statusGeral === 'favoravel') return 'Condições ideais para pulverização agora. Vento e umidade dentro dos limites recomendados. ' + (diasFav > 3 ? 'Boa semana para aplicações.' : '');
            if (statusGeral === 'atencao')   return proximaJanela ? 'Condições parcialmente adequadas. Aguarde a janela das ' + proximaJanela + ' para melhores resultados.' : 'Condições marginais. Evite horários com temperatura elevada ou vento excessivo.';
            return 'Evite pulverização agora. ' + (proximaJanela ? 'Próxima janela favorável: ' + proximaJanela + '.' : 'Nenhuma janela favorável prevista nas próximas 24h.');
        }
        if (id === 'plant') {
            if (statusGeral === 'favoravel') return 'Boas condições para plantio. Temperatura e umidade adequadas para germinação. ' + (diasFav >= 3 ? diasFav + ' dias favoráveis previstos esta semana.' : '');
            if (statusGeral === 'atencao')   return 'Condições aceitáveis para plantio, mas fique atento à previsão de chuva intensa. ' + (proximaJanela ? 'Janela mais favorável a partir das ' + proximaJanela + '.' : '');
            return 'Condições desfavoráveis para plantio. ' + (diasFav > 0 ? diasFav + ' dia(s) favorável(is) previsto(s) esta semana - verifique o calendário.' : 'Aguarde melhora nas condições climáticas.');
        }
        if (id === 'colh') {
            if (statusGeral === 'favoravel') return 'Ótimas condições para colheita. Ausência de chuva e umidade dentro do ideal. ' + (diasFav >= 4 ? 'Aproveite a sequência de dias secos.' : '');
            if (statusGeral === 'atencao')   return proximaJanela ? 'Aguarde as ' + proximaJanela + ' para iniciar a colheita com condições mais favoráveis.' : 'Condições marginais. Monitore a umidade dos grãos antes de iniciar.';
            return 'Não recomendado colher agora. ' + (proximaJanela ? 'Próxima janela favorável: ' + proximaJanela + '.' : 'Aguarde período sem chuva.');
        }
        return '';
    }

    /* --------------------------------------------------
       Utilitários
    -------------------------------------------------- */
    function formatarHora(isoStr) { return isoStr.substring(11, 13); }

    function labelStatus(s) {
        return s === 'favoravel' ? 'Favorável' : (s === 'atencao' ? 'Atenção' : 'Desfavorável');
    }

    function iconeStatus(s) {
        if (s === 'favoravel') return '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
        if (s === 'atencao')   return '<svg viewBox="0 0 24 24"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
        return '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    }

    function icoVento() { return '<svg viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>'; }
    function icoUmid()  { return '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>'; }
    function icoTemp()  { return '<svg viewBox="0 0 24 24"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>'; }
    function icoChuva() { return '<svg viewBox="0 0 24 24"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>'; }

    /* --------------------------------------------------
       Inicia
    -------------------------------------------------- */
    carregarDados();

});