const barColors = ["#ffcdd2", "#e57373", "#ef5350", "#d32f2f", "#b71c1c"];
const pieColors = [
  "#1f487e",
  "#d32f2f",
  "#fce762",
  "#ffb17a",
  "#44AF69",
  "#AEB8FE",
  "#06BCC1",
];

const domandeTestoForzato = [];

async function caricaDati() {
  try {
    const response = await fetch(CONFIG.API_URL);
    const data = await response.json();

    document.getElementById("loading").style.display = "none";
    const container = document.getElementById("content-container");

    if (!data || data.length < 2) {
      container.innerHTML =
        '<div class="dashboard-card center">Nessun dato disponibile.</div>';
      return;
    }

    const headers = data[0];
    const rows = data.slice(1);

    for (let i = 1; i < headers.length; i++) {
      const question = headers[i];
      const answers = rows
        .map((r) => r[i])
        .filter((a) => a !== "" && a !== undefined);
      if (answers.length === 0) continue;

      creaSezioneDomanda(container, question, answers, i);
    }
  } catch (error) {
    console.error(error);
    document.getElementById("loading").innerText =
      "Errore nel caricamento dei dati.";
  }
}

function creaSezioneDomanda(container, question, answers, index) {
  const counts = {};
  answers.forEach((a) => (counts[a] = (counts[a] || 0) + 1));

  const uniqueValues = Object.keys(counts).length;
  const isNumeric = answers.every((a) => !isNaN(a) && a !== "");

  const isLongText = answers.some(
    (a) => typeof a === "string" && a.length > 50,
  );

  let tipo = "testo";

  if (domandeTestoForzato.includes(question.trim()) || isLongText) {
    tipo = "testo";
  } else if (isNumeric && Math.max(...answers) <= 10) {
    tipo = "barre";
  } else if (uniqueValues <= 8 || uniqueValues < answers.length / 2) {
    tipo = "torta";
  }

  const card = document.createElement("div");
  card.className = "dashboard-card";

  let contentHtml = `
        <div class="card-title">
            <span>${question}</span>
            <span class="response-badge">${answers.length} risposte</span>
        </div>
        <div class="chart-container" id="container-${index}">`;

  if (tipo === "testo") {
    contentHtml += `<div style="max-height: 300px; overflow-y: auto; padding-right: 5px;">`;
    answers.forEach((ans) => {
      contentHtml += `<div class="text-response">${ans}</div>`;
    });
    contentHtml += `</div>`;
  } else {
    contentHtml += `<canvas id="chart-${index}"></canvas>`;
  }
  contentHtml += `</div>`;
  card.innerHTML = contentHtml;
  container.appendChild(card);

  if (tipo !== "testo") {
    const ctx = document.getElementById(`chart-${index}`).getContext("2d");
    let labels, dataPoints, chartColors;

    if (tipo === "barre") {
      const allLabels = ["1", "2", "3", "4", "5"];
      labels = allLabels.map((l) => {
        if (l === "1") return "1 - Normale";
        if (l === "3") return "3 - Medio";
        if (l === "5") return "5 - Estremo";
        return l;
      });
      dataPoints = allLabels.map((l) => counts[l] || 0);
      chartColors = barColors;
    } else {
      labels = Object.keys(counts).sort();
      dataPoints = labels.map((l) => counts[l]);
      chartColors = pieColors;
    }

    new Chart(ctx, {
      type: tipo === "barre" ? "bar" : "pie",
      data: {
        labels: labels,
        datasets: [
          {
            data: dataPoints,
            backgroundColor: chartColors,
            borderRadius: tipo === "barre" ? 6 : 0,
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: tipo === "torta", position: "bottom" },
        },
        scales:
          tipo === "barre"
            ? {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
                x: { grid: { display: false } },
              }
            : {},
      },
    });
  }
}

caricaDati();
