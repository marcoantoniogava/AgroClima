<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroClima ? Histórico de Alertas</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="/sistema/jquery/jquery.min.js"></script>
  <!-- BEGIN BLOCK_CACHE -->
  <link rel="stylesheet" href="/sistema/templates/wmadfgAGC2css.css?vcache=[cache]">
  <link rel="stylesheet" href="/sistema/templates/wmadfgAlertasAGC.css?vcache=[cache]">
  <link rel="stylesheet" href="/sistema/templates/wmadfgHistoricoAGC.css?vcache=[cache]">
  <script src="/sistema/templates/wmadfgHistoricoAGC.js?vcache=[cache]"></script>
  <!-- END BLOCK_CACHE -->
</head>
<body>

<div class="layout">

  <!-- ???????????????????????????????
       SIDEBAR
  ??????????????????????????????? -->
  <aside class="sidebar">

    <div class="sidebar-logo">
      <img src="/sistema/templates/imgs/AGC_logo.png" alt="AgroClima" />
    </div>

    <nav class="sidebar-nav">
      <a href="wmadfgPropriedadesAGC" class="nav-item" id="nav-propriedades">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Propriedades
      </a>
      <a href="wmadfgAlertasAGC" class="nav-item" id="nav-alertas">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Alertas
      </a>
      <a href="#" class="nav-item ativo" id="nav-historico">
        <svg viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
        Histórico
      </a>
    </nav>

    <div class="sidebar-usuario">
      <div class="usuario-avatar">
        <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="usuario-info">
        <span class="usuario-nome" id="nomeUsuario">Usuário</span>
        <span class="usuario-label">Conta</span>
      </div>
      <button class="btn-logout" id="btnLogout" title="Sair da conta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>

  </aside>

  <!-- ???????????????????????????????
       CONTEÚDO PRINCIPAL
  ??????????????????????????????? -->
  <main class="conteudo">

    <!-- Cabeçalho -->
    <div class="pagina-cabecalho">
      <div>
        <h1 class="pagina-titulo">Histórico de Alertas</h1>
        <p class="pagina-sub">Alertas arquivados de todas as suas propriedades.</p>
      </div>
      <span class="badge-total" id="badgeTotal">0 registros</span>
    </div>

    <!-- Busca + filtros -->
    <div class="hist-controles">
      <div class="hist-busca-wrap">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" id="campoBusca" class="hist-busca" placeholder="Buscar por tipo, descrição ou propriedade..." />
      </div>
      <div class="filtros-wrap" style="margin-bottom:0">
        <button class="filtro-btn ativo" data-filtro="TODOS">Todos</button>
        <button class="filtro-btn" data-filtro="CHUVA">
          <svg viewBox="0 0 24 24"><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
          Chuva
        </button>
        <button class="filtro-btn" data-filtro="VENTO">
          <svg viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
          Vento Forte
        </button>
        <button class="filtro-btn" data-filtro="UMIDADE">
          <svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
          Baixa Umidade
        </button>
      </div>
    </div>

    <!-- Estado: carregando -->
    <div class="estado-alerta" id="estadoLoading">
      <div class="spinner-alertas"></div>
      <p>Carregando histórico...</p>
    </div>

    <!-- Estado: vazio -->
    <div class="estado-alerta" id="estadoVazio" style="display:none">
      <svg viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
      <p>Nenhum alerta arquivado ainda.</p>
      <span>Os alertas arquivados na tela de Alertas aparecerão aqui.</span>
    </div>

    <!-- Tabela de histórico -->
    <div id="wrapHistorico" style="display:none">

      <table class="hist-tabela">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Data / Hora</th>
            <th>Propriedade</th>
            <th class="col-acao"></th>
          </tr>
        </thead>
        <tbody id="corpoTabela"></tbody>
      </table>

      <!-- Rodapé: info + paginação -->
      <div class="hist-rodape">
        <span class="hist-info-pag" id="infoPaginacao">?</span>
        <div class="hist-paginacao" id="containerPaginacao"></div>
      </div>

    </div>

  </main>
</div>

</body>
</html>