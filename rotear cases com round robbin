(async function () {
  const FILIPE = { nome: "Filipe Godoi", id: "4E5CF1FD-297A-F111-AB0E-7CED8D76ED49" };
  const USUARIOS = {
    "335": { nome: "Lucimara Cecilio", id: "75a55739-7b8a-ec11-93b0-000d3a64a5f1" },
    "337": { nome: "Bruna Giovanini", id: "7fdc629c-144f-ed11-bba3-000d3aba36db" },
    "338": { nome: "Matheus Silva", id: "d46857cf-606e-f011-b4cc-6045bde0e1bb" },
    "340": { nome: "Pablo Silva", id: "67f1a84e-7471-f011-b4cc-000d3adb1307" },
    "346": { nome: "Cristiana Roseto", id: "df619db6-3a77-eb11-a812-000d3adb5d0d" }
  };
  const CRISTINA = { nome: "Cristina Alves", id: "2ad29448-518c-ef11-ac20-6045bddd9c93" };
  const JULIANA = { nome: "Juliana Martins", id: "3a9d0168-4a04-f011-bae3-000d3ab0fedf" };
  const LILIAN = { nome: "Lilian Lopes", id: "d5ca6b9c-6350-f011-877b-000d3adf9cf8" };
  const DANILO = { nome: "Danilo Ageje",  id: "e085d30c-16bb-f111-aaaf-70a8a580a75b" };
  const NICOLE = { nome: "Nicole Chiva", id: "266b2bd9-25bc-f111-aaaf-e4fb1ef6e913" };

  const EMAIL_PRIORITY_HIGH = 859370002;
  const PRIORIDADES_EMAIL = [
    { value: 859370000, label: "🟢 Low" },
    { value: 859370001, label: "🟡 Normal" },
    { value: EMAIL_PRIORITY_HIGH, label: "🔴 High" }
  ];
  const prioridadeLabel = (v) => PRIORIDADES_EMAIL.find(p => Number(p.value) === Number(v))?.label || "Não definida";

  const FILA_ATENDIMENTO = [LILIAN];
  const FILA_346_TEMP = [USUARIOS["338"], USUARIOS["340"]];
  const REGEX_COTACAO = /cotac|cotar|orcament|amostra|sample/i;
  const REGEX_ATENDIMENTO = /fup|follow|release|pedido|purchase|posicao de entrega|posição de entrega|nota fiscal|ordem de compra|\bnf\b|boleto/i;
  const REGEX_LUCIMARA = /\b(weg|mwm|elgin)\b/i;
  const REGEX_JOST = /\b(jost|gsi)\b/i;
  const USUARIOS_MANUAIS = [FILIPE, USUARIOS["335"], USUARIOS["337"], USUARIOS["338"], USUARIOS["340"], USUARIOS["346"], CRISTINA, LILIAN, JULIANA, DANILO, NICOLE];

  const resultados = [];
  const cacheEmails = new Map();
  const cacheAnexos = new Map();
  const cacheContas = new Map();
  let processados = 0;
  let naoRoteados = 0;
  let erros = 0;
  let origemGrid = "queue";

  const normalizar = (s) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const guid = (s) => (s || "").replace(/[{}]/g, "").toLowerCase();
  const eh = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  const dataBR = (s) => { try { return s ? new Date(s).toLocaleString("pt-BR") : "-"; } catch { return s || "-"; } };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
      const slice = byteCharacters.slice(offset, offset + 1024);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // --- COMPONENTE DE LOADING TELA INICIAL ---
  let loadingOverlay = document.getElementById("fg-case-router-initial-loading");
  if (loadingOverlay) loadingOverlay.remove();

  loadingOverlay = document.createElement("div");
  loadingOverlay.id = "fg-case-router-initial-loading";
  loadingOverlay.style.cssText = "position:fixed;inset:0;z-index:9999999;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:'Segoe UI',Arial,sans-serif;";

  loadingOverlay.innerHTML = `
    <div style="width: 50px; height: 50px; border: 4px solid #f3f4f6; border-top: 4px solid #106ebe; border-radius: 50%; animation: fg-spin 1s linear infinite; margin-bottom: 20px;"></div>
    <div id="fg-loading-message" style="font-size: 18px; font-weight: 600; color: #1f2937;">Iniciando Central de Triagem...</div>
    <div id="fg-loading-submessage" style="font-size: 13px; color: #6b7280; margin-top: 8px;">Aguarde enquanto os Cases são lidos</div>
    <style>@keyframes fg-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(loadingOverlay);

  function updateLoading(msg, submsg) {
    const msgEl = document.getElementById("fg-loading-message");
    const submsgEl = document.getElementById("fg-loading-submessage");
    if (msgEl) msgEl.textContent = msg;
    if (submsgEl && submsg) submsgEl.textContent = submsg;
  }

  async function aguardarDynamicsEGrid() {
    const inicio = Date.now();
    const TIMEOUT_MS = 30000;
    const INTERVALO_MS = 350;
    const ESTABILIZACOES_NECESSARIAS = 4;

    updateLoading("Conectando ao Dynamics...", "Aguardando Web API");
    console.log("[ROUTER] Aguardando Dynamics e Web API...");

    while (Date.now() - inicio < TIMEOUT_MS) {
      if (window.Xrm?.WebApi?.retrieveRecord && window.Xrm?.WebApi?.updateRecord) break;
      await sleep(INTERVALO_MS);
    }

    if (!window.Xrm?.WebApi) {
      throw new Error("Xrm.WebApi não ficou disponível dentro de 30 segundos.");
    }

    updateLoading("Lendo a fila de Cases...", "Aguardando estabilização da grid");
    console.log("[ROUTER] Dynamics disponível. Aguardando grid...");

    let ultimaAssinatura = "";
    let consecutivas = 0;
    let ultimaQuantidade = 0;

    while (Date.now() - inicio < TIMEOUT_MS) {
      const rows = Array.from(document.querySelectorAll(".ag-row"));
      const assinatura = rows.map(row => [
        row.getAttribute("row-id") || "",
        row.querySelector('[col-id="title"]')?.innerText?.trim() || "",
        row.querySelector('[col-id*="ticketnumber"]')?.innerText?.trim() || ""
      ].join("|")).join("||");

      if (rows.length > 0 && assinatura && assinatura === ultimaAssinatura) {
        consecutivas++;
      } else {
        consecutivas = 0;
      }

      if (rows.length !== ultimaQuantidade) {
        console.log(`[ROUTER] ${rows.length} linha(s) detectada(s)...`);
        ultimaQuantidade = rows.length;
      }

      if (rows.length > 0 && consecutivas >= ESTABILIZACOES_NECESSARIAS) {
        console.log(`[ROUTER] Grid estabilizada com ${rows.length} linha(s).`);
        return rows;
      }

      ultimaAssinatura = assinatura;
      await sleep(INTERVALO_MS);
    }

    const rowsFinais = Array.from(document.querySelectorAll(".ag-row"));
    if (rowsFinais.length > 0) {
      console.warn(`[ROUTER] Timeout de estabilização. Prosseguindo com ${rowsFinais.length} linha(s) visíveis.`);
      return rowsFinais;
    }

    throw new Error("Nenhuma linha foi encontrada na grid após aguardar 30 segundos.");
  }

  async function resolverCaseDaLinha(row) {
    const rowId = guid(row.getAttribute("row-id") || "");
    if (!rowId) throw new Error("ID da linha não encontrado.");
    try { const qi = await Xrm.WebApi.retrieveRecord("queueitem", rowId, "?$select=_objectid_value"); const id = guid(qi._objectid_value || ""); if (id) return { caseId: id, origem: "queueitem" }; } catch {}
    try { const inc = await Xrm.WebApi.retrieveRecord("incident", rowId, "?$select=incidentid,ticketnumber,title"); return { caseId: guid(inc.incidentid || rowId), origem: "incident", incident: inc }; } catch {}
    throw new Error(`Não foi possível identificar o Case da linha ${rowId}.`);
  }

  function proximo(storageKey, fila) {
    if (!fila.length) return null;
    let i = Number(localStorage.getItem(storageKey) || 0);
    if (!Number.isFinite(i) || i < 0 || i >= fila.length) i = 0;
    const u = fila[i];
    localStorage.setItem(storageKey, String((i + 1) % fila.length));
    return u;
  }

  // --- FUNÇÕES DE AUDITORIA E PROTEÇÃO DE SPAM ---
  async function obterOwnerAtual(caseId) {
    try {
      const inc = await Xrm.WebApi.retrieveRecord("incident", caseId, "?$select=_ownerid_value");
      return guid(inc._ownerid_value || "");
    } catch (e) {
      return null;
    }
  }

  async function registrarNotaRoteamento(caseId, nomeDestino, regra, detalheRegra, manual, ticket, codigo) {
    try {
      const context = typeof Xrm !== "undefined" && Xrm.Utility ? Xrm.Utility.getGlobalContext() : null;
      const executadoPor = context && context.userSettings ? context.userSettings.userName : "Usuário Atual";
      const tipo = manual ? "Roteamento Manual (Painel)" : "Roteamento Automático (Script)";
      const dataHora = new Date().toLocaleString("pt-BR");

      const notetext = `Data/Hora: ${dataHora}
Destino: ${nomeDestino}
Regra: ${regra}
Detalhe: ${detalheRegra}
Ticket: ${ticket || "-"}
Território: ${codigo || "-"}
Enviado por: ${executadoPor}
Executado via: Script FG Case Router v5.7`;

      const anotacao = {
        subject: tipo,
        notetext: notetext,
        "objectid_incident@odata.bind": `/incidents(${caseId})`
      };
      await Xrm.WebApi.createRecord("annotation", anotacao);
    } catch (e) {
      console.warn(`[ROUTER] Não foi possível criar nota na timeline para o case ${caseId}:`, e);
    }
  }

  document.getElementById("fg-case-router-overlay")?.remove();
  document.getElementById("fg-case-router-mini")?.remove();
  document.getElementById("fg-case-router-style")?.remove();

  try {
    console.clear();
    console.log("[ROUTER] V5.7 iniciada (Auto-Prioridade High para High Potential Customer).");
    const rows = await aguardarDynamicsEGrid();
    console.log(`[ROUTER] Iniciando processamento de ${rows.length} Case(s).`);

    let indiceProcessamento = 0;
    for (const row of rows) {
      indiceProcessamento++;
      updateLoading(`Roteando Cases... (${indiceProcessamento}/${rows.length})`, "Analisando regras e territórios");
      console.log(`[ROUTER] Processando ${indiceProcessamento}/${rows.length}...`);
      let titulo = "", territorio = "", fila = "", ticket = "", codigo = "", caseId = null;
      try {
        titulo = row.querySelector('[col-id="title"]')?.innerText?.trim() || "";
        territorio = row.querySelector('[col-id*="ess_caseaccountsalesterritory"]')?.innerText?.trim() || "";
        fila = row.querySelector('[col-id="queueid"]')?.innerText?.trim() || "";
        ticket = row.querySelector('[col-id*="ticketnumber"]')?.innerText?.trim() || "";
        if (!titulo) continue;

        const tituloN = normalizar(titulo);
        codigo = territorio.match(/\((\d+)\)/)?.[1] || "";
        const resolvido = await resolverCaseDaLinha(row); caseId = resolvido.caseId;

        if (resolvido.origem === "incident") {
          origemGrid = "incident"; titulo = titulo || resolvido.incident?.title || ""; ticket = ticket || resolvido.incident?.ticketnumber || ""; naoRoteados++;
          resultados.push({ status: "pendente", ticket, titulo, territorio, codigo, fila, caseId, usuario: null, regra: "Case carregado da view", detalheRegra: "Você pode classificar ou distribuir este Case pelo painel.", erro: null, caseReason: null, emailPriority: null, customerCategory: null, highPotentialCustomer: null, isHighPotential: false });
          continue;
        }

        let usuario = null, regra = "", detalheRegra = "";

        if (fila === "CBR Exports") {
          usuario = FILIPE; regra = "Fila CBR Exports"; detalheRegra = "Case identificado na fila CBR Exports.";
        } else if (REGEX_JOST.test(tituloN)) {
          usuario = USUARIOS["337"]; regra = "Cliente JOST"; detalheRegra = "Palavra-chave JOST/GSI identificada no título. Prioridade para Bruna Giovanini.";
        } else if (codigo === "335" || REGEX_LUCIMARA.test(tituloN)) {
          usuario = USUARIOS["335"];
          regra = codigo === "335" ? "Território 335" : "Palavra-chave WEG/MWM/ELGIN";
          detalheRegra = codigo === "335" ? "Case pertence ao território 335." : "Título contém WEG, MWM ou ELGIN.";
        } else if (codigo === "337") {
          usuario = USUARIOS["337"]; regra = "Território 337"; detalheRegra = "Case pertence ao território 337.";
        } else if (REGEX_ATENDIMENTO.test(tituloN)) {
          usuario = proximo("rr_atendimento", FILA_ATENDIMENTO); regra = "Atendimento Comercial";
          detalheRegra = usuario ? "Título identificado como atendimento comercial." : "Fila de Atendimento Comercial sem usuários disponíveis.";
        } else if (codigo === "336") {
          usuario = proximo("rr_atendimento", FILA_ATENDIMENTO); regra = "Território 336 - Atendimento Comercial";
          detalheRegra = usuario ? "Direcionado para o rodízio de Atendimento Comercial." : "Fila de Atendimento Comercial sem usuários disponíveis.";
        } else if (["338", "340", "343", "344", "346"].includes(codigo)) {
          if (REGEX_COTACAO.test(tituloN)) {
            if (codigo === "346") {
              usuario = proximo("rr_346_temp", FILA_346_TEMP);
              regra = "Cotação - Território 346 (cobertura temporária)";
              detalheRegra = "Cristiana ausente. Rodízio entre Matheus e Pablo.";
            } else if (codigo === "343") {
              usuario = DANILO; regra = "Cotação - Território 343"; detalheRegra = "Título identificado como cotação.";
            } else if (codigo === "344") {
              usuario = NICOLE; regra = "Cotação - Território 344"; detalheRegra = "Título identificado como cotação.";
            } else {
              usuario = USUARIOS[codigo]; regra = `Cotação - Território ${codigo}`; detalheRegra = "Título identificado como cotação.";
            }
          } else {
            regra = `Território ${codigo}`; detalheRegra = "Território identificado, porém o título não foi classificado como cotação.";
          }
        }

        if (!usuario) {
          naoRoteados++;
          if (!regra) { regra = "Nenhuma regra encontrada"; detalheRegra = codigo ? `O território ${codigo} não possui regra aplicável para este título.` : "Não foi possível identificar uma regra de roteamento."; }
          resultados.push({ status: "pendente", ticket, titulo, territorio, codigo, fila, caseId, usuario: null, regra, detalheRegra, erro: null, emailPriority: null, customerCategory: null, highPotentialCustomer: null, isHighPotential: false });
          continue;
        }

        // --- PREVENÇÃO DE SPAM ---
        const ownerAtual = await obterOwnerAtual(caseId);
        if (ownerAtual && ownerAtual === guid(usuario.id)) {
          console.log(`[ROUTER] Case ${caseId} já atribuído a ${usuario.nome}. Nenhuma ação necessária.`);
          detalheRegra += " (Já estava com este usuário, roteamento ignorado para evitar spam).";
          processados++;
          resultados.push({ status: "roteado", ticket, titulo, territorio, codigo, fila, caseId, usuario, regra, detalheRegra, erro: null, emailPriority: null, customerCategory: null, highPotentialCustomer: null, isHighPotential: false });
          continue;
        }

        // Alteração Real de Owner
        await Xrm.WebApi.updateRecord("incident", caseId, { "ownerid@odata.bind": `/systemusers(${usuario.id})` });

        // Adiciona Nota na Timeline
        await registrarNotaRoteamento(caseId, usuario.nome, regra, detalheRegra, false, ticket, codigo);

        processados++;
        resultados.push({ status: "roteado", ticket, titulo, territorio, codigo, fila, caseId, usuario, regra, detalheRegra, erro: null, emailPriority: null, customerCategory: null, highPotentialCustomer: null, isHighPotential: false });
      } catch (e) {
        erros++;
        resultados.push({ status: "erro", ticket, titulo, territorio, codigo, fila, caseId, usuario: null, regra: "Erro durante processamento", detalheRegra: e?.message || String(e), erro: e?.message || String(e), emailPriority: null, customerCategory: null, highPotentialCustomer: null, isHighPotential: false });
        console.error("Erro ao processar linha:", e);
      }
    }

    console.log(`[ROUTER] Concluído. ✅ ${processados} roteado(s), ⚠ ${naoRoteados} pendente(s), ❌ ${erros} erro(s).`);
    if (loadingOverlay) loadingOverlay.remove();
    abrirPainel();
  } catch (e) {
    if (loadingOverlay) loadingOverlay.remove();
    console.error(e);
    alert("Erro geral: " + (e?.message || String(e)));
  }

  async function abrirPainel() {
    let filtroAtual = "todos";
    let buscaAtual = "";
    let buscaAnexoAtual = "";
    let anexosIndexados = false;
    let selecionado = null;
    const selecionados = new Set();
    let junkQueueId = null;
    let baseClientes = [];
    let baseMeta = null;
    const DB_NAME = "fg_case_router_db", STORE_NAME = "config", BASE_KEY = "base_clientes";

    function abrirDB(){return new Promise((ok,fail)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE_NAME))r.result.createObjectStore(STORE_NAME)};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error)})}
    async function dbGet(k){const db=await abrirDB();return new Promise((ok,fail)=>{const r=db.transaction(STORE_NAME,"readonly").objectStore(STORE_NAME).get(k);r.onsuccess=()=>{db.close();ok(r.result)};r.onerror=()=>{db.close();fail(r.error)}})}
    async function dbSet(k,v){const db=await abrirDB();return new Promise((ok,fail)=>{const tx=db.transaction(STORE_NAME,"readwrite");tx.objectStore(STORE_NAME).put(v,k);tx.oncomplete=()=>{db.close();ok()};tx.onerror=()=>{db.close();fail(tx.error)}})}
    function campo(o,nomes){const m={};Object.keys(o||{}).forEach(k=>m[normalizar(k).replace(/[^a-z0-9]/g,"")]=k);for(const n of nomes){const k=m[normalizar(n).replace(/[^a-z0-9]/g,"")];if(k)return o[k]}return ""}
    function prepararCliente(row){const c={ccust:String(campo(row,["CCUST","CCUS"])||"").trim(),cnme:String(campo(row,["CNME"])||"").trim(),grupo:String(campo(row,["GRUPO"])||"").trim(),cnpj:String(campo(row,["CNPJ"])||"").trim(),csal:String(campo(row,["CSAL"])||"").trim(),salesperson:String(campo(row,["SALESPERSON","SALESPERSO"])||"").trim(),regiao:String(campo(row,["REGIAO"])||"").trim(),categoria:String(campo(row,["CUSTOMER CATEGORY","CUSTOMER CATEGO"])||"").trim()};c._busca=normalizar([c.ccust,c.cnme,c.grupo,c.cnpj,c.csal].join(" ")).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();return c}
    async function carregarBaseSalva(){try{const x=await dbGet(BASE_KEY);if(x?.clientes?.length){baseClientes=x.clientes;baseMeta=x.meta||null}}catch(e){console.warn("Base salva indisponível",e)}}
    function carregarXLSX(){if(window.XLSX)return Promise.resolve(window.XLSX);return new Promise((ok,fail)=>{const existente=document.getElementById("fg-sheetjs");if(existente){const timer=setInterval(()=>{if(window.XLSX){clearInterval(timer);ok(window.XLSX)}},100);setTimeout(()=>{clearInterval(timer);if(!window.XLSX)fail(new Error("Biblioteca XLSX não carregou."))},15000);return}const sc=document.createElement("script");sc.id="fg-sheetjs";sc.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";sc.onload=()=>window.XLSX?ok(window.XLSX):fail(new Error("XLSX indisponível"));sc.onerror=()=>fail(new Error("O Dynamics/navegador bloqueou a biblioteca XLSX."));document.head.appendChild(sc)})}
    async function importarBase(file){const XLSX=await carregarXLSX(),wb=XLSX.read(await file.arrayBuffer(),{type:"array"});let esc=null;for(const n of wb.SheetNames){const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{defval:"",raw:false});if(!rows.length)continue;const ks=Object.keys(rows[0]).map(k=>normalizar(k).replace(/[^a-z0-9]/g,""));if(ks.includes("cnme")&&ks.includes("csal")){esc={n,rows};break}}if(!esc)throw new Error("Não encontrei uma aba com CNME e CSAL.");baseClientes=esc.rows.map(prepararCliente).filter(c=>c.cnme);baseMeta={arquivo:file.name,aba:esc.n,atualizadoEm:new Date().toISOString(),quantidade:baseClientes.length};await dbSet(BASE_KEY,{clientes:baseClientes,meta:baseMeta});return baseMeta}
    function usuarioCSAL(v){const c=String(v||"").match(/\d+/)?.[0]||"";return USUARIOS[c]||null}
    function pesquisaClientes(termo, limite=20){const textoOriginal=String(termo||"").trim();if(!textoOriginal)return[];const digitos=textoOriginal.replace(/\D/g,"");if(digitos.length===14){const ex=baseClientes.filter(c=>String(c.cnpj||"").replace(/\D/g,"")===digitos);if(ex.length)return ex.slice(0,limite)}if(digitos.length>=6){const ex=baseClientes.filter(c=>String(c.ccust||"").replace(/\D/g,"")===digitos);if(ex.length)return ex.slice(0,limite)}if(/^[\d.\-\/\s]+$/.test(textoOriginal))return[];const q=normalizar(textoOriginal).replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();if(!q)return[];const nomeExato=baseClientes.filter(c=>normalizar(c.cnme).replace(/\s+/g," ").trim()===q);if(nomeExato.length)return nomeExato.slice(0,limite);const contendo=baseClientes.filter(c=>normalizar(c.cnme).includes(q)||normalizar(c.grupo||"").includes(q));if(contendo.length)return contendo.slice(0,limite);const palavras=q.split(" ").filter(x=>x.length>=3);if(!palavras.length)return[];return baseClientes.map(c=>{const texto=normalizar([c.cnme,c.grupo].filter(Boolean).join(" "));const hits=palavras.filter(x=>texto.includes(x)).length;return{c,score:hits/palavras.length}}).filter(x=>x.score>=.6).sort((a,b)=>b.score-a.score).slice(0,limite).map(x=>x.c)}

    async function obterJunkQueueId() {
      if (junkQueueId) return junkQueueId;
      const r = await Xrm.WebApi.retrieveMultipleRecords("queue", "?$select=queueid,name&$filter=name eq 'Junk'&$top=2");
      if (!r.entities?.length) throw new Error("Queue 'Junk' não encontrada.");
      if (r.entities.length > 1) console.warn("Mais de uma Queue chamada Junk encontrada; usando a primeira.", r.entities);
      junkQueueId = guid(r.entities[0].queueid);
      return junkQueueId;
    }

    async function enviarParaJunk(caseId) {
      const queueId = await obterJunkQueueId();
      const clientUrl = Xrm.Utility.getGlobalContext().getClientUrl();
      const url = `${clientUrl}/api/data/v9.2/queues(${queueId})/Microsoft.Dynamics.CRM.AddToQueue`;
      const resp = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Accept": "application/json", "Content-Type": "application/json; charset=utf-8", "OData-MaxVersion": "4.0", "OData-Version": "4.0" },
        body: JSON.stringify({ Target: { "@odata.type": "Microsoft.Dynamics.CRM.incident", incidentid: guid(caseId) } })
      });
      if (!resp.ok) { let msg = `${resp.status} ${resp.statusText}`; try { const j = await resp.json(); msg = j?.error?.message || msg; } catch {} throw new Error(msg); }
      return true;
    }

    async function rotearParaDestino(item, destinoValue) {
      if (!item?.caseId) throw new Error("Case ID não disponível.");

      if (destinoValue === "queue:junk") {
        await enviarParaJunk(item.caseId);
        await registrarNotaRoteamento(item.caseId, "Queue Junk", "Roteamento manual", "Enviado manualmente para a Queue Junk.", true, item.ticket, item.codigo);

        item.status = "roteado"; item.usuario = { nome: "Junk", tipo: "queue" }; item.regra = "Roteamento manual"; item.detalheRegra = "Enviado manualmente para a Queue Junk."; item.erro = null;
        return "Junk";
      }

      const usuario = USUARIOS_MANUAIS.find(u => guid(u.id) === guid(destinoValue));
      if (!usuario) throw new Error("Destino não encontrado.");

      const ownerAtual = await obterOwnerAtual(item.caseId);
      if (ownerAtual && ownerAtual === guid(usuario.id)) {
        item.status = "roteado"; item.usuario = usuario; item.regra = "Roteamento manual";
        item.detalheRegra = `O Case já estava com ${usuario.nome}. Nenhuma alteração foi feita.`; item.erro = null;
        return usuario.nome;
      }

      await Xrm.WebApi.updateRecord("incident", item.caseId, { "ownerid@odata.bind": `/systemusers(${usuario.id})` });
      await registrarNotaRoteamento(item.caseId, usuario.nome, "Roteamento manual", `Roteado manualmente via painel para ${usuario.nome}.`, true, item.ticket, item.codigo);

      item.status = "roteado"; item.usuario = usuario; item.regra = "Roteamento manual"; item.detalheRegra = `Roteado manualmente para ${usuario.nome}.`; item.erro = null;
      return usuario.nome;
    }

    let cacheSubjects = null;
    async function buscarSubjects(){ if(cacheSubjects) return cacheSubjects; const r=await Xrm.WebApi.retrieveMultipleRecords("subject","?$select=subjectid,title,_parentsubject_value&$orderby=title asc",5000); cacheSubjects=(r.entities||[]).filter(x=>x.subjectid&&x.title); return cacheSubjects; }

    async function obterDadosConta(accountId) {
      accountId = guid(accountId);
      if (!accountId) return { customerCategory: null, highPotentialCustomer: null, isHighPotential: false };
      if (cacheContas.has(accountId)) return cacheContas.get(accountId);
      try {
        const acc = await Xrm.WebApi.retrieveRecord("account", accountId, "?$select=ess_customercategory,ess_highpotentialcustomer");
        const hpTexto = acc["ess_highpotentialcustomer@OData.Community.Display.V1.FormattedValue"] ?? (acc.ess_highpotentialcustomer === true ? "Yes" : acc.ess_highpotentialcustomer === false ? "No" : null);
        const isHighPotential = acc.ess_highpotentialcustomer === true || /^(yes|sim)$/i.test(String(hpTexto || "").trim());
        const dados = {
          customerCategory: acc["ess_customercategory@OData.Community.Display.V1.FormattedValue"] ?? (acc.ess_customercategory != null ? String(acc.ess_customercategory) : null),
          highPotentialCustomer: hpTexto,
          isHighPotential
        };
        cacheContas.set(accountId, dados);
        return dados;
      } catch (e) {
        console.warn("[ROUTER] Não foi possível ler dados da conta:", accountId, e);
        const vazio = { customerCategory: null, highPotentialCustomer: null, isHighPotential: false };
        cacheContas.set(accountId, vazio);
        return vazio;
      }
    }

    async function obterDadosExtrasCase(caseId) {
      const r = await Xrm.WebApi.retrieveRecord("incident", caseId, "?$select=_subjectid_value,ess_emailpriority,_customerid_value");
      const id = guid(r._subjectid_value || "");
      let caseReason = null;
      if (id) {
        const ss = await buscarSubjects();
        const x = ss.find(a => guid(a.subjectid) === id);
        if (x) caseReason = { id: guid(x.subjectid), title: x.title };
      }

      let conta = { customerCategory: null, highPotentialCustomer: null, isHighPotential: false };
      const customerId = guid(r._customerid_value || "");
      const customerTipo = r["_customerid_value@Microsoft.Dynamics.CRM.lookuplogicalname"] || "";
      if (customerId) {
        if (!customerTipo || customerTipo === "account") {
          conta = await obterDadosConta(customerId);
        } else if (customerTipo === "contact") {
          try {
            const ct = await Xrm.WebApi.retrieveRecord("contact", customerId, "?$select=_parentcustomerid_value");
            const parentId = guid(ct._parentcustomerid_value || "");
            const parentTipo = ct["_parentcustomerid_value@Microsoft.Dynamics.CRM.lookuplogicalname"] || "";
            if (parentId && (!parentTipo || parentTipo === "account")) {
              conta = await obterDadosConta(parentId);
            }
          } catch (e) {
            console.warn("[ROUTER] Não foi possível ler conta pai do contato:", customerId, e);
          }
        }
      }

      return {
        caseReason,
        emailPriority: r.ess_emailpriority ?? null,
        customerCategory: conta.customerCategory,
        highPotentialCustomer: conta.highPotentialCustomer,
        isHighPotential: conta.isHighPotential
      };
    }

    async function definirEmailPriority(caseId, priorityValue) {
      caseId = guid(caseId);
      const val = Number(priorityValue);
      await Xrm.WebApi.updateRecord("incident", caseId, { ess_emailpriority: val });
      return val;
    }

    const EMAIL_STATUS_CUSTOMER_RESPONDED=971970002, CASE_STATUS_IN_PROGRESS=1;
    async function lerEstadoClassificacao(caseId) {
      const r = await Xrm.WebApi.retrieveRecord("incident", guid(caseId), "?$select=_subjectid_value,cuk_emailstatus,statuscode");
      return { subjectId: guid(r._subjectid_value || ""), emailStatus: r.cuk_emailstatus, statusCode: r.statuscode };
    }

    async function classificarCase(caseId, subjectId) {
      caseId = guid(caseId); subjectId = guid(subjectId);
      await Xrm.WebApi.updateRecord("incident", caseId, {
        "subjectid@odata.bind": `/subjects(${subjectId})`,
        cuk_emailstatus: EMAIL_STATUS_CUSTOMER_RESPONDED,
        statuscode: CASE_STATUS_IN_PROGRESS
      });
      await sleep(250);
      const gravado = await lerEstadoClassificacao(caseId);
      const divergencias = [];
      if (gravado.subjectId !== subjectId) divergencias.push("Case Reason não foi confirmado");
      if (Number(gravado.emailStatus) !== EMAIL_STATUS_CUSTOMER_RESPONDED) divergencias.push("Email status não ficou como Customer has responded");
      if (Number(gravado.statusCode) !== CASE_STATUS_IN_PROGRESS) divergencias.push("Case Status não ficou como In Progress");
      if (divergencias.length) {
        const e = new Error("Classificação não confirmada no Case: " + divergencias.join("; ") + ". Verifique os campos obrigatórios do Case, como Cliente/Customer, e tente novamente.");
        e.name = "ClassificacaoNaoConfirmada";
        e.verificacao = gravado;
        throw e;
      }
      return gravado;
    }

    const style = document.createElement("style");
    style.id = "fg-case-router-style";
    style.textContent = `
#fg-case-router-overlay{position:fixed;inset:0;z-index:999999;background:rgba(20,20,20,.46);display:flex;align-items:center;justify-content:center;font-family:"Segoe UI",Arial,sans-serif}
#fg-case-router-modal{width:94vw;height:90vh;max-width:1500px;background:#fff;border-radius:14px;box-shadow:0 18px 60px rgba(0,0,0,.28);overflow:hidden;display:flex;flex-direction:column}
.fg-header{padding:15px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e5e7eb}.fg-header-title{font-size:20px;font-weight:600;color:#1f2937}.fg-header-subtitle{font-size:11px;color:#6b7280;margin-top:2px}.fg-header-actions{display:flex;gap:4px}.fg-window-button{width:38px;height:38px;border:0;background:transparent;border-radius:7px;cursor:pointer;font-size:22px;color:#6b7280}.fg-window-button:hover{background:#f3f4f6}
.fg-summary{padding:12px 20px;display:flex;gap:10px;flex-wrap:wrap;background:#fafafa;border-bottom:1px solid #e5e7eb}.fg-card{padding:8px 13px;border-radius:8px;font-size:12px;font-weight:600}.fg-card-total{background:#eef2ff;color:#3730a3}.fg-card-ok{background:#ecfdf5;color:#047857}.fg-card-warning{background:#fffbeb;color:#b45309}.fg-card-error{background:#fef2f2;color:#b91c1c}
.fg-toolbar{padding:11px 20px;display:flex;gap:7px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #e5e7eb}.fg-filter{border:1px solid #d1d5db;background:#fff;padding:7px 11px;border-radius:7px;cursor:pointer;font-size:12px}.fg-filter.active{background:#106ebe;color:#fff;border-color:#106ebe}.fg-search{margin-left:auto;width:260px;border:1px solid #d1d5db;border-radius:7px;padding:8px 11px;outline:none}.fg-search-att{width:230px;border:1px solid #d1d5db;border-radius:7px;padding:8px 11px;outline:none}.fg-search-att:focus{border-color:#106ebe}
.fg-body{flex:1;min-height:0;display:grid;grid-template-columns:minmax(340px,42%) 1fr}.fg-list{overflow-y:auto;border-right:1px solid #e5e7eb;background:#fafafa}.fg-item{padding:13px 16px;border-bottom:1px solid #e5e7eb;cursor:pointer;background:#fff}.fg-item:hover{background:#f8fafc}.fg-item.selected{background:#eff6ff;border-left:4px solid #106ebe;padding-left:12px}.fg-ticket{font-weight:650;color:#111827;font-size:13px}.fg-title{margin:5px 0;color:#374151;font-size:13px}.fg-meta{font-size:11px;line-height:1.5;color:#6b7280}.fg-badge{display:inline-block;padding:3px 7px;border-radius:12px;font-size:10px;font-weight:700}.fg-badge-ok{background:#d1fae5;color:#065f46}.fg-badge-warning{background:#fef3c7;color:#92400e}.fg-badge-error{background:#fee2e2;color:#991b1b}.fg-badge-cat{background:#e0f2fe;color:#075985;margin-left:5px}.fg-badge-hp{background:#fce7f3;color:#9d174d;margin-left:5px}
.fg-detail{padding:20px 24px;overflow-y:auto}.fg-empty{height:100%;min-height:100px;display:flex;align-items:center;justify-content:center;text-align:center;color:#9ca3af;padding:25px}.fg-section{margin-bottom:24px}.fg-section-title{margin-bottom:9px;text-transform:uppercase;font-size:11px;font-weight:700;letter-spacing:.05em;color:#6b7280}.fg-case-title{font-size:19px;font-weight:650;color:#111827;margin-bottom:5px}.fg-case-subject{color:#4b5563;font-size:14px;line-height:1.5}.fg-info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.fg-info{background:#f9fafb;border-radius:7px;padding:9px 11px}.fg-info-label{font-size:10px;color:#6b7280;text-transform:uppercase;margin-bottom:2px}.fg-info-value{font-size:13px;color:#111827;overflow-wrap:anywhere}.fg-rule{background:#f0f7ff;padding:12px;border-radius:8px;border-left:3px solid #106ebe;font-size:13px;line-height:1.5}
.fg-routing{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fg-select{min-width:250px;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;background:#fff}.fg-btn{border:0;padding:8px 14px;border-radius:7px;cursor:pointer;font-weight:600;font-size:12px}.fg-btn-primary{color:#fff;background:#106ebe}.fg-btn-primary:hover{background:#005a9e}.fg-btn-secondary{color:#374151;background:#f3f4f6}.fg-btn-secondary:hover{background:#e5e7eb}.fg-btn:disabled{cursor:not-allowed;opacity:.6}
.fg-email-loading{padding:18px;text-align:center;color:#6b7280;background:#f9fafb;border-radius:8px}.fg-email-error{padding:12px;background:#fef2f2;color:#991b1b;border-radius:8px;font-size:12px;line-height:1.5}.fg-email{margin-bottom:10px;overflow:hidden;border:1px solid #e5e7eb;border-radius:9px;background:#fff}.fg-email-header{background:#f9fafb;padding:11px 13px;cursor:pointer}.fg-email-header:hover{background:#f3f4f6}.fg-email-subject{font-size:13px;font-weight:650;color:#1f2937}.fg-email-date{margin-top:4px;font-size:11px;color:#6b7280}.fg-email-content{display:none;background:#fff;border-top:1px solid #e5e7eb}.fg-email.open .fg-email-content{display:block}.fg-email-toolbar{display:flex;justify-content:space-between;padding:7px 10px;background:#fafafa;border-bottom:1px solid #e5e7eb;font-size:10px;color:#6b7280}.fg-email-frame{display:block;width:100%;height:520px;border:0;background:#fff}
.fg-att-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.fg-att-badge{font-size:11px;background:#e5e7eb;color:#374151;padding:4px 9px;border-radius:6px;display:inline-flex;align-items:center;gap:4px;border:1px solid #d1d5db;cursor:pointer;transition:.15s;font-weight:600}.fg-att-badge:hover{background:#d1d5db;transform:translateY(-1px)}.fg-att-badge.match{background:#d1fae5;border-color:#059669;color:#047857}.fg-att-badge.match:hover{background:#a7f3d0}
.fg-class-box{border:1px solid #dbe3ec;border-radius:9px;padding:12px;background:#fff}.fg-class-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fg-class-search{flex:1;min-width:220px;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px}.fg-class-results{max-height:220px;overflow:auto;margin-top:8px}.fg-class-option{padding:8px;border-bottom:1px solid #eee;cursor:pointer;font-size:12px}.fg-class-option:hover,.fg-class-option.selected{background:#eff6ff}.fg-class-current{font-size:12px;color:#374151;margin-bottom:8px}.fg-client-box{border:1px solid #dbe3ec;border-radius:9px;padding:12px;background:#fbfdff}.fg-client-top{display:flex;gap:8px;flex-wrap:wrap}.fg-client-search{flex:1;min-width:240px;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px}.fg-base-status{font-size:11px;color:#6b7280;margin:7px 0}.fg-client-result{border-top:1px solid #e5e7eb;padding:10px 2px}.fg-client-name{font-size:13px;font-weight:650}.fg-client-meta{font-size:11px;color:#6b7280;line-height:1.55}.fg-suggest{margin-top:6px;padding:7px 9px;background:#ecfdf5;color:#065f46;border-radius:6px;font-size:12px}.fg-check{margin-right:8px;accent-color:#106ebe}.fg-bulk{padding:10px 20px;border-bottom:1px solid #e5e7eb;background:#f0f7ff;display:flex;gap:8px;align-items:center;flex-wrap:wrap}.fg-bulk-count{font-weight:650;font-size:12px;color:#1f2937}.fg-bulk-select{min-width:190px;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;background:white}.fg-footer{padding:10px 20px;border-top:1px solid #e5e7eb;background:#fafafa;display:flex;justify-content:flex-end;gap:8px}
#fg-case-router-mini{position:fixed;right:24px;bottom:24px;z-index:1000000;min-width:250px;max-width:380px;padding:11px 15px;border:1px solid #d1d5db;border-radius:10px;background:#fff;box-shadow:0 8px 28px rgba(0,0,0,.24);cursor:pointer;font-family:"Segoe UI",Arial,sans-serif;display:none}.fg-mini-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:650;color:#1f2937;font-size:13px}.fg-mini-info{margin-top:4px;font-size:11px;color:#6b7280}
@media(max-width:850px){#fg-case-router-modal{width:98vw;height:96vh}.fg-body{grid-template-columns:1fr}.fg-list{max-height:38vh;border-right:none;border-bottom:1px solid #e5e7eb}.fg-search,.fg-search-att{width:100%;margin-left:0}.fg-email-frame{height:420px}}
`;
    document.head.appendChild(style);

    const overlay = document.createElement("div"); overlay.id = "fg-case-router-overlay";
    const modal = document.createElement("div"); modal.id = "fg-case-router-modal";
    modal.innerHTML = `
<div class="fg-header"><div><div class="fg-header-title">Resultado do Roteamento</div><div class="fg-header-subtitle">Central de triagem de Cases</div></div><div class="fg-header-actions"><button id="fg-minimize" class="fg-window-button" title="Minimizar">−</button><button id="fg-close" class="fg-window-button" title="Fechar">×</button></div></div>
<div class="fg-summary" id="fg-summary"></div>
<div class="fg-toolbar"><button class="fg-filter active" data-filter="todos">Todos</button><button class="fg-filter" data-filter="roteado">✅ Roteados</button><button class="fg-filter" data-filter="pendente">⚠ Não roteados</button><button class="fg-filter" data-filter="erro">❌ Erros</button><input id="fg-search" class="fg-search" placeholder="Buscar ticket, título, categoria..."><input id="fg-search-att" class="fg-search-att" placeholder="📎 Filtrar anexo (ex: pdf, xml)..."></div>
<div class="fg-bulk"><span class="fg-bulk-count" id="fg-bulk-count">0 selecionados</span><button class="fg-btn fg-btn-secondary" id="fg-select-visible">Selecionar visíveis</button><button class="fg-btn fg-btn-secondary" id="fg-select-pending">Selecionar pendentes</button><button class="fg-btn fg-btn-secondary" id="fg-clear-selection">Limpar seleção</button><select id="fg-bulk-dest" class="fg-bulk-select"><option value="">Selecione o destino</option></select><button class="fg-btn fg-btn-primary" id="fg-bulk-route">ROTEAR SELECIONADOS</button><select id="fg-bulk-reason" class="fg-bulk-select"><option value="">Selecione o Case Reason</option></select><button class="fg-btn fg-btn-secondary" id="fg-bulk-classify">CLASSIFICAR SELECIONADOS</button><select id="fg-bulk-priority" class="fg-bulk-select"><option value="">Selecione a Prioridade</option></select><button class="fg-btn fg-btn-secondary" id="fg-bulk-set-priority">DEFINIR PRIORIDADE</button></div>
<div class="fg-body"><div class="fg-list" id="fg-list"></div><div class="fg-detail" id="fg-detail"><div class="fg-empty">Selecione um Case para visualizar os detalhes.</div></div></div>
<div class="fg-footer"><button id="fg-refresh-list" class="fg-btn fg-btn-secondary">Atualizar lista</button><button id="fg-footer-minimize" class="fg-btn fg-btn-secondary">Minimizar</button><button id="fg-footer-close" class="fg-btn fg-btn-secondary">Fechar</button></div>`;
    overlay.appendChild(modal); document.body.appendChild(overlay);

    const mini = document.createElement("div"); mini.id = "fg-case-router-mini"; document.body.appendChild(mini);
    const list = modal.querySelector("#fg-list");
    const detail = modal.querySelector("#fg-detail");

    function atualizarContadores() {
      modal.querySelector("#fg-summary").innerHTML = `<div class="fg-card fg-card-total">${resultados.length} total</div><div class="fg-card fg-card-ok">✅ ${processados} roteado(s)</div><div class="fg-card fg-card-warning">⚠ ${naoRoteados} não roteado(s)</div><div class="fg-card fg-card-error">❌ ${erros} erro(s)</div>`;
      mini.innerHTML = `<div class="fg-mini-title"><span>📋 Central de Roteamento</span><span>↗</span></div><div class="fg-mini-info">✅ ${processados} &nbsp;•&nbsp; ⚠ ${naoRoteados} &nbsp;•&nbsp; ❌ ${erros}${selecionado?.ticket ? ` &nbsp;•&nbsp; ${eh(selecionado.ticket)}` : ""}</div>`;
    }
    function minimizar() { overlay.style.display = "none"; mini.style.display = "block"; atualizarContadores(); }
    function restaurar() { mini.style.display = "none"; overlay.style.display = "flex"; }
    function fechar() { overlay.remove(); mini.remove(); style.remove(); }
    mini.onclick = restaurar;
    modal.querySelector("#fg-minimize").onclick = minimizar;
    modal.querySelector("#fg-footer-minimize").onclick = minimizar;
    modal.querySelector("#fg-close").onclick = fechar;
    modal.querySelector("#fg-footer-close").onclick = fechar;

    modal.querySelectorAll(".fg-filter").forEach((b) => b.onclick = function () {
      modal.querySelectorAll(".fg-filter").forEach((x) => x.classList.remove("active"));
      this.classList.add("active"); filtroAtual = this.dataset.filter; renderizarLista();
    });
    modal.querySelector("#fg-search").addEventListener("input", function () { buscaAtual = normalizar(this.value).trim(); renderizarLista(); });
    modal.querySelector("#fg-search-att").addEventListener("input", function () {
      buscaAnexoAtual = normalizar(this.value).trim();
      renderizarLista();
      detail.querySelectorAll(".fg-att-badge").forEach((b) => {
        const nome = normalizar(b.dataset.filename || b.textContent || "");
        b.classList.toggle("match", Boolean(buscaAnexoAtual && nome.includes(buscaAnexoAtual)));
      });
    });
    modal.querySelector("#fg-refresh-list").onclick = () => { renderizarLista(); atualizarContadores(); };

    const bulkDest = modal.querySelector("#fg-bulk-dest");
    bulkDest.innerHTML = `<option value="">Selecione o destino</option>` + USUARIOS_MANUAIS.map(u => `<option value="${eh(u.id)}">${eh(u.nome)}</option>`).join("") + `<option value="queue:junk">Junk</option>`;
    function atualizarBulk(){ modal.querySelector("#fg-bulk-count").textContent = `${selecionados.size} selecionado(s)`; }
    modal.querySelector("#fg-select-visible").onclick = () => { filtrados().filter(r=>r.caseId).forEach(r => selecionados.add(r.caseId)); renderizarLista(); atualizarBulk(); };
    modal.querySelector("#fg-select-pending").onclick = () => { resultados.filter(r => r.status === "pendente"&&r.caseId).forEach(r => selecionados.add(r.caseId)); renderizarLista(); atualizarBulk(); };
    modal.querySelector("#fg-clear-selection").onclick = () => { selecionados.clear(); renderizarLista(); atualizarBulk(); };
    modal.querySelector("#fg-bulk-route").onclick = async function(){
      const destino = bulkDest.value;
      const itens = resultados.filter(r => selecionados.has(r.caseId));
      if (!itens.length) return alert("Selecione pelo menos um Case.");
      if (!destino) return alert("Selecione um destino.");
      const nome = destino === "queue:junk" ? "Junk" : (USUARIOS_MANUAIS.find(u => guid(u.id)===guid(destino))?.nome || "destino");
      if (!confirm(`Rotear ${itens.length} Case(s) para ${nome}?`)) return;
      this.disabled=true; let ok=0, falhas=[];
      for (let i=0;i<itens.length;i++){
        this.textContent=`ROTEANDO ${i+1}/${itens.length}...`;
        const item=itens[i], anterior=item.status;
        try { await rotearParaDestino(item,destino); if(anterior==="pendente"){naoRoteados=Math.max(0,naoRoteados-1);processados++} else if(anterior==="erro"){erros=Math.max(0,erros-1);processados++} ok++; selecionados.delete(item.caseId); }
        catch(e){ falhas.push(`${item.ticket||item.caseId}: ${e?.message||String(e)}`); }
      }
      this.disabled=false; this.textContent="ROTEAR SELECIONADOS"; atualizarContadores(); renderizarLista(); atualizarBulk();
      alert(`Roteamento em massa concluído.\n\n✅ ${ok} processado(s)\n❌ ${falhas.length} erro(s)` + (falhas.length ? `\n\n${falhas.slice(0,8).join("\n")}` : ""));
    };

    const bulkReason=modal.querySelector("#fg-bulk-reason");
    buscarSubjects().then(ss=>{bulkReason.innerHTML='<option value="">Selecione o Case Reason</option>'+ss.map(x=>`<option value="${eh(guid(x.subjectid))}">${eh(x.title)}</option>`).join("")}).catch(e=>console.warn("Não foi possível carregar Case Reasons",e));
    modal.querySelector("#fg-bulk-classify").onclick=async function(){
      const itens=resultados.filter(r=>selecionados.has(r.caseId));if(!itens.length)return alert("Selecione pelo menos um Case.");
      const id=bulkReason.value;if(!id)return alert("Selecione um Case Reason.");
      try{
        const ss=await buscarSubjects(),sub=ss.find(x=>guid(x.subjectid)===guid(id));
        if(!sub)return alert("Case Reason não encontrado.");
        if(!confirm(`Aplicar '${sub.title}' a ${itens.length} Case(s)?`))return;
        this.disabled=true;let ok=0,falhas=[];
        for(let i=0;i<itens.length;i++){
          this.textContent=`CLASSIFICANDO ${i+1}/${itens.length}...`;
          try{await classificarCase(itens[i].caseId,id);itens[i].caseReason={id:guid(id),title:sub.title};itens[i].classificacaoStatus="ok";itens[i].classificacaoErro=null;selecionados.delete(itens[i].caseId);ok++;renderizarLista();atualizarBulk();}catch(e){itens[i].classificacaoStatus="incompleta";itens[i].classificacaoErro=e?.message||String(e);selecionados.add(itens[i].caseId);falhas.push(`${itens[i].ticket||itens[i].caseId}: ${e?.message||String(e)}`);renderizarLista();atualizarBulk();}
        }
        this.disabled=false;this.textContent="CLASSIFICAR SELECIONADOS";
        alert(`Classificação concluída.\n\n✅ ${ok} classificado(s)\n❌ ${falhas.length} erro(s)`+(falhas.length?`\n\n${falhas.slice(0,8).join("\n")}`:""));
      }catch(e){this.disabled=false;this.textContent="CLASSIFICAR SELECIONADOS";alert("Erro ao classificar: "+(e?.message||String(e)))}
    };

    const bulkPriority = modal.querySelector("#fg-bulk-priority");
    bulkPriority.innerHTML = `<option value="">Selecione a Prioridade</option>` + PRIORIDADES_EMAIL.map(p => `<option value="${p.value}">${eh(p.label)}</option>`).join("");
    modal.querySelector("#fg-bulk-set-priority").onclick = async function () {
      const itens = resultados.filter(r => selecionados.has(r.caseId));
      if (!itens.length) return alert("Selecione pelo menos um Case.");
      const val = bulkPriority.value;
      if (!val) return alert("Selecione uma Prioridade.");
      const label = prioridadeLabel(val);
      if (!confirm(`Aplicar prioridade '${label}' a ${itens.length} Case(s)?`)) return;
      this.disabled = true; let ok = 0, falhas = [];
      for (let i = 0; i < itens.length; i++) {
        this.textContent = `APLICANDO ${i + 1}/${itens.length}...`;
        try {
          await definirEmailPriority(itens[i].caseId, val);
          itens[i].emailPriority = Number(val);
          selecionados.delete(itens[i].caseId);
          ok++;
          renderizarLista(); atualizarBulk();
        } catch (e) {
          falhas.push(`${itens[i].ticket || itens[i].caseId}: ${e?.message || String(e)}`);
        }
      }
      this.disabled = false; this.textContent = "DEFINIR PRIORIDADE";
      if (selecionado) renderizarDetalhes(selecionado);
      alert(`Prioridade atualizada.\n\n✅ ${ok} atualizado(s)\n❌ ${falhas.length} erro(s)` + (falhas.length ? `\n\n${falhas.slice(0, 8).join("\n")}` : ""));
    };

    atualizarBulk();

    function filtrados() {
      return resultados.filter((r) => {
        if (filtroAtual !== "todos" && r.status !== filtroAtual) return false;
        if (buscaAtual) {
          const texto = normalizar([r.ticket, r.titulo, r.territorio, r.codigo, r.fila, r.usuario?.nome, r.regra, prioridadeLabel(r.emailPriority), r.customerCategory, r.highPotentialCustomer].filter(Boolean).join(" "));
          if (!texto.includes(buscaAtual)) return false;
        }
        if (buscaAnexoAtual) {
          const anexos = r.anexosNomes || [];
          if (!anexos.some(n => normalizar(n).includes(buscaAnexoAtual))) return false;
        }
        return true;
      });
    }

    function renderizarLista() {
      const f = filtrados();
      if (!f.length) {
        const msg = buscaAnexoAtual && !anexosIndexados
          ? "⏳ Indexando anexos dos Cases em segundo plano..."
          : "Nenhum Case encontrado para este filtro.";
        list.innerHTML = `<div class="fg-empty">${msg}</div>`;
        return;
      }
      list.innerHTML = f.map((r) => {
        const idx = resultados.indexOf(r);
        const badge = r.status === "roteado" ? '<span class="fg-badge fg-badge-ok">✓ ROTEADO</span>' : r.status === "pendente" ? '<span class="fg-badge fg-badge-warning">⚠ NÃO ROTEADO</span>' : '<span class="fg-badge fg-badge-error">✕ ERRO</span>';
        const badgeCat = r.customerCategory ? `<span class="fg-badge fg-badge-cat">${eh(r.customerCategory)}</span>` : "";
        const badgeHp = r.highPotentialCustomer ? `<span class="fg-badge fg-badge-hp">HP: ${eh(r.highPotentialCustomer)}</span>` : "";
        const anexosMatch = buscaAnexoAtual
          ? (r.anexosNomes || []).filter(n => normalizar(n).includes(buscaAnexoAtual))
          : [];
        return `<div class="fg-item ${selecionado === r ? "selected" : ""}" data-index="${idx}"><div><input type="checkbox" class="fg-check" data-check-index="${idx}" ${selecionados.has(r.caseId) ? "checked" : ""}>${badge}${badgeCat}${badgeHp}</div><div class="fg-ticket">${eh(r.ticket || "Sem ticket")}</div><div class="fg-title">${eh(r.titulo)}</div><div class="fg-meta">Território: ${eh(r.codigo || "-")} &nbsp;•&nbsp; Fila: ${eh(r.fila || "-")}${r.usuario ? `<br>→ ${eh(r.usuario.nome)}` : ""}${r.emailPriority != null ? `<br>Prioridade: <strong>${eh(prioridadeLabel(r.emailPriority))}</strong>` : ""}${r.caseReason ? `<br>✓ Case Reason: <strong>${eh(r.caseReason.title)}</strong>` : ""}${anexosMatch.length ? `<br><span style="color:#047857;font-weight:700">📎 ${eh(anexosMatch.slice(0, 3).join(", "))}${anexosMatch.length > 3 ? ` (+${anexosMatch.length - 3})` : ""}</span>` : ""}${r.classificacaoStatus === "incompleta" ? `<br><span style="color:#b91c1c;font-weight:700">⚠ CLASSIFICAÇÃO NÃO CONFIRMADA</span>` : ""}</div></div>`;
      }).join("");
      list.querySelectorAll(".fg-item").forEach((el) => el.onclick = function (ev) {
        if (ev.target.classList.contains("fg-check")) return;
        selecionado = resultados[Number(this.dataset.index)]; renderizarLista(); renderizarDetalhes(selecionado); atualizarContadores();
      });
      list.querySelectorAll(".fg-check").forEach(ch => ch.onclick = function(ev){ ev.stopPropagation(); const r=resultados[Number(this.dataset.checkIndex)]; if(this.checked) selecionados.add(r.caseId); else selecionados.delete(r.caseId); atualizarBulk(); });
    }

    async function renderizarDetalhes(item) {
      if (!item) return;
      try {
        const extras = await obterDadosExtrasCase(item.caseId);
        item.caseReason = extras.caseReason;
        item.emailPriority = extras.emailPriority;
        item.customerCategory = extras.customerCategory;
        item.highPotentialCustomer = extras.highPotentialCustomer;
        item.isHighPotential = extras.isHighPotential;
      } catch(e) { console.warn("Não foi possível ler dados extras do Case", e); }

      const opts = USUARIOS_MANUAIS.map((u) => `<option value="${eh(u.id)}">${eh(u.nome)}</option>`).join("") + `<option value="queue:junk">Junk</option>`;
      const priorityOpts = PRIORIDADES_EMAIL.map((p) => `<option value="${p.value}" ${Number(item.emailPriority) === p.value ? "selected" : ""}>${eh(p.label)}</option>`).join("");
      const status = item.status === "roteado" ? `✅ Roteado para ${eh(item.usuario?.nome || "-")}` : item.status === "pendente" ? "⚠ Não roteado automaticamente" : "❌ Erro durante processamento";

      detail.innerHTML = `
<div class="fg-section"><div class="fg-case-title">${eh(item.ticket || "Case")}</div><div class="fg-case-subject">${eh(item.titulo || "-")}</div></div>
<div class="fg-section"><div class="fg-section-title">Informações</div><div class="fg-info-grid"><div class="fg-info"><div class="fg-info-label">Status</div><div class="fg-info-value">${status}</div></div><div class="fg-info"><div class="fg-info-label">Território</div><div class="fg-info-value">${eh(item.territorio || item.codigo || "-")}</div></div><div class="fg-info"><div class="fg-info-label">Fila</div><div class="fg-info-value">${eh(item.fila || "-")}</div></div><div class="fg-info"><div class="fg-info-label">Prioridade Atual</div><div class="fg-info-value" id="fg-current-priority-value">${eh(prioridadeLabel(item.emailPriority))}</div></div><div class="fg-info"><div class="fg-info-label">Customer Category</div><div class="fg-info-value">${eh(item.customerCategory || "-")}</div></div><div class="fg-info"><div class="fg-info-label">High Potential Customer</div><div class="fg-info-value">${eh(item.highPotentialCustomer || "-")}</div></div></div></div>
<div class="fg-section"><div class="fg-section-title">Decisão do roteamento</div><div class="fg-rule"><strong>${eh(item.regra)}</strong><br>${eh(item.detalheRegra || "-")}</div></div>
<div class="fg-section"><div class="fg-section-title">Email Priority</div><div class="fg-routing"><select class="fg-select" id="fg-manual-priority"><option value="">Selecione a Prioridade</option>${priorityOpts}</select><button class="fg-btn fg-btn-primary" id="fg-save-priority">SALVAR PRIORIDADE</button></div><div id="fg-priority-feedback" style="margin-top:8px;font-size:12px"></div></div>
<div class="fg-section"><div class="fg-section-title">Classificação do Case</div><div class="fg-class-box"><div class="fg-class-current"><strong>Case Reason atual:</strong> ${item.caseReason ? `✅ ${eh(item.caseReason.title)}` : "○ Não classificado"}</div><div style="font-size:11px;color:#6b7280">Lido diretamente do Case no Dataverse.</div></div></div>
${item.classificacaoStatus === "incompleta" ? `<div class="fg-section"><div class="fg-section-title">Validação da classificação</div><div class="fg-email-error"><strong>⚠ Classificação não confirmada.</strong><br>${eh(item.classificacaoErro || "Verifique os campos obrigatórios do Case.")}</div></div>` : ""}
${item.erro ? `<div class="fg-section"><div class="fg-section-title">Erro</div><div class="fg-email-error">${eh(item.erro)}</div></div>` : ""}
<div class="fg-section"><div class="fg-section-title">Base de Clientes</div><div class="fg-client-box"><div id="fg-base-status" class="fg-base-status"></div><div class="fg-client-top"><input id="fg-client-search" class="fg-client-search" placeholder="Nome do cliente, CCUST ou CNPJ"><button id="fg-client-find" class="fg-btn fg-btn-secondary">BUSCAR</button><button id="fg-client-import" class="fg-btn fg-btn-secondary">BASE</button><input id="fg-client-file" type="file" accept=".xlsx,.xls" style="display:none"></div><div id="fg-client-results"></div></div></div>
<div class="fg-section"><div class="fg-section-title">Roteamento manual</div><div class="fg-routing"><select class="fg-select" id="fg-manual-user"><option value="">Selecione o destino</option>${opts}</select><button class="fg-btn fg-btn-primary" id="fg-route-manual">ROTEAR CASE</button><button class="fg-btn fg-btn-secondary" id="fg-open-case">ABRIR CASE</button></div><div id="fg-route-feedback" style="margin-top:8px;font-size:12px"></div></div>
<div class="fg-section"><div class="fg-section-title">Emails do Case</div><div id="fg-emails"><div class="fg-email-loading">Carregando emails...</div></div></div>`;

      detail.querySelector("#fg-save-priority").onclick = async function () {
        const sel = detail.querySelector("#fg-manual-priority"), fb = detail.querySelector("#fg-priority-feedback");
        const val = sel.value;
        if (!val) { fb.style.color = "#b45309"; fb.textContent = "Selecione uma prioridade."; return; }
        if (!item.caseId) { fb.style.color = "#b91c1c"; fb.textContent = "Case ID não disponível."; return; }
        this.disabled = true; this.textContent = "SALVANDO...";
        try {
          await definirEmailPriority(item.caseId, val);
          item.emailPriority = Number(val);
          const cur = detail.querySelector("#fg-current-priority-value");
          if (cur) cur.textContent = prioridadeLabel(val);
          fb.style.color = "#047857"; fb.textContent = `✅ Prioridade atualizada para ${prioridadeLabel(val)}.`;
          renderizarLista();
        } catch (e) {
          fb.style.color = "#b91c1c"; fb.textContent = "Erro ao salvar prioridade: " + (e?.message || String(e));
        } finally {
          this.disabled = false; this.textContent = "SALVAR PRIORIDADE";
        }
      };

      detail.querySelector("#fg-route-manual").onclick = async function () {
        const sel = detail.querySelector("#fg-manual-user"), fb = detail.querySelector("#fg-route-feedback");
        const destino = sel.value;
        if (!destino) { fb.style.color = "#b45309"; fb.textContent = "Selecione um destino."; return; }
        if (!item.caseId) { fb.style.color = "#b91c1c"; fb.textContent = "Case ID não disponível."; return; }
        this.disabled = true; this.textContent = "ROTEANDO...";
        try {
          const statusAnterior = item.status;
          const nomeDestino = await rotearParaDestino(item, destino);
          if (statusAnterior === "pendente") { naoRoteados = Math.max(0, naoRoteados - 1); processados++; }
          else if (statusAnterior === "erro") { erros = Math.max(0, erros - 1); processados++; }
          fb.style.color = "#047857"; fb.textContent = `✅ Case roteado para ${nomeDestino}.`;
          atualizarContadores(); renderizarLista(); this.disabled = false; this.textContent = "ROTEAR CASE";
        } catch (e) { fb.style.color = "#b91c1c"; fb.textContent = "Erro ao rotear: " + (e?.message || String(e)); this.disabled = false; this.textContent = "ROTEAR CASE"; }
      };

      detail.querySelector("#fg-open-case").onclick = async function () {
        if (!item.caseId) return alert("Case ID não disponível.");
        try { minimizar(); await Xrm.Navigation.openForm({ entityName: "incident", entityId: item.caseId }); }
        catch (e) { restaurar(); alert("Não foi possível abrir o Case: " + (e?.message || String(e))); }
      };

      configurarClientes(item);
      carregarEmailsDoCase(item.caseId);
    }

    function configurarClientes(item) {
      const st=detail.querySelector("#fg-base-status"),inp=detail.querySelector("#fg-client-search"),btn=detail.querySelector("#fg-client-find"),imp=detail.querySelector("#fg-client-import"),fi=detail.querySelector("#fg-client-file"),out=detail.querySelector("#fg-client-results");
      if(!st||!inp||!btn||!imp||!fi||!out)return;
      function status(){st.innerHTML=baseClientes.length?`✅ <strong>${baseClientes.length.toLocaleString("pt-BR")}</strong> clientes • ${eh(baseMeta?.arquivo||"Base salva")} • ${eh(baseMeta?.atualizadoEm?dataBR(baseMeta.atualizadoEm):"")}`:"⚠ Nenhuma base carregada. Selecione o Excel uma vez; a cópia ficará salva neste navegador.";imp.textContent=baseClientes.length?"ATUALIZAR BASE":"SELECIONAR BASE"}
      function mostrar(lista){if(!lista.length){out.innerHTML='<div class="fg-base-status">Nenhum cliente encontrado.</div>';return}out.innerHTML=lista.map((c,i)=>{const u=usuarioCSAL(c.csal);return `<div class="fg-client-result"><div class="fg-client-name">${eh(c.cnme)}</div><div class="fg-client-meta">CCUST: ${eh(c.ccust||"-")} • CNPJ: ${eh(c.cnpj||"-")} • CSAL: <strong>${eh(c.csal||"-")}</strong><br>SALESPERSON: ${eh(c.salesperson||"-")} • Região: ${eh(c.regiao||"-")} • Categoria: ${eh(c.categoria||"-")}</div>${u?`<div class="fg-suggest">💡 Sugestão pela base: <strong>${eh(u.nome)}</strong> <button class="fg-btn fg-btn-primary fg-base-route" data-i="${i}">ROTEAR PARA ${eh(u.nome.toUpperCase())}</button></div>`:`<div class="fg-base-status">CSAL ${eh(c.csal||"-")} sem usuário fixo mapeado.</div>`}</div>`}).join("");out.querySelectorAll(".fg-base-route").forEach(b=>b.onclick=async function(){const c=lista[Number(this.dataset.i)],u=usuarioCSAL(c.csal);if(!u)return;if(!confirm(`Rotear ${item.ticket||"este Case"} para ${u.nome}?\n\nCliente: ${c.cnme}\nCSAL: ${c.csal}`))return;this.disabled=true;const anterior=item.status;try{await rotearParaDestino(item,u.id);if(anterior==="pendente"){naoRoteados=Math.max(0,naoRoteados-1);processados++}else if(anterior==="erro"){erros=Math.max(0,erros-1);processados++}item.regra="Sugestão da Base de Clientes";item.detalheRegra=`Cliente ${c.cnme}; CSAL ${c.csal}.`;atualizarContadores();renderizarLista();this.textContent=`✅ ROTEADO PARA ${u.nome.toUpperCase()}`}catch(e){this.disabled=false;alert("Erro ao rotear: "+(e?.message||String(e)))}})}
      function buscar(){if(!baseClientes.length){out.innerHTML='<div class="fg-email-error">Selecione primeiro a Base de Clientes.</div>';return}mostrar(pesquisaClientes(inp.value))}
      btn.onclick=buscar;inp.addEventListener("keydown",e=>{if(e.key==="Enter")buscar()});imp.onclick=()=>fi.click();fi.onchange=async()=>{const f=fi.files?.[0];if(!f)return;st.textContent="Lendo e salvando a base...";imp.disabled=true;try{const m=await importarBase(f);status();out.innerHTML=`<div class="fg-suggest">✅ Base atualizada: ${m.quantidade.toLocaleString("pt-BR")} clientes da aba ${eh(m.aba)}.</div>`}catch(e){st.innerHTML=`❌ ${eh(e?.message||String(e))}`}finally{imp.disabled=false;fi.value=""}};status();
    }

    async function buscarEmails(caseId) {
      if (cacheEmails.has(caseId)) return cacheEmails.get(caseId);
      const q = `?$select=activityid,subject,description,createdon,senton,directioncode&$filter=_regardingobjectid_value eq ${caseId}&$orderby=createdon desc`;
      const r = await Xrm.WebApi.retrieveMultipleRecords("email", q, 50);
      const emails = r.entities || [];

      if (emails.length > 0) {
        for (let k = 0; k < emails.length; k += 15) {
          const chunk = emails.slice(k, k + 15);
          const filterIds = chunk.map(e => `_objectid_value eq ${e.activityid}`).join(" or ");
          try {
            const qAtt = `?$select=activitymimeattachmentid,_objectid_value,filename,mimetype,attachmentcontentid&$filter=${filterIds}`;
            const rAtt = await Xrm.WebApi.retrieveMultipleRecords("activitymimeattachment", qAtt);
            const anexosGerais = rAtt.entities || [];
            chunk.forEach(e => {
              e.attachmentsInfo = anexosGerais.filter(a => a._objectid_value && guid(a._objectid_value) === guid(e.activityid));
            });
          } catch (err) {
            chunk.forEach(e => e.attachmentsInfo = []);
          }
        }
      }

      cacheEmails.set(caseId, emails);
      return emails;
    }

    async function indexarAnexosEmSegundoPlano() {
      for (const item of resultados) {
        if (!item.caseId || !document.getElementById("fg-case-router-overlay")) continue;
        try {
          const emails = await buscarEmails(item.caseId);
          const nomes = [];
          for (const e of emails) {
            for (const a of (e.attachmentsInfo || [])) {
              if (a.filename && !a.filename.startsWith("image0")) nomes.push(a.filename);
            }
          }
          item.anexosNomes = [...new Set(nomes)];
          if (buscaAnexoAtual) renderizarLista();
        } catch (e) {
          item.anexosNomes = [];
        }
      }
      anexosIndexados = true;
      if (buscaAnexoAtual) renderizarLista();
    }

    async function buscarAnexos(emailId) {
      emailId = guid(emailId);
      if (cacheAnexos.has(emailId)) return cacheAnexos.get(emailId);
      try {
        const q = `?$select=activitymimeattachmentid,filename,mimetype,body,attachmentcontentid&$filter=_objectid_value eq ${emailId}`;
        const r = await Xrm.WebApi.retrieveMultipleRecords("activitymimeattachment", q, 100);
        const a = r.entities || []; cacheAnexos.set(emailId, a); return a;
      } catch (e) {
        console.warn("Não foi possível carregar anexos inline do email:", e);
        cacheAnexos.set(emailId, []); return [];
      }
    }

    function regexEscape(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
    function cidLimpo(s) { return String(s || "").trim().replace(/^cid:/i, "").replace(/^<|>$/g, "").toLowerCase(); }
    function aplicarCid(html, anexos) {
      let out = String(html || "");
      for (const a of anexos) {
        if (!a.body || !String(a.mimetype || "").toLowerCase().startsWith("image/")) continue;
        const dataUrl = `data:${a.mimetype};base64,${a.body}`;
        const ids = [a.attachmentcontentid, a.filename].map(cidLimpo).filter(Boolean);
        for (const id of ids) out = out.replace(new RegExp(`cid:${regexEscape(id)}`, "gi"), dataUrl);
      }
      return out;
    }

    function documentoEmail(html) {
      const css = `<style>html,body{max-width:100%!important;overflow-x:auto!important}body{margin:12px!important;padding:0!important}img{max-width:100%!important;height:auto!important}table{max-width:100%!important}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style>`;
      html = String(html || "<p>(Email sem corpo disponível)</p>");
      if (/<html[\s>]/i.test(html)) {
        if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, css + "</head>");
        return html.replace(/<html([^>]*)>/i, `<html$1><head><meta charset="utf-8">${css}</head>`);
      }
      return `<!doctype html><html><head><meta charset="utf-8">${css}</head><body>${html}</body></html>`;
    }

    async function abrirEmail(wrapper, email) {
      if (wrapper.dataset.carregado === "1") return;
      const status = wrapper.querySelector(".fg-email-load-status");
      const frame = wrapper.querySelector(".fg-email-frame");
      status.textContent = "Carregando HTML e imagens da assinatura...";
      try {
        const anexos = await buscarAnexos(email.activityid);
        const html = documentoEmail(aplicarCid(email.description, anexos));
        frame.setAttribute("sandbox", "allow-popups allow-popups-to-escape-sandbox");
        frame.srcdoc = html;
        wrapper.dataset.carregado = "1";
        const n = anexos.filter((a) => String(a.mimetype || "").toLowerCase().startsWith("image/")).length;
        status.textContent = n ? `${n} imagem(ns) incorporada(s) encontrada(s)` : "HTML original do email";
      } catch (e) {
        console.error("Erro ao renderizar email:", e);
        frame.srcdoc = documentoEmail(email.description);
        wrapper.dataset.carregado = "1";
        status.textContent = "HTML exibido; algumas imagens podem não estar disponíveis.";
      }
    }

    async function carregarEmailsDoCase(caseId) {
      const box = detail.querySelector("#fg-emails");
      if (!box) return;
      try {
        const emails = await buscarEmails(caseId);
        if (selecionado?.caseId !== caseId) return;
        if (!emails.length) { box.innerHTML = '<div class="fg-email-loading">Nenhum email foi encontrado relacionado diretamente a este Case.</div>'; return; }
        box.innerHTML = emails.map((e, i) => {
          const dir = e.directioncode === true ? "Saída" : e.directioncode === false ? "Entrada" : "";
          const anexosVisiveis = (e.attachmentsInfo || []).filter(a => a.filename && !a.filename.startsWith("image0"));
          const htmlAnexos = anexosVisiveis.length
            ? `<div class="fg-att-badges">${anexosVisiveis.map(a => {
                const isMatch = buscaAnexoAtual && normalizar(a.filename).includes(buscaAnexoAtual);
                return `<span class="fg-att-badge ${isMatch ? "match" : ""}" data-attid="${eh(a.activitymimeattachmentid)}" data-filename="${eh(a.filename)}" title="Abrir / Baixar anexo">📎 ${eh(a.filename)}</span>`;
              }).join("")}</div>`
            : "";
          return `<div class="fg-email" data-i="${i}"><div class="fg-email-header"><div class="fg-email-subject">${eh(e.subject || "(Sem assunto)")}${htmlAnexos}</div><div class="fg-email-date">${eh(dir)}${dir ? " • " : ""}${eh(dataBR(e.senton || e.createdon))} • clique para visualizar</div></div><div class="fg-email-content"><div class="fg-email-toolbar"><span class="fg-email-load-status">Email ainda não carregado</span><span>HTML original</span></div><iframe class="fg-email-frame" title="Visualização do email"></iframe></div></div>`;
        }).join("");

        box.querySelectorAll(".fg-email").forEach((w) => {
          w.querySelector(".fg-email-header").onclick = async () => {
            const abrir = !w.classList.contains("open"); w.classList.toggle("open");
            if (abrir) await abrirEmail(w, emails[Number(w.dataset.i)]);
          };
        });

        box.querySelectorAll(".fg-att-badge").forEach((badge) => {
          badge.onclick = async (ev) => {
            ev.stopPropagation();
            const attId = badge.dataset.attid;
            if (!attId) return;
            const originalText = badge.innerHTML;
            badge.innerHTML = "⏳ Aguarde...";
            badge.style.pointerEvents = "none";
            try {
              const req = await Xrm.WebApi.retrieveRecord("activitymimeattachment", attId, "?$select=body,mimetype,filename");
              if (!req.body) {
                alert("O corpo deste anexo está vazio ou corrompido no CRM.");
              } else {
                const blob = base64ToBlob(req.body, req.mimetype || "application/octet-stream");
                const blobUrl = URL.createObjectURL(blob);
                const novaJanela = window.open(blobUrl, "_blank");
                if (!novaJanela) {
                  const a = document.createElement("a");
                  a.href = blobUrl;
                  a.download = req.filename || "anexo";
                  a.click();
                }
              }
            } catch (err) {
              alert("Erro ao tentar baixar o anexo: " + (err?.message || String(err)));
            } finally {
              badge.innerHTML = originalText;
              badge.style.pointerEvents = "auto";
            }
          };
        });

        const primeiro = box.querySelector(".fg-email");
        if (primeiro) { primeiro.classList.add("open"); await abrirEmail(primeiro, emails[0]); }
      } catch (e) {
        console.error("Erro ao carregar emails:", e);
        box.innerHTML = `<div class="fg-email-error"><strong>Não foi possível carregar os emails.</strong><br><br><strong>Detalhe técnico:</strong><br>${eh(e?.message || String(e))}</div>`;
      }
    }

    await carregarBaseSalva();
    for (const item of resultados) {
      if (!item.caseId) continue;
      try {
        const extras = await obterDadosExtrasCase(item.caseId);
        item.caseReason = extras.caseReason;
        item.emailPriority = extras.emailPriority;
        item.customerCategory = extras.customerCategory;
        item.highPotentialCustomer = extras.highPotentialCustomer;
        item.isHighPotential = extras.isHighPotential;

        // Auto-atualiza prioridade para 🔴 High quando High Potential Customer = Yes
        if (item.isHighPotential && Number(item.emailPriority) !== EMAIL_PRIORITY_HIGH) {
          try {
            await definirEmailPriority(item.caseId, EMAIL_PRIORITY_HIGH);
            item.emailPriority = EMAIL_PRIORITY_HIGH;
            console.log(`[ROUTER] High Potential detectado (${item.ticket || item.caseId}): prioridade alterada automaticamente para 🔴 High.`);
          } catch (errPrio) {
            console.warn(`[ROUTER] Falha ao definir prioridade High automática para ${item.ticket || item.caseId}:`, errPrio);
          }
        }
      } catch (e) {
        console.warn("Dados extras não lidos", item.ticket || item.caseId, e);
      }
    }
    atualizarContadores(); renderizarLista();
    const primeiro = resultados.find((r) => r.status === "pendente") || resultados[0];
    if (primeiro) { selecionado = primeiro; renderizarLista(); renderizarDetalhes(primeiro); atualizarContadores(); }
    indexarAnexosEmSegundoPlano();
  }
})();
