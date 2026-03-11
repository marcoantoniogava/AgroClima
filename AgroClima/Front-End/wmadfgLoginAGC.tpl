<!DOCTYPE html>
<html lang="pt-BR">
    
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgroClima ? Login</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet" />
  <script src="/sistema/jquery/jquery.min.js"></script>
  <!-- BEGIN BLOCK_CACHE -->
  <link rel="stylesheet" href="/sistema/templates/wmadfgAGC1css.css?vcache=[cache]">
  <script src="/sistema/templates/wmadfgLoginAGC.js?vcache=[cache]"></script>
  <!-- END BLOCK_CACHE -->
</head>
<body>

<div class="card">

  <!-- Logo -->
  <div class="logo-wrap">
    <img src="/sistema/templates/imgs/AGC_logo.png" alt="AgroClima" class="logo-img" />
  </div>

  <!-- Título da seção -->
  <div class="section-title">Entrar</div>

  <!-- Mensagem de erro geral (aparece no topo do formulário) -->
  <div class="banner" id="banner">
    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <span id="banner-msg"></span>
  </div>

  <!-- Formulário de login -->
  <div id="formWrap">

    <!-- Campo: E-mail -->
    <div class="field">
      <label for="email">E-mail</label>
      <div class="input-wrap">
        <span class="input-icon">
          <svg viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/></svg>
        </span>
        <input type="email" id="email" placeholder="Digite seu e-mail" autocomplete="email" />
      </div>
      <div class="erro-campo" id="email-err">Informe um e-mail válido.</div>
    </div>

    <!-- Campo: Senha -->
    <div class="field">
      <label for="senha">Senha</label>
      <div class="input-wrap">
        <span class="input-icon">
          <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </span>
        <input type="password" id="senha" placeholder="Digite sua senha" autocomplete="current-password" />
        <!-- Botão para mostrar/ocultar senha -->
        <button type="button" class="toggle-pw" id="toggleSenha" aria-label="Mostrar senha">
          <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
      <div class="erro-campo" id="senha-err">Informe sua senha.</div>
    </div>

    <!-- Botão de envio -->
    <button class="btn-primario" id="btnLogin" type="button">
      <div class="spinner"></div>
      <span class="btn-texto">Entrar</span>
    </button>

    <div class="divisor">ou</div>

    <div class="link-login">
      Não tem uma conta? <a href="wmadfgCadastroAGC">Criar conta</a>
    </div>
  </div>

</div>

</body>
</html>