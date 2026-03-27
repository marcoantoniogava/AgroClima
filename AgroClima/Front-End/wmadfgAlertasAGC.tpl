<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroClima ? Alertas</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="/sistema/jquery/jquery.min.js"></script>
  <!-- BEGIN BLOCK_CACHE -->
  <link rel="stylesheet" href="/sistema/templates/wmadfgAGC2css.css?vcache=[cache]">
  <link rel="stylesheet" href="/sistema/templates/wmadfgAlertasAGC.css?vcache=[cache]">
  <script src="/sistema/templates/wmadfgAlertasAGC.js?vcache=[cache]"></script>
  <!-- END BLOCK_CACHE -->
</head>
<body>

<div class="layout">

  <!-- SIDEBAR -->
  <aside class="sidebar">

    <!-- Logo -->
    <div class="sidebar-logo">
      <img src="/sistema/templates/imgs/AGC_logo.png" alt="AgroClima" />
    </div>

    <!-- Navegação -->
    <nav class="sidebar-nav">
      <a href="wmadfgPropriedadesAGC" class="nav-item" id="nav-propriedades">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Propriedades
      </a>
      <a href="#" class="nav-item ativo" id="nav-alertas">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Alertas
      </a>
      <a href="wmadfgHistoricoAGC" class="nav-item" id="nav-historico">
        <svg viewBox="0 0 24 24"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>
        Histórico
      </a>
    </nav>

    <!-- Usuário logado (rodapé da sidebar) -->
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

  <!-- CONTEÚDO PRINCIPAL -->
  <main class="conteudo">

    <!-- Cabeçalho -->
    <div class="pagina-cabecalho">
      <div>
        <h1 class="pagina-titulo">Alertas Climáticos</h1>
        <p class="pagina-sub">Alertas automáticos gerados para suas propriedades com base nas condições meteorológicas.</p>
      </div>
      <div class="cabecalho-acoes">
        <span class="badge-total" id="badgeTotal">0 alertas</span>
        <button class="btn-arquivar-todos" id="btnArquivarTodos" title="Arquivar todos os alertas visíveis">
          <svg viewBox="0 0 24 24"><path d="M21 8v13H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
          Arquivar todos
        </button>
      </div>
    </div>

    <!-- Filtros por tipo -->
    <div class="filtros-wrap">
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

    <!-- Estado: carregando -->
    <div class="estado-alerta" id="estadoLoading">
      <div class="spinner-alertas"></div>
      <p>Verificando condições climáticas das suas propriedades...</p>
    </div>

    <!-- Estado: sem alertas -->
    <div class="estado-alerta" id="estadoVazio" style="display:none">
      <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <p>Nenhum alerta ativo para hoje.</p>
      <span>Suas propriedades estão com condições climáticas favoráveis.</span>
    </div>

    <!-- Estado: sem propriedades -->
    <div class="estado-alerta" id="estadoSemPropriedades" style="display:none">
      <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
      <p>Nenhuma propriedade cadastrada.</p>
      <span>Cadastre propriedades para receber alertas climáticos.</span>
    </div>

    <!-- Lista de alertas -->
    <div id="listaAlertas" style="display:none">
      <div id="containerAlertas"></div>
    </div>

  </main>
</div>

</body>
</html>