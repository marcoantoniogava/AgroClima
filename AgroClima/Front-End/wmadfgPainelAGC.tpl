<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="iso-8859-1" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroClima - Painel Climático</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="/sistema/jquery/jquery.min.js"></script>
  <!-- BEGIN BLOCK_CACHE -->
  <link rel="stylesheet" href="/sistema/templates/wmadfgPainelAGC.css?vcache=[cache]">
  <script src="/sistema/templates/wmadfgPainelAGC.js?vcache=[cache]"></script>
  <!-- END BLOCK_CACHE -->
</head>
<body>

<!-- ===============================
     HEADER
=============================== -->
<header class="header">
  <img src="/sistema/templates/imgs/AGC_logo.png" alt="AgroClima" class="header-logo" />
  <div class="header-divider"></div>
  <div class="header-propriedade">
    <div class="header-propriedade-nome" id="headerNome">Carregando...</div>
    <div class="header-propriedade-local" id="headerLocal">
      <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
      <span id="headerLocalTxt">-</span>
    </div>
  </div>
  <button class="btn-voltar" id="btnVoltar">
    <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
    Voltar
  </button>
</header>

<!-- ===============================
     NAVEGAÇÃO POR ABAS
=============================== -->
<nav class="nav-abas">
  <button class="nav-aba ativo" id="nav-painel">
    <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    Painel Climático
  </button>
  <button class="nav-aba" id="nav-janelas">
    <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    Janelas Operacionais
  </button>
</nav>

<!-- ===============================
     CONTEÚDO PRINCIPAL
=============================== -->
<main class="conteudo" id="conteudoPrincipal">

  <!-- Estado: carregando -->
  <div class="estado-loading" id="estadoLoading">
    <div class="spinner-api"></div>
    <p>Buscando dados climáticos...</p>
  </div>

  <!-- Estado: erro -->
  <div class="estado-erro" id="estadoErro" style="display:none">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <p id="estadoErroMsg">Não foi possível carregar os dados climáticos.</p>
  </div>

  <!-- Conteúdo climático (preenchido pelo JS) -->
  <div id="conteudoClima" style="display:none">

    <!-- Seletor de período -->
    <div class="periodo-wrap">
      <div class="periodo-titulo">Condições Climáticas</div>
      <div class="periodo-abas">
        <button class="periodo-aba ativo" id="aba48h">Próximas 48h</button>
        <button class="periodo-aba" id="aba7dias">7 Dias</button>
      </div>
    </div>

    <!-- Cards de clima atual -->
    <div class="cards-clima">
      <div class="card-clima">
        <div class="card-clima-icone temp">
          <svg viewBox="0 0 24 24"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
        </div>
        <div class="card-clima-label">Temperatura Atual</div>
        <div class="card-clima-valor" id="cardTemp">-<span>°C</span></div>
        <div class="card-clima-detalhe" id="cardTempDetalhe">Sensação: -</div>
      </div>
      <div class="card-clima">
        <div class="card-clima-icone umid">
          <svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        </div>
        <div class="card-clima-label">Umidade Relativa</div>
        <div class="card-clima-valor" id="cardUmid">-<span>%</span></div>
        <div class="card-clima-detalhe" id="cardUmidDetalhe">-</div>
      </div>
      <div class="card-clima">
        <div class="card-clima-icone vento">
          <svg viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
        </div>
        <div class="card-clima-label">Vento</div>
        <div class="card-clima-valor" id="cardVento">-<span> km/h</span></div>
        <div class="card-clima-detalhe" id="cardVentoDetalhe">-</div>
      </div>
      <div class="card-clima">
        <div class="card-clima-icone chuva">
          <svg viewBox="0 0 24 24"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
        </div>
        <div class="card-clima-label">Precipitação (24h)</div>
        <div class="card-clima-valor" id="cardChuva">-<span> mm</span></div>
        <div class="card-clima-detalhe" id="cardChuvaDetalhe">-</div>
      </div>
    </div>

    <!-- Painel 48h -->
    <div class="painel-48h ativo" id="painel48h">
      <div class="grafico-wrap">
        <div class="grafico-header">
          <div class="grafico-titulo">Temperatura e Precipitação, Próximas 48h</div>
          <div class="grafico-legenda">
            <div class="legenda-item"><div class="legenda-cor temp"></div> Temperatura</div>
            <div class="legenda-item"><div class="legenda-cor chuva"></div> Chuva</div>
          </div>
        </div>
        <div class="grafico-container">
          <canvas id="grafico48h"></canvas>
        </div>
      </div>

      <div class="grafico-wrap">
        <div class="grafico-header">
          <div class="grafico-titulo">Umidade Relativa, Próximas 48h</div>
          <div class="grafico-legenda">
            <div class="legenda-item"><div class="legenda-cor umid"></div> Umidade (%)</div>
          </div>
        </div>
        <div class="grafico-container">
          <canvas id="grafico48hUmid"></canvas>
        </div>
      </div>
    </div>

    <!-- Painel 7 dias -->
    <div class="painel-7dias" id="painel7dias">
      <div class="grafico-wrap">
        <div class="grafico-header">
          <div class="grafico-titulo">Temperatura Máx/Mín, 7 Dias</div>
          <div class="grafico-legenda">
            <div class="legenda-item"><div class="legenda-cor temp"></div> Máxima</div>
            <div class="legenda-item"><div class="legenda-cor umid"></div> Mínima</div>
          </div>
        </div>
        <div class="grafico-container">
          <canvas id="grafico7dias"></canvas>
        </div>
      </div>

      <div class="tabela-7dias">
        <div class="tabela-7dias-header">Resumo por Dia</div>
        <table>
          <thead>
            <tr>
              <th>Dia</th>
              <th>Máx</th>
              <th>Mín</th>
              <th>Chuva</th>
              <th>Umidade</th>
              <th>Vento máx</th>
            </tr>
          </thead>
          <tbody id="corpo7dias"></tbody>
        </table>
      </div>
    </div>

  </div><!-- fim conteudoClima -->

</main>

</body>
</html>