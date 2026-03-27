/* ========================================
   AGROCLIMA - Painel Climático (AC003)
   JS principal
   ======================================== */

   $(document).ready(function () {

    /* --------------------------------------------------
       Lê os dados da propriedade salvos no localStorage
    -------------------------------------------------- */
    var propriedade = {
        nome:      localStorage.getItem('agc_painel_nome')  || '',
        local:     localStorage.getItem('agc_painel_local') || '',
        latitude:  parseFloat(localStorage.getItem('agc_painel_lat'))  || null,
        longitude: parseFloat(localStorage.getItem('agc_painel_lon'))  || null
    };

    if (!propriedade.latitude || !propriedade.longitude) {
        window.location.href = 'wmadfgPropriedadesAGC';
        return;
    }

    document.getElementById('headerNome').textContent = propriedade.nome || 'Propriedade';

    if (propriedade.local) {
        document.getElementById('headerLocalTxt').textContent = propriedade.local;
    }

    document.getElementById('btnVoltar').addEventListener('click', function () {
        window.location.href = 'wmadfgPropriedadesAGC';
    });


    /* --------------------------------------------------
       Referências aos gráficos
    -------------------------------------------------- */
    var grafico48h     = null;
    var grafico48hUmid = null;
    var grafico7dias   = null;


    /* --------------------------------------------------
       Utilitários
    -------------------------------------------------- */
    function nomeDia(dataStr, curto) {
        var d    = new Date(dataStr + 'T12:00:00');
        var dias = curto
            ? ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
            : ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
        return dias[d.getDay()];
    }

    function formatarDataHora(isoStr) {
        var data = isoStr.substring(8, 10) + '/' + isoStr.substring(5, 7);
        var hora = isoStr.substring(11, 13) + 'h';
        return data + ' ' + hora;
    }

    function descricaoUmidade(umid) {
        if (umid < 30) return 'Muito seco';
        if (umid < 50) return 'Seco';
        if (umid < 70) return 'Confortável';
        if (umid < 85) return 'Úmido';
        return 'Muito úmido';
    }

    function descricaoVento(vel) {
        if (vel < 10) return 'Vento fraco';
        if (vel < 30) return 'Vento moderado';
        if (vel < 60) return 'Vento forte';
        return 'Vento muito forte';
    }


    /* --------------------------------------------------
       Busca dados na Open-Meteo
    -------------------------------------------------- */
    function mostrarErro(msg) {
        document.getElementById('estadoLoading').style.display = 'none';
        document.getElementById('estadoErro').style.display    = '';
        document.getElementById('estadoErroMsg').textContent   = msg || 'Não foi possível carregar os dados climáticos.';
    }

    var urlApi = 'https://api.open-meteo.com/v1/forecast'
        + '?latitude='     + propriedade.latitude
        + '&longitude='    + propriedade.longitude
        + '&hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,apparent_temperature'
        + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean'
        + '&timezone=America%2FSao_Paulo'
        + '&forecast_days=8';

    $.ajax({
        url: urlApi,
        method: 'GET',
        dataType: 'json',
        success: function (dados) {
            document.getElementById('estadoLoading').style.display = 'none';
            document.getElementById('conteudoClima').style.display = '';
            processarDados(dados);
        },
        error: function () {
            mostrarErro('Não foi possível conectar à API climática. Verifique sua conexão.');
        }
    });


    /* --------------------------------------------------
       Processa e exibe os dados
    -------------------------------------------------- */
    function processarDados(dados) {
        var horly = dados.hourly;
        var daily = dados.daily;

        var agora    = new Date();
        var idxAtual = 0;
        for (var i = 0; i < horly.time.length; i++) {
            if (parseInt(horly.time[i].substring(8, 10)) === agora.getDate() &&
                parseInt(horly.time[i].substring(11, 13)) === agora.getHours()) {
                idxAtual = i;
                break;
            }
        }

        var tempAtual     = horly.temperature_2m[idxAtual];
        var sensacaoAtual = horly['apparent_temperature'] ? horly['apparent_temperature'][idxAtual] : null;
        var umidAtual     = horly.relativehumidity_2m[idxAtual];
        var ventoAtual    = horly.windspeed_10m[idxAtual];
        var chuva24h      = daily.precipitation_sum[0];

        document.getElementById('cardTemp').innerHTML          = Math.round(tempAtual) + '<span>°C</span>';
        document.getElementById('cardTempDetalhe').textContent = sensacaoAtual !== null ? 'Sensação: ' + Math.round(sensacaoAtual) + '°C' : '';
        document.getElementById('cardUmid').innerHTML          = Math.round(umidAtual) + '<span>%</span>';
        document.getElementById('cardUmidDetalhe').textContent = descricaoUmidade(umidAtual);
        document.getElementById('cardVento').innerHTML         = Math.round(ventoAtual) + '<span> km/h</span>';
        document.getElementById('cardVentoDetalhe').textContent = descricaoVento(ventoAtual);
        document.getElementById('cardChuva').innerHTML         = (chuva24h || 0).toFixed(1) + '<span> mm</span>';
        document.getElementById('cardChuvaDetalhe').textContent = chuva24h > 0 ? 'Chuva registrada hoje' : 'Sem chuva hoje';

        var labels48h = [], temps48h = [], chuvas48h = [], umids48h = [], contador = 0;
        for (var j = idxAtual; j < horly.time.length && contador < 17; j++) {
            if ((j - idxAtual) % 3 === 0) {
                labels48h.push(formatarDataHora(horly.time[j]));
                temps48h.push(Math.round(horly.temperature_2m[j] * 10) / 10);
                chuvas48h.push(horly.precipitation[j] || 0);
                umids48h.push(horly.relativehumidity_2m[j]);
                contador++;
            }
        }

        var labels7d = [], maxs7d = [], mins7d = [], chuvas7d = [], umids7d = [], ventos7d = [];
        for (var k = 0; k < Math.min(7, daily.time.length); k++) {
            labels7d.push(nomeDia(daily.time[k], true) + ' ' + daily.time[k].substring(8, 10) + '/' + daily.time[k].substring(5, 7));
            maxs7d.push(Math.round(daily.temperature_2m_max[k] * 10) / 10);
            mins7d.push(Math.round(daily.temperature_2m_min[k] * 10) / 10);
            chuvas7d.push((daily.precipitation_sum[k] || 0).toFixed(1));
            umids7d.push(Math.round(daily.relative_humidity_2m_mean ? daily.relative_humidity_2m_mean[k] : 0));
            ventos7d.push(Math.round(daily.windspeed_10m_max[k]));
        }

        renderizarGraficos(labels48h, temps48h, chuvas48h, umids48h, labels7d, maxs7d, mins7d);
        renderizarTabela7dias(labels7d, maxs7d, mins7d, chuvas7d, umids7d, ventos7d);
    }


    /* --------------------------------------------------
       Renderiza gráficos com Chart.js
    -------------------------------------------------- */
    function renderizarGraficos(labels48h, temps48h, chuvas48h, umids48h, labels7d, maxs7d, mins7d) {

        var configBase = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(45,55,72,0.92)',
                    padding: 10,
                    cornerRadius: 8,
                    titleFont: { family: 'Open Sans', size: 12 },
                    bodyFont:  { family: 'Open Sans', size: 13, weight: '700' }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { font: { family: 'Open Sans', size: 11 }, color: '#718096' }
                },
                y: {
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: { font: { family: 'Open Sans', size: 11 }, color: '#718096' }
                }
            }
        };

        grafico48h = new Chart(document.getElementById('grafico48h'), {
            data: {
                labels: labels48h,
                datasets: [
                    {
                        type: 'line',
                        label: 'Temperatura (°C)',
                        data: temps48h,
                        borderColor: '#E8965A',
                        backgroundColor: 'rgba(232,150,90,0.08)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#E8965A',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'yTemp'
                    },
                    {
                        type: 'bar',
                        label: 'Chuva (mm)',
                        data: chuvas48h,
                        backgroundColor: 'rgba(130,181,220,0.55)',
                        borderColor: 'rgba(130,181,220,0.8)',
                        borderWidth: 1,
                        borderRadius: 4,
                        yAxisID: 'yChuva'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: configBase.plugins,
                scales: {
                    x: configBase.scales.x,
                    yTemp: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { family: 'Open Sans', size: 11 }, color: '#E8965A',
                                 callback: function(v) { return v + '°'; } }
                    },
                    yChuva: {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { font: { family: 'Open Sans', size: 11 }, color: '#82B5DC',
                                 callback: function(v) { return v + 'mm'; } },
                        min: 0
                    }
                }
            }
        });

        grafico48hUmid = new Chart(document.getElementById('grafico48hUmid'), {
            type: 'line',
            data: {
                labels: labels48h,
                datasets: [{
                    label: 'Umidade (%)',
                    data: umids48h,
                    borderColor: '#3182CE',
                    backgroundColor: 'rgba(49,130,206,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#3182CE',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: configBase.plugins,
                scales: {
                    x: configBase.scales.x,
                    y: {
                        min: 0, max: 100,
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { family: 'Open Sans', size: 11 }, color: '#3182CE',
                                 callback: function(v) { return v + '%'; } }
                    }
                }
            }
        });

        grafico7dias = new Chart(document.getElementById('grafico7dias'), {
            type: 'line',
            data: {
                labels: labels7d,
                datasets: [
                    {
                        label: 'Máxima (°C)',
                        data: maxs7d,
                        borderColor: '#E8965A',
                        backgroundColor: 'rgba(232,150,90,0.08)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#E8965A',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Mínima (°C)',
                        data: mins7d,
                        borderColor: '#3182CE',
                        backgroundColor: 'rgba(49,130,206,0.08)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#3182CE',
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: configBase.plugins,
                scales: {
                    x: configBase.scales.x,
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: { font: { family: 'Open Sans', size: 11 }, color: '#718096',
                                 callback: function(v) { return v + '°'; } }
                    }
                }
            }
        });
    }


    /* --------------------------------------------------
       Renderiza tabela de 7 dias
    -------------------------------------------------- */
    function renderizarTabela7dias(labels, maxs, mins, chuvas, umids, ventos) {
        var tbody    = document.getElementById('corpo7dias');
        var maxChuva = Math.max.apply(null, chuvas.map(parseFloat)) || 1;

        tbody.innerHTML = '';
        for (var i = 0; i < labels.length; i++) {
            var larguraBarra = Math.round((parseFloat(chuvas[i]) / maxChuva) * 80);
            var tr = document.createElement('tr');
            tr.innerHTML =
                '<td><span class="dia-nome">' + labels[i] + '</span></td>' +
                '<td><span class="temp-max">' + maxs[i] + '°C</span></td>' +
                '<td><span class="temp-min">' + mins[i] + '°C</span></td>' +
                '<td><div class="barra-chuva-wrap">' +
                    '<div class="barra-chuva" style="width:' + Math.max(larguraBarra, 3) + 'px"></div>' +
                    '<span>' + chuvas[i] + ' mm</span>' +
                '</div></td>' +
                '<td>' + (umids[i] || '-') + '%</td>' +
                '<td>' + ventos[i] + ' km/h</td>';
            tbody.appendChild(tr);
        }
    }


    /* --------------------------------------------------
       Alternância entre abas 48h / 7 dias
    -------------------------------------------------- */
    document.getElementById('aba48h').addEventListener('click', function () {
        this.classList.add('ativo');
        document.getElementById('aba7dias').classList.remove('ativo');
        document.getElementById('painel48h').classList.add('ativo');
        document.getElementById('painel7dias').classList.remove('ativo');
        if (grafico48h)     grafico48h.resize();
        if (grafico48hUmid) grafico48hUmid.resize();
    });

    document.getElementById('aba7dias').addEventListener('click', function () {
        this.classList.add('ativo');
        document.getElementById('aba48h').classList.remove('ativo');
        document.getElementById('painel7dias').classList.add('ativo');
        document.getElementById('painel48h').classList.remove('ativo');
        if (grafico7dias) grafico7dias.resize();
    });

    document.getElementById('nav-janelas').addEventListener('click', function () {
        window.location.href = 'wmadfgJanelasAGC';
    });

});