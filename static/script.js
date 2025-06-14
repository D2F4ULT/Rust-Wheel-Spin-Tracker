const targets = { 1: 48, 3: 24, 5: 16, 10: 8, 20: 4 };
let spins = [];
let timer = 0;
let timerInterval = null;

function updateTimer() {
  if (timer > 0) {
    const mins = Math.floor(timer / 60);
    const secs = timer % 60;
    document.getElementById("timer").textContent = `Timer: ${mins}:${secs.toString().padStart(2, '0')}`;
    timer--;
  } else {
    clearInterval(timerInterval);
    document.getElementById("timer").textContent = "Timer: 0:00";
  }
}

function startTimer() {
  timer = 60;
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

async function submitSpin() {
  const input = document.getElementById("spin-input");
  const value = parseInt(input.value.trim(), 10);
  if (targets[value]) {
    await fetch("/spins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: value })
    });
    input.value = "";
    startTimer();
    await refreshData();
    await updateStats(); // Update charts/stats too
  } else {
    alert("Invalid spin. Must be one of: " + Object.keys(targets).join(", "));
  }
}

async function refreshData() {
  const res = await fetch("/spins");
  spins = await res.json();
  updateDisplay();
}

function updateDisplay() {
  const total = spins.length;
  const counts = Object.fromEntries(Object.keys(targets).map(k => [k, 0]));
  spins.forEach(spin => counts[spin.result]++);

  document.getElementById("total-spins").textContent = total;

  const tbody = document.querySelector("#frequency-table tbody");
  tbody.innerHTML = "";
  for (const num in targets) {
    const count = counts[num];
    const actual = total > 0 ? (count / total * 100).toFixed(2) : "0.00";
    const diff = (actual - targets[num]).toFixed(2);
    const color = diff > 0 ? "green" : diff < 0 ? "red" : "black";
    tbody.insertAdjacentHTML(
      "beforeend",
      `<tr style="color:${color}"><td>${num}</td><td>${count}</td><td>${actual}%</td><td>${targets[num]}%</td><td>${diff > 0 ? '+' : ''}${diff}%</td></tr>`
    );
  }

  const slider = document.getElementById("spin-slider");
  slider.max = total;
  slider.value = total;
  slider.disabled = total === 0;
  updateSliderLabel();
}

function updateSliderLabel() {
  const slider = document.getElementById("spin-slider");
  const pos = parseInt(slider.value);
  if (pos > 0 && pos <= spins.length) {
    const { result, timestamp } = spins[pos - 1];
    document.getElementById("slider-label").textContent = `Spin #${pos}: Result=${result}, Time=${timestamp}`;
  } else {
    document.getElementById("slider-label").textContent = "No spins recorded";
  }
}

async function deleteSpin() {
  const index = parseInt(document.getElementById("spin-slider").value) - 1;
  if (index >= 0 && index < spins.length) {
    await fetch(`/spins/${index}`, { method: "DELETE" });
    await refreshData();
    await updateStats();
  }
}

function runPrediction() {
  alert("This runs predictive analytics (e.g., ML or frequency analysis).");
}

// Extra analytics and Chart.js integration
async function updateStats() {
  const res = await fetch("/stats");
  const data = await res.json();

  numberChart.data.labels = Object.keys(data.number_freq);
  numberChart.data.datasets[0].data = Object.values(data.number_freq);
  numberChart.update();
}

// Chart setup
const numberChart = new Chart(document.getElementById("numberChart"), {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: 'Number Frequency',
      data: [],
      backgroundColor: 'blue'
    }]
  }
});


async function resetDatabase() {
  if (!confirm("Are you sure you want to delete all spins?")) return;

  await fetch('/reset', { method: 'POST' });
  await refreshData();     // refresh spins after reset
  await updateStats();     // refresh stats and charts
}


refreshData(); //used to refresh all the data on enter, because it won't be displayed automaticly
updateStats();


