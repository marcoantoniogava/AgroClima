<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="iso-8859-1" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroClima - Janelas Operacionais</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="/sistema/jquery/jquery.min.js"></script>
  <!-- BEGIN BLOCK_CACHE -->
  <link rel="stylesheet" href="/sistema/templates/wmadfgPainelAGC.css?vcache=[cache]">
  <link rel="stylesheet" href="/sistema/templates/wmadfgJanelasAGC.css?vcache=[cache]">
  <script src="/sistema/templates/wmadfgJanelasAGC.js?vcache=[cache]"></script>
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
       NAV DE ABAS
  =============================== -->
  <nav class="nav-abas">
    <a href="wmadfgPainelAGC" class="nav-aba" id="nav-painel">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      Painel Climático
    </a>
    <a href="#" class="nav-aba ativo" id="nav-janelas">
      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      Janelas Operacionais
    </a>
  </nav>

  <!-- ===============================
       CONTEÚDO PRINCIPAL
  =============================== -->
  <main class="conteudo">

    <!-- Loading -->
    <div id="estadoLoading" class="jan-estado">
      <div class="jan-spinner"></div>
      <p>Analisando condições operacionais...</p>
    </div>

    <!-- Conteúdo principal (oculto até carregar) -->
    <div id="conteudoJanelas" style="display:none">

      <!-- Cabeçalho com seletor de período -->
      <div class="jan-cabecalho">
        <div>
          <h1 class="jan-titulo">Janelas Operacionais</h1>
          <p class="jan-subtitulo">Condições para execução de atividades agrícolas</p>
        </div>
        <div class="periodo-abas">
          <button class="periodo-aba ativo" id="aba24h">Próximas 24h</button>
          <button class="periodo-aba" id="aba7d">7 Dias</button>
        </div>
      </div>

      <!-- BLOCO PULVERIZAÇÃO -->
      <div class="jan-bloco" id="blocoPulverizacao">
        <div class="jan-bloco-header">
          <div class="jan-bloco-icone pulv">
            <svg viewBox="0 0 24 24"><path d="M3 9l1-1m0 0l3-3m-3 3l3 3M5 5l7 7"/><path d="M19.5 5.5L18 7m0 0l-2 2m2-2l2 2M18 7l-3 3"/><circle cx="12" cy="17" r="3"/><path d="M12 14v-3"/></svg>
          </div>
          <div class="jan-bloco-info">
            <h2 class="jan-bloco-nome">Pulverização</h2>
            <p class="jan-bloco-desc">Aplicação de defensivos e fertilizantes foliares</p>
          </div>
          <div class="jan-status-badge" id="statusPulv">-</div>
        </div>
        <div class="jan-indicadores" id="indicPulv"></div>
        <div id="janelasPulv24h" class="jan-timeline-wrap"></div>
        <div id="janelasPulv7d"  class="jan-calendario-wrap" style="display:none"></div>
        <div class="jan-recomendacao" id="recoPulv"></div>
      </div>

      <!-- BLOCO PLANTIO -->
      <div class="jan-bloco" id="blocoPlantio">
        <div class="jan-bloco-header">
          <div class="jan-bloco-icone plant">
            <svg viewBox="0 0 24 24"><path d="M12 22V12"/><path d="M12 12C12 12 7 10 5 6c3 0 5.5 1.5 7 4z"/><path d="M12 12c0 0 5-2 7-6-3 0-5.5 1.5-7 4z"/></svg>
          </div>
          <div class="jan-bloco-info">
            <h2 class="jan-bloco-nome">Plantio</h2>
            <p class="jan-bloco-desc">Semeadura e transplantio de mudas</p>
          </div>
          <div class="jan-status-badge" id="statusPlant">-</div>
        </div>
        <div class="jan-indicadores" id="indicPlant"></div>
        <div id="janelasPlant24h" class="jan-timeline-wrap"></div>
        <div id="janelasPlant7d"  class="jan-calendario-wrap" style="display:none"></div>
        <div class="jan-recomendacao" id="recoPlant"></div>
      </div>

      <!-- BLOCO COLHEITA -->
      <div class="jan-bloco" id="blocoColheita">
        <div class="jan-bloco-header">
          <div class="jan-bloco-icone colh">
            <svg viewBox="0 0 24 24"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="M13 13l6 6"/></svg>
          </div>
          <div class="jan-bloco-info">
            <h2 class="jan-bloco-nome">Colheita</h2>
            <p class="jan-bloco-desc">Coleta e recolhimento de grãos e frutos</p>
          </div>
          <div class="jan-status-badge" id="statusColh">-</div>
        </div>
        <div class="jan-indicadores" id="indicColh"></div>
        <div id="janelasColh24h" class="jan-timeline-wrap"></div>
        <div id="janelasColh7d"  class="jan-calendario-wrap" style="display:none"></div>
        <div class="jan-recomendacao" id="recoColh"></div>
      </div>

    </div><!-- /conteudoJanelas -->

  </main>

</body>
</html>