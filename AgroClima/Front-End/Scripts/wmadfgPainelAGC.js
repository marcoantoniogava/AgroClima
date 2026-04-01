/* ========================================
   AGROCLIMA - Painel Climático (AC003)
   JS principal
   ======================================== */

/* --------------------------------------------------
   Lê os dados da propriedade salvos no localStorage
-------------------------------------------------- */
// Pega as informações da propriedade que foram salvas na tela anterior
var propriedade = {
    nome: localStorage.getItem('agc_painel_nome') || '',
    local: localStorage.getItem('agc_painel_local') || '',
    latitude: parseFloat(localStorage.getItem('agc_painel_lat')) || null,
    longitude: parseFloat(localStorage.getItem('agc_painel_lon')) || null
};

// Se as coordenadas não existirem, bloqueia o acesso e devolve pra tela de propriedades
if (!propriedade.latitude || !propriedade.longitude) {
    window.location.href = 'wmadfgPropriedadesAGC';
    throw new Error('Propriedade não selecionada.');
}

// Atualiza o cabeçalho (Header) da página com o nome e o local da propriedade selecionada
document.getElementById('headerNome').textContent = propriedade.nome || 'Propriedade';

if (propriedade.local) {
    document.getElementById('headerLocalTxt').textContent = propriedade.local;
}

// Ação do botão de voltar para a tela de propriedades
document.getElementById('btnVoltar').addEventListener('click', function () {
    window.location.href = 'wmadfgPropriedadesAGC';
});


/* --------------------------------------------------
   Referências aos gráficos
-------------------------------------------------- */
// Variáveis globais para armazenar as instâncias do Chart.js. 
var grafico48h = null;
var grafico48hUmid = null;
var grafico7dias = null;


/* --------------------------------------------------
   Funções de apoio
-------------------------------------------------- */
// Recebe uma data e retorna o dia da semana correspondente
function nomeDia(dataStr, curto) {
    // Força a hora para 12:00:00 para evitar problemas de fuso horário adiantando/atrasando o dia
    var d = new Date(dataStr + 'T12:00:00'); 
    var dias = curto
        ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
        : ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[d.getDay()];
}

// Pega a string ISO (ex: "2026-03-27T14:00") e converte para "25/10 14h"
function formatarDataHora(isoStr) {
    var data = isoStr.substring(8, 10) + '/' + isoStr.substring(5, 7);
    var hora = isoStr.substring(11, 13) + 'h';
    return data + ' ' + hora;
}

// Transforma o percentual numérico de umidade em texto
function descricaoUmidade(umid) {
    if (umid < 30) return 'Muito seco';
    if (umid < 50) return 'Seco';
    if (umid < 70) return 'Confortável';
    if (umid < 85) return 'Úmido';
    return 'Muito úmido';
}

// Transforma a velocidade numérica do vento (km/h) em texto
function descricaoVento(vel) {
    if (vel < 10) return 'Vento fraco';
    if (vel < 30) return 'Vento moderado';
    if (vel < 60) return 'Vento forte';
    return 'Vento muito forte';
}


/* --------------------------------------------------
   Busca dados na Open-Meteo
-------------------------------------------------- */
// Função para lidar com falhas na API ou na internet
function mostrarErro(msg) {
    document.getElementById('estadoLoading').style.display = 'none';
    document.getElementById('estadoErro').style.display = '';
    document.getElementById('estadoErroMsg').textContent = msg || 'Não foi possível carregar os dados climáticos.';
}

// Monta a URL da API Open-Meteo passando as coordenadas da propriedade atual.
// Pede dados por hora (hourly) e por dia (daily) usando o fuso de SP.
var urlApi = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=' + propriedade.latitude
    + '&longitude=' + propriedade.longitude
    + '&hourly=temperature_2m,relativehumidity_2m,precipitation,windspeed_10m,apparent_temperature'
    + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_mean'
    + '&timezone=America%2FSao_Paulo'
    + '&forecast_days=8'; // Pede 8 dias para garantir que sejam 7 dias completos

$.ajax({
    url: urlApi,
    method: 'GET',
    dataType: 'json',
    success: function (dados) {
        // Sucesso: Esconde o "Carregando..." e mostra a div do Painel
        document.getElementById('estadoLoading').style.display = 'none';
        document.getElementById('conteudoClima').style.display = '';
        processarDados(dados); // Manda o JSON da API para ser fatiado e renderizado
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

    // 1. ACHAR A HORA ATUAL NO ARRAY DA API
    var agora = new Date();
    var idxAtual = 0;
    // Percorre o array de horas da API para achar a posição (index) que bate com a data e hora atual do usuário
    for (var i = 0; i < horly.time.length; i++) {
        if (parseInt(horly.time[i].substring(8, 10)) === agora.getDate() &&
            parseInt(horly.time[i].substring(11, 13)) === agora.getHours()) {
            idxAtual = i;
            break;
        }
    }

    // 2. ATUALIZAR OS CARDS PRINCIPAIS
    var tempAtual = horly.temperature_2m[idxAtual];
    var sensacaoAtual = horly['apparent_temperature'] ? horly['apparent_temperature'][idxAtual] : null;
    var umidAtual = horly.relativehumidity_2m[idxAtual];
    var ventoAtual = horly.windspeed_10m[idxAtual];
    var chuva24h = daily.precipitation_sum[0]; // Posição 0 do array "daily" é sempre hoje

    // Coloca os valores na tela, arredondando os números para não ficar feio (ex: 25.324 vira 25)
    document.getElementById('cardTemp').innerHTML = Math.round(tempAtual) + '<span>°C</span>';
    document.getElementById('cardTempDetalhe').textContent = sensacaoAtual !== null ? 'Sensação: ' + Math.round(sensacaoAtual) + '°C' : '';
    document.getElementById('cardUmid').innerHTML = Math.round(umidAtual) + '<span>%</span>';
    document.getElementById('cardUmidDetalhe').textContent = descricaoUmidade(umidAtual);
    document.getElementById('cardVento').innerHTML = Math.round(ventoAtual) + '<span> km/h</span>';
    document.getElementById('cardVentoDetalhe').textContent = descricaoVento(ventoAtual);
    document.getElementById('cardChuva').innerHTML = (chuva24h || 0).toFixed(1) + '<span> mm</span>'; // toFixed(1) garante 1 casa decimal
    document.getElementById('cardChuvaDetalhe').textContent = chuva24h > 0 ? 'Chuva registrada hoje' : 'Sem chuva hoje';

    // 3. SEPARAR DADOS PARA O GRÁFICO DE 48 HORAS
    var labels48h = [], temps48h = [], chuvas48h = [], umids48h = [], contador = 0;
    // Começa do index atual e pega as próximas 48h. Mas para o gráfico não ficar espremido,
    // usa o modulo % 3 para pegar os dados apenas de 3 em 3 horas. Limita a 17 pontos (+- 48h).
    for (var j = idxAtual; j < horly.time.length && contador < 17; j++) {
        if ((j - idxAtual) % 3 === 0) {
            labels48h.push(formatarDataHora(horly.time[j]));
            temps48h.push(Math.round(horly.temperature_2m[j] * 10) / 10); // Arredonda para 1 casa decimal
            chuvas48h.push(horly.precipitation[j] || 0);
            umids48h.push(horly.relativehumidity_2m[j]);
            contador++;
        }
    }

    // 4. SEPARAR DADOS PARA A ABA/GRÁFICO DE 7 DIAS
    var labels7d = [], maxs7d = [], mins7d = [], chuvas7d = [], umids7d = [], ventos7d = [];
    for (var k = 0; k < Math.min(7, daily.time.length); k++) {
        labels7d.push(nomeDia(daily.time[k], true) + ' ' + daily.time[k].substring(8, 10) + '/' + daily.time[k].substring(5, 7));
        maxs7d.push(Math.round(daily.temperature_2m_max[k] * 10) / 10);
        mins7d.push(Math.round(daily.temperature_2m_min[k] * 10) / 10);
        chuvas7d.push((daily.precipitation_sum[k] || 0).toFixed(1));
        umids7d.push(Math.round(daily.relative_humidity_2m_mean ? daily.relative_humidity_2m_mean[k] : 0));
        ventos7d.push(Math.round(daily.windspeed_10m_max[k]));
    }

    // Chama as funções que constroem a interface visual com os arrays recém-populados
    renderizarGraficos(labels48h, temps48h, chuvas48h, umids48h, labels7d, maxs7d, mins7d);
    renderizarTabela7dias(labels7d, maxs7d, mins7d, chuvas7d, umids7d, ventos7d);
}


/* --------------------------------------------------
   Renderiza gráficos com Chart.js
-------------------------------------------------- */
function renderizarGraficos(labels48h, temps48h, chuvas48h, umids48h, labels7d, maxs7d, mins7d) {

    // Configuração visual básica reaproveitada em todos os gráficos (Tooltip, Fontes, Cores)
    var configBase = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }, // Esconde a legenda padrão
            tooltip: {
                backgroundColor: 'rgba(45,55,72,0.92)',
                padding: 10,
                cornerRadius: 8,
                titleFont: { family: 'Open Sans', size: 12 },
                bodyFont: { family: 'Open Sans', size: 13, weight: '700' }
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

    // 1. Gráfico Misto (Linha e Barra) - Temperatura e Chuva nas próximas 48h
    grafico48h = new Chart(document.getElementById('grafico48h'), {
        data: {
            labels: labels48h,
            datasets: [
                {
                    type: 'line', // Linha para temperatura
                    label: 'Temperatura (°C)',
                    data: temps48h,
                    borderColor: '#E8965A',
                    backgroundColor: 'rgba(232,150,90,0.08)',
                    borderWidth: 2.5,
                    pointBackgroundColor: '#E8965A',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4, // Deixa a linha curvada/suave
                    fill: true,
                    yAxisID: 'yTemp' // Associa ao eixo Y da esquerda
                },
                {
                    type: 'bar', // Barra para precipitação (chuva)
                    label: 'Chuva (mm)',
                    data: chuvas48h,
                    backgroundColor: 'rgba(130,181,220,0.55)',
                    borderColor: 'rgba(130,181,220,0.8)',
                    borderWidth: 1,
                    borderRadius: 4,
                    yAxisID: 'yChuva' // Associa ao eixo Y da direita
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: configBase.plugins,
            scales: {
                x: configBase.scales.x,
                // Eixo Esquerdo (Temperatura)
                yTemp: {
                    type: 'linear',
                    position: 'left',
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: {
                        font: { family: 'Open Sans', size: 11 }, color: '#E8965A',
                        callback: function (v) { return v + '°'; }
                    }
                },
                // Eixo Direito (Chuva)
                yChuva: {
                    type: 'linear',
                    position: 'right',
                    grid: { drawOnChartArea: false }, // Esconde as linhas de grade para não encavalar com as de temp
                    ticks: {
                        font: { family: 'Open Sans', size: 11 }, color: '#82B5DC',
                        callback: function (v) { return v + 'mm'; }
                    },
                    min: 0 // Chuva nunca pode ser negativa
                }
            }
        }
    });

    // 2. Gráfico de Linha Simples - Umidade nas próximas 48h
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
                    min: 0, max: 100, // Trava o eixo Y entre 0 e 100%
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: {
                        font: { family: 'Open Sans', size: 11 }, color: '#3182CE',
                        callback: function (v) { return v + '%'; }
                    }
                }
            }
        }
    });

    // 3. Gráfico de 7 Dias - Temperatura Máxima e Mínima
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
                    fill: false // Sem preenchimento sob a linha
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
                    ticks: {
                        font: { family: 'Open Sans', size: 11 }, color: '#718096',
                        callback: function (v) { return v + '°'; }
                    }
                }
            }
        }
    });
}


/* --------------------------------------------------
   Renderiza tabela de 7 dias
-------------------------------------------------- */
function renderizarTabela7dias(labels, maxs, mins, chuvas, umids, ventos) {
    var tbody = document.getElementById('corpo7dias');
    
    // Descobre o dia que mais choveu para usar como 100% da barra visual. Se for zero, usa 1 para evitar divisão por zero.
    var maxChuva = Math.max.apply(null, chuvas.map(parseFloat)) || 1;

    tbody.innerHTML = '';
    
    // Percorre os dados e cria uma linha <tr> para cada dia
    for (var i = 0; i < labels.length; i++) {
        // Calcula o tamanho da barra horizontal azul da chuva
        var larguraBarra = Math.round((parseFloat(chuvas[i]) / maxChuva) * 80);
        
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><span class="dia-nome">' + labels[i] + '</span></td>' +
            '<td><span class="temp-max">' + maxs[i] + '°C</span></td>' +
            '<td><span class="temp-min">' + mins[i] + '°C</span></td>' +
            '<td><div class="barra-chuva-wrap">' +
            '<div class="barra-chuva" style="width:' + Math.max(larguraBarra, 3) + 'px"></div>' + // Garante pelo menos 3px para não sumir
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
// Evento ao clicar na aba "Próximas 48h"
document.getElementById('aba48h').addEventListener('click', function () {
    // Altera as classes CSS para dar destaque ao botão correto e exibir a div correspondente
    this.classList.add('ativo');
    document.getElementById('aba7dias').classList.remove('ativo');
    document.getElementById('painel48h').classList.add('ativo');
    document.getElementById('painel7dias').classList.remove('ativo');
    
    // Chama o redimensionamento do Chart.js.
    if (grafico48h) grafico48h.resize();
    if (grafico48hUmid) grafico48hUmid.resize();
});

// Evento ao clicar na aba "Próximos 7 dias"
document.getElementById('aba7dias').addEventListener('click', function () {
    // Mesma lógica: inverte as classes ativas
    this.classList.add('ativo');
    document.getElementById('aba48h').classList.remove('ativo');
    document.getElementById('painel7dias').classList.add('ativo');
    document.getElementById('painel48h').classList.remove('ativo');
    
    // Redimensiona o gráfico de 7 dias
    if (grafico7dias) grafico7dias.resize();
});

// Redirecionamento da barra de navegação para a tela de Janelas Climáticas
document.getElementById('nav-janelas').addEventListener('click', function () {
    window.location.href = 'wmadfgJanelasAGC';
});
