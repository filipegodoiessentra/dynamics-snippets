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
        "346": {
            nome: "Cristiana Roseto",
            id: "df619db6-3a77-eb11-a812-000d3adb5d0d"
        }
    };

    const ATENDIMENTO_RR = [
        {
            nome: "Cristina Alves",
            id: "2ad29448-518c-ef11-ac20-6045bddd9c93"
        },
        {
            nome: "Lilian Lopes",
            id: "d5ca6b9c-6350-f011-877b-000d3adf9cf8"
        }
    ];

    const REGEX_COTACAO =
        /cotac|cotar|orcament|amostra|sample/i;

    const REGEX_ATENDIMENTO =
        /fup|follow|release|pedido de compra|novo pedido|posicao de entrega|posição de entrega|nota fiscal|\bnf\b|boleto/i;

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

                let vendedor = null;

                // 335 = Lucimara sempre
                if (codigo === "335") {

                    vendedor = VENDEDORES["335"];

                }

                // 337 = Bruna sempre
                else if (codigo === "337") {

                    vendedor = VENDEDORES["337"];

                }

                // Cotação / Orçamento / Amostra
                else if (
                    ["338", "340", "346"]
                        .includes(codigo)
                ) {

                    if (
                        REGEX_COTACAO.test(
                            tituloNormalizado
                        )
                    ) {

                        vendedor =
                            VENDEDORES[codigo];

                    }

                }

                // Atendimento Comercial
                else if (
                    REGEX_ATENDIMENTO.test(
                        tituloNormalizado
                    )
                ) {

                    let indice =
                        Number(
                            localStorage.getItem(
                                "rr_atendimento"
                            ) || 0
                        );

                    vendedor =
                        ATENDIMENTO_RR[indice];

                    indice =
                        (indice + 1) %
                        ATENDIMENTO_RR.length;

                    localStorage.setItem(
                        "rr_atendimento",
                        indice
                    );

                }

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

        console.log(
            `✅ ${processados} case(s) roteado(s)`
        );

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
