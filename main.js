
document.addEventListener("DOMContentLoaded", async () => {
  const cursoMap = {
    "Formação de Professores de Língua Portuguesa": "progress.fplp25.csv",
    "Formação de Professores de Língua Inglesa": "progress.fpling25.csv",
    "Formação de Professores de Arte": "progress.fpart25.csv",
    "Formação de Professores de Química": "progress.fpqui25.csv",
    "Formação de Professores de Matemática": "progress.fpmat25.csv",
    "Formação de Professores de Física": "progress.fpfis25.csv",
    "Formação de Professores de Filosofia": "progress.fpfilo25.csv",
    "Formação de Professores de Sociologia": "progress.fpsociol25.csv",
    "Formação de Professores de Biologia": "progress.fpbio25.csv",
    "Formação de Professores de Geografia": "progress.fpgeo25.csv",
    "Formação de Professores de História": "progress.fphist25.csv",
    "Trilha Formativa: Formadores": "progress.trilha_formativa_formadores.csv"
  };

  const atividadesCurso = {};
  const modulosCurso = {};
  const progressoSemanal = {};
  const tabela = [];

  const datasSemana = ["01/04/2025", "08/04/2025", "15/04/2025", "22/04/2025", "29/04/2025", "06/05/2025", "13/05/2025"];

  const carregarCSV = (arquivo) =>
    new Promise((resolve) => {
      Papa.parse("cursos/" + arquivo, {
        download: true,
        complete: (res) => resolve(res.data)
      });
    });

  for (const [curso, arquivo] of Object.entries(cursoMap)) {
    const dados = await carregarCSV(arquivo);
    const header = dados[0];
    const linhas = dados.slice(1).filter(l => l[0]);

    const atividades = header.map((h, i) => ({ nome: h, index: i }))
      .filter(c => /li[cç][aã]o|f[oó]rum|discuss[aã]o/i.test(c.nome));

    const modulos = [];
    let atual = [];

    for (const a of atividades) {
      if (a.nome.trim().toLowerCase() === "lição - tema 1" && atual.length > 0) {
        modulos.push(atual);
        atual = [];
      }
      atual.push(a);
    }
    if (atual.length) modulos.push(atual);

    atividadesCurso[curso] = atividades.length;
    modulosCurso[curso] = modulos.length;

    linhas.forEach(linha => {
      modulos.forEach((mod, mIndex) => {
        const total = mod.length;
        let concluidas = 0;

        for (let i = 0; i < mod.length; i++) {
          const col = mod[i].index;
          const valor = linha[col + 1];
          if (valor && valor.trim() !== "") {
            concluidas++;
            const d = valor.split("/").reverse().join("-");
            const semana = datasSemana.find(ds => d <= ds.split("/").reverse().join("-"));
            if (semana) {
              const chave = curso + "|" + semana;
              progressoSemanal[chave] = (progressoSemanal[chave] || 0) + 1;
            }
          }
        }

        const percentual = ((concluidas / total) * 100).toFixed(0) + "%";
        tabela.push([
          linha[0], curso, "Módulo " + (mIndex + 1), total, concluidas, percentual
        ]);
      });
    });
  }

  const maisAtividades = Object.entries(atividadesCurso).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";  
  const menosModulos = Object.entries(modulosCurso).sort((a, b) => a[1] - b[1])[0]?.[0] || "-";

  document.getElementById("cursoMaisAtividades").innerHTML = `<strong style="font-size: 1.1rem;">${maisAtividades}</strong>`;
  document.getElementById("cursoMenosModulos").innerHTML = `<strong style="font-size: 1.1rem;">${menosModulos}</strong>`;

  new ApexCharts(document.querySelector("#graficoAtividadesCurso"), {
    chart: {
          toolbar: { show: true }, type: "pie", height: 400 },
    series: Object.values(atividadesCurso),
    labels: Object.keys(atividadesCurso),
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => opts.w.config.series[opts.seriesIndex]
    }
  }).render();

  new ApexCharts(document.querySelector("#graficoModulosCurso"), {
    chart: {
      toolbar: { show: true },
      type: "pie",
      height: 400
    },
    series: Object.keys(modulosCurso).map(curso => {
      return tabela.filter(
        l => l[1] === curso && l[3] === l[4] && l[3] !== 0
      ).length;
    }),
    labels: Object.keys(modulosCurso),
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => opts.w.config.series[opts.seriesIndex]
    }
  }).render();

  const categorias = [...new Set(Object.keys(progressoSemanal).map(k => k.split("|")[1]))].sort();
  const series = Object.keys(cursoMap).map(nome => {
    return {
      name: nome,
      data: categorias.map(data => progressoSemanal[nome + "|" + data] || 0)
    };
  });

  new ApexCharts(document.querySelector("#graficoProgressoSemanal"), {
    chart: {
      toolbar: { show: true },
      type: "bar",
      height: 450,
      stacked: true
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 10,
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
        dataLabels: {
          total: {
            enabled: true,
            style: {
              fontSize: "13px",
              fontWeight: 900
            }
          }
        }
      }
    },
    series,
    xaxis: { categories: categorias },
    legend: {
      position: "right",
      offsetY: 40
    },
    fill: { opacity: 1 }
  }).render();


// GRÁFICO DE CONCLUINTES POR MÓDULO
const filtroGrafico = document.getElementById("filtroGraficoCurso");
const containerGrafico = document.getElementById("graficoConcluintesPorModulo");

Object.keys(cursoMap).forEach(curso => {
  const opt = document.createElement("option");
  opt.value = curso;
  opt.textContent = curso;
  filtroGrafico.appendChild(opt);
});

filtroGrafico.addEventListener("change", () => {
  const cursoSelecionado = filtroGrafico.value;
  if (!cursoSelecionado || !modulosCurso[cursoSelecionado]) return;

  const totalCursistas = tabela.filter(l => l[1] === cursoSelecionado && l[2] === "Módulo 1").length;
  const modulos = ["Módulo 1", "Módulo 2", "Módulo 3", "Módulo 4"];
  const dados = [];

  modulos.forEach((modulo, i) => {
    const concluintes = tabela.filter(l => l[1] === cursoSelecionado && l[2] === modulo && l[5] === "100%").length;
    dados.push({ modulo: modulo, concluintes: concluintes, total: totalCursistas });
  });

  containerGrafico.innerHTML = '<div id="graficoHorizontalConcluintes"></div>';

  const seriesData = dados.map(d => d.concluintes);
  const goalsData = dados.map(d => ({ name: "Total", value: d.total, strokeHeight: 3, strokeColor: "#FF4560" }));
  const categorias = dados.map(d => d.modulo);

  
  const optionsConcluintes = {
    series: [{ name: "Concluintes", data: seriesData }],
    chart: {
      height: 350,
      type: "bar"
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "50%",
        dataLabels: {
          position: "center"
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        const total = goalsData[opts.dataPointIndex].value;
        return `${val} concluintes de ${total} inscritos`;
      },
      style: {
        fontSize: "14px",
        fontWeight: "bold",
        colors: ["#fff"]
      }
    },
    colors: ["#009639", "#FFD500", "#E03C31", "#0072CE"],
    xaxis: {
      categories: categorias
    },
    annotations: {
      xaxis: goalsData.map((g, i) => ({
        x: g.value,
        borderColor: g.strokeColor,
        label: {
          borderColor: g.strokeColor,
          style: {
            color: "#fff",
            background: g.strokeColor
          },
          text: `Total: ${g.value}`
        }
      }))
    }
  };
new ApexCharts(document.querySelector("#graficoHorizontalConcluintes"), optionsConcluintes).render();
});


  const tabelaFinal = $("#tabelaModulos").DataTable({
    data: tabela,
    pageLength: 50,
    columns: [
      { title: "Nome completo do estudante" },
      { title: "Trilha" },
      { title: "Módulo" },
      { title: "Total de atividades" },
      { title: "Atividades concluídas" },
      { title: "Porcentagem de conclusão do Módulo" }
    ],

initComplete: function () {
  const api = this.api();

  const filtroCurso = document.getElementById("filtroCurso");
  const filtroModulo = document.getElementById("filtroModulo");

  if (filtroCurso && filtroModulo) {
    const cursos = api.column(1).data().unique().sort();
    cursos.each(d => {
      filtroCurso.innerHTML += `<option value="${d}">${d}</option>`;
    });

    const modulos = api.column(2).data().unique().sort();
    modulos.each(d => {
      filtroModulo.innerHTML += `<option value="${d}">${d}</option>`;
    });

    filtroCurso.addEventListener("change", function () {
      api.column(1).search(this.value).draw();
    });

    filtroModulo.addEventListener("change", function () {
      api.column(2).search(this.value).draw();
    });
  }
},

    language: {
      url: "https://cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json"
    },
    dom: 'Bfrtip',
    buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
  });
});


