<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroClima ? Propriedades</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="/sistema/jquery/jquery.min.js"></script>
  <!-- BEGIN BLOCK_CACHE -->
  <link rel="stylesheet" href="/sistema/templates/wmadfgAGC2css.css?vcache=[cache]">
  <script src="/sistema/templates/wmadfgPropriedadesAGC.js?vcache=[cache]"></script>
  <!-- END BLOCK_CACHE -->
</head>
<body>

<div class="layout">

  <!-- ???????????????????????????????
       SIDEBAR
  ??????????????????????????????? -->
  <aside class="sidebar">

    <!-- Logo -->
    <div class="sidebar-logo">
      <img src="/sistema/templates/imgs/AGC_logo.png" alt="AgroClima" />
    </div>

    <!-- Navegação -->
    <nav class="sidebar-nav">
      <a href="#" class="nav-item" id="nav-visao-geral">
        <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        Visão Geral
      </a>
      <a href="#" class="nav-item ativo" id="nav-propriedades">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        Propriedades
      </a>
      <a href="#" class="nav-item" id="nav-alertas">
        <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        Alertas
      </a>
      <a href="#" class="nav-item" id="nav-relatorios">
        <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Relatórios
      </a>
      <a href="#" class="nav-item" id="nav-configuracoes">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Configurações
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

  <!-- ???????????????????????????????
       CONTEÚDO PRINCIPAL
  ??????????????????????????????? -->
  <main class="conteudo">

    <!-- Cabeçalho da página -->
    <div class="pagina-cabecalho">
      <div>
        <h1 class="pagina-titulo">Propriedades</h1>
        <p class="pagina-sub">Gerencie suas propriedades agrícolas e monitore o clima em tempo real.</p>
      </div>
      <button class="btn-nova-propriedade" id="btnAbrirModal">
        <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nova propriedade
      </button>
    </div>

    <!-- Barra de busca -->
    <div class="barra-busca-wrap">
      <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input type="text" id="campoBusca" placeholder="Buscar por nome ou localização..." />
    </div>

    <!-- Tabela de propriedades -->
    <div class="tabela-wrap">
      <table id="tabelaPropriedades">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Localização</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody id="corpoTabela">
            <!-- Linhas carregadas dinamicamente pelo JS ao iniciar a página -->
        </tbody>
      </table>

      <!-- Mensagem quando não há propriedades ou busca sem resultado -->
      <div class="tabela-vazia" id="tabelaVazia">
        <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Nenhuma propriedade encontrada.</span>
      </div>
    </div>

  </main>
</div>

<!-- ???????????????????????????????
     MODAL ? Cadastro de Propriedade
??????????????????????????????? -->
<div class="modal-fundo" id="modalFundo">
  <div class="modal">

    <!-- Cabeçalho do modal -->
    <div class="modal-cabecalho">
      <h2 class="modal-titulo">Nova propriedade</h2>
      <button class="modal-fechar" id="btnFecharModal" aria-label="Fechar">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Corpo do modal -->
    <div class="modal-corpo">

      <!-- Banner de erro do modal -->
      <div class="banner" id="bannerModal">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span id="bannerModal-msg"></span>
      </div>

      <!-- Campo: Nome da propriedade -->
      <div class="field">
        <label for="nomePropriedade">Nome da propriedade</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          <input type="text" id="nomePropriedade" placeholder="Ex: Fazenda Santa Luzia" />
        </div>
        <div class="erro-campo" id="nomePropriedade-err">Informe o nome da propriedade.</div>
      </div>

      <!-- Campo: Busca de localização -->
      <div class="field">
        <label for="buscaLocalizacao">Localização</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input type="text" id="buscaLocalizacao" placeholder="Digite o nome da cidade..." />
          <!-- Spinner de busca -->
          <div class="spinner-busca" id="spinnerBusca"></div>
        </div>
        <div class="erro-campo" id="localizacao-err">Selecione uma localização válida da lista.</div>
      </div>

      <!-- Lista de resultados da API de geocoding -->
      <div class="lista-locais" id="listaLocais">
        <!-- Preenchida dinamicamente pelo JS após retorno da API Open-Meteo -->
      </div>

      <!-- Local selecionado (exibido após escolher da lista) -->
      <div class="local-selecionado" id="localSelecionado">
        <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <div class="local-selecionado-info">
          <span class="local-selecionado-nome" id="localSelecionadoNome"></span>
          <span class="local-selecionado-coords" id="localSelecionadoCoords"></span>
        </div>
        <button type="button" class="local-selecionado-remover" id="btnRemoverLocal" aria-label="Remover localização">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

    </div>

    <!-- Rodapé do modal -->
    <div class="modal-rodape">
      <button class="btn-cancelar" id="btnCancelarModal">Cancelar</button>
      <button class="btn-primario-modal" id="btnSalvarPropriedade">
        <div class="spinner"></div>
        <span class="btn-texto">Salvar propriedade</span>
      </button>
    </div>

  </div>
</div>

</body>
</html>