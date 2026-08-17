(async function () {

    const VENDEDORES = {
        "335": {
            nome: "Lucimara Cecilio",
            id: "75a55739-7b8a-ec11-93b0-000d3a64a5f1"
        },
        "337": {
            nome: "Bruna Giovanini",
            id: "7fdc629c-144f-ed11-bba3-000d3aba36db"
        },
        "338": {
            nome: "Matheus Silva",
            id: "d46857cf-606e-f011-b4cc-6045bde0e1bb"
        },
        "340": {
            nome: "Pablo Silva",
            id: "67f1a84e-7471-f011-b4cc-000d3adb1307"
        },
        "343": {
            nome: "Cristina Felisbino",
            id: "05d3a11a-5455-f111-bec6-000d3ab84f1f"
        },
        "344": {
            nome: "Felipe Nunes",
            id: "4c717f2b-2d4e-f111-bec7-000d3ab84162"
        },
        "346": {
            nome: "Cristiana Roseto",
            id: "df619db6-3a77-eb11-a812-000d3adb5d0d"
        }
    };

    const REGEX_COTACAO =
        /cotac|cotar|orcament/i;

    const REGEX_ATENDIMENTO =
        /atras|follow|pagament|boleto|amostra|sample/i;

    let processados = 0;

    try {

        console.clear();

        const rows =
            document.querySelectorAll(".ag-row");

        for (const row of rows) {

            try {

                const titulo =
                    row.querySelector('[col-id="title"]')
                        ?.innerText
                        ?.trim() || "";

                const territorio =
                    row.querySelector(
                        '[col-id*="ess_caseaccountsalesterritory"]'
                    )
                        ?.innerText
                        ?.trim() || "";

                const ticket =
                    row.querySelector('[col-id*="ticketnumber"]')
                        ?.innerText
                        ?.trim() || "";

                if (!titulo || !territorio) {
                    continue;
                }

                const tituloNormalizado =
                    titulo
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase();

                const codigo =
                    territorio.match(/\((\d+)\)/)?.[1];

                if (!codigo) {
                    continue;
                }

                let deveRotear = false;

                // 335 e 337:
                // Cotação + Orçamento + Atendimento
                if (["335", "337"].includes(codigo)) {

                    deveRotear =
                        REGEX_COTACAO.test(
                            tituloNormalizado
                        ) ||
                        REGEX_ATENDIMENTO.test(
                            tituloNormalizado
                        );

                }

                // 338, 340, 343, 344 e 346:
                // Somente Cotação / Orçamento
                else if (
                    ["338", "340", "343", "344", "346"]
                        .includes(codigo)
                ) {

                    deveRotear =
                        REGEX_COTACAO.test(
                            tituloNormalizado
                        );

                }

                if (!deveRotear) {
                    continue;
                }

                const vendedor =
                    VENDEDORES[codigo];

                if (!vendedor) {
                    continue;
                }

                const queueItem =
                    await Xrm.WebApi.retrieveRecord(
                        "queueitem",
                        row.getAttribute("row-id")
                    );

                const caseId =
                    queueItem._objectid_value;

                await Xrm.WebApi.updateRecord(
                    "incident",
                    caseId,
                    {
                        "ownerid@odata.bind":
                            `/systemusers(${vendedor.id})`
                    }
                );

                processados++;

                console.log(
                    `✅ ROTEADO | ${ticket} | ${titulo} | ${codigo} | ${vendedor.nome}`
                );

            } catch (erroLinha) {

                console.error(
                    "Erro ao processar linha:",
                    erroLinha
                );

            }

        }

        alert(
            `${processados} case(s) roteado(s) com sucesso.`
        );

    } catch (erro) {

        console.error(erro);

        alert(
            "Erro: " + erro.message
        );

    }

})();
