const canvas = document.getElementById("regressionCanvas");
const ctx = canvas.getContext("2d");

const residualsToggle = document.getElementById("residualsToggle");
const resetBtn = document.getElementById("resetBtn");
const clearBtn = document.getElementById("clearBtn");
const randomLinearBtn = document.getElementById("randomLinearBtn");
const randomQuadraticBtn = document.getElementById("randomQuadraticBtn");
const addOutlierBtn = document.getElementById("addOutlierBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const selectedDeleteBtn = document.getElementById("selectedDeleteBtn");
const datasetSelect = document.getElementById("datasetSelect");
const selectedBadge = document.getElementById("selectedBadge");
const selectedDetails = document.getElementById("selectedDetails");
const selectedXInput = document.getElementById("selectedXInput");
const selectedYInput = document.getElementById("selectedYInput");
const lineFormula = document.getElementById("lineFormula");
const coefficientValues = document.getElementById("coefficientValues");
const modelHint = document.getElementById("modelHint");
const liveExplanation = document.getElementById("liveExplanation");
const matrixExplanation = document.getElementById("matrixExplanation");
const pointsCountText = document.getElementById("pointsCountText");
const rssValue = document.getElementById("rssValue");
const mseValue = document.getElementById("mseValue");
const rmseValue = document.getElementById("rmseValue");
const maeValue = document.getElementById("maeValue");
const r2Value = document.getElementById("r2Value");
const metricExplanation = document.getElementById("metricExplanation");
const linearCompare = document.getElementById("linearCompare");
const quadraticCompare = document.getElementById("quadraticCompare");
const predictInput = document.getElementById("predictInput");
const predictionValue = document.getElementById("predictionValue");
const predictionFormula = document.getElementById("predictionFormula");

const xMax = 100;
const yMax = 12;
const hitRadius = 14;

let nextPointId = 1;
let selectedPointId = null;
let draggingPointId = null;
let modelType = "linear";
let showResiduals = true;
let points = [];
let mathRenderTimer = null;

const starterPoints = [
  { x: 22, y: 3.2 },
  { x: 34, y: 4.4 },
  { x: 48, y: 5.6 },
  { x: 60, y: 7.4 },
  { x: 75, y: 8.0 },
  { x: 88, y: 10.2 }
];

const datasetPresets = {
  simple: starterPoints,
  noisy: [
    { x: 14, y: 2.9 },
    { x: 25, y: 4.6 },
    { x: 36, y: 4.1 },
    { x: 48, y: 6.8 },
    { x: 60, y: 6.2 },
    { x: 72, y: 8.9 },
    { x: 86, y: 8.4 },
    { x: 94, y: 10.5 }
  ],
  outlier: [
    { x: 18, y: 3.1 },
    { x: 30, y: 4.2 },
    { x: 44, y: 5.4 },
    { x: 58, y: 6.8 },
    { x: 70, y: 8.2 },
    { x: 84, y: 9.5 },
    { x: 94, y: 2.1 }
  ],
  nonlinear: [
    { x: 10, y: 2.0 },
    { x: 20, y: 2.2 },
    { x: 32, y: 3.0 },
    { x: 45, y: 4.3 },
    { x: 58, y: 6.0 },
    { x: 70, y: 8.2 },
    { x: 82, y: 10.6 },
    { x: 92, y: 11.4 }
  ]
};

function makePoint(x, y) {
  return { id: nextPointId++, x: clamp(x, 0, xMax), y: clamp(y, 0, yMax) };
}

function setPoints(list) {
  points = list.map((point) => makePoint(point.x, point.y));
  selectedPointId = points[0]?.id ?? null;
  updateAll();
}

function resetExample() {
  nextPointId = 1;
  modelType = "linear";
  syncModelControls();
  datasetSelect.value = "simple";
  setPoints(starterPoints);
}

function markCustomDataset() {
  if (datasetSelect) datasetSelect.value = "custom";
}

function loadDataset(name) {
  if (!datasetPresets[name]) return;
  modelType = name === "nonlinear" ? "quadratic" : "linear";
  syncModelControls();
  setPoints(datasetPresets[name]);
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function createRandomLinearPoints() {
  modelType = "linear";
  syncModelControls();
  markCustomDataset();
  const list = [];
  for (let i = 0; i < 9; i += 1) {
    const x = 10 + i * 10 + randomBetween(-2.5, 2.5);
    const y = 1.1 + 0.095 * x + randomBetween(-0.9, 0.9);
    list.push({ x, y });
  }
  setPoints(list);
}

function createRandomQuadraticPoints() {
  modelType = "quadratic";
  syncModelControls();
  markCustomDataset();
  const list = [];
  for (let i = 0; i < 10; i += 1) {
    const x = 8 + i * 9 + randomBetween(-2, 2);
    const y = 1.1 + 0.018 * x + 0.001 * x * x + randomBetween(-0.75, 0.75);
    list.push({ x, y });
  }
  setPoints(list);
}

function addPoint(x, y) {
  markCustomDataset();
  const point = makePoint(x, y);
  points.push(point);
  selectedPointId = point.id;
  updateAll();
  return point;
}

function addOutlier() {
  const x = randomBetween(72, 96);
  const y = Math.random() > 0.5 ? randomBetween(0.8, 2.3) : randomBetween(10, 11.6);
  addPoint(x, y);
}

function selectedPoint() {
  return points.find((point) => point.id === selectedPointId) || null;
}

function selectPoint(id) {
  selectedPointId = id;
  updateAll();
}

function deletePoint(id) {
  const index = points.findIndex((point) => point.id === id);
  if (index === -1) return;
  points.splice(index, 1);
  if (selectedPointId === id) {
    selectedPointId = points[index]?.id ?? points[index - 1]?.id ?? null;
  }
  updateAll();
}

function deleteSelectedPoint() {
  if (selectedPointId === null) return;
  deletePoint(selectedPointId);
}

function updatePoint(id, x, y) {
  const point = points.find((item) => item.id === id);
  if (!point) return null;
  markCustomDataset();
  point.x = clamp(x, 0, xMax);
  point.y = clamp(y, 0, yMax);
  updateAll();
  return point;
}

function updateSelectedPointFromInputs() {
  const point = selectedPoint();
  if (!point) return;
  updatePoint(point.id, Number(selectedXInput.value || 0), Number(selectedYInput.value || 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundTo(value, step) {
  return Math.round(value / step) * step;
}

function format(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  if (!Number.isFinite(value)) return "∞";
  return Number(value).toFixed(digits).replace(/\.?0+$/, "");
}

function formatTexNumber(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return "\\text{—}";
  if (!Number.isFinite(value)) return "\\infty";
  return format(value, digits);
}

function compactRows(rows, limit = 5) {
  if (rows.length <= limit) return rows;
  return [rows[0], rows[1], rows[2], "dots", rows[rows.length - 1]];
}

function latexMatrix(rows, digits = 2, limit = 5) {
  return `\\begin{bmatrix}${compactRows(rows, limit).map((row) => {
    if (row === "dots") return "\\vdots & \\vdots & \\vdots";
    return row.map((value) => formatTexNumber(value, digits)).join(" & ");
  }).join(" \\\\ ")}\\end{bmatrix}`;
}

function latexVector(values, digits = 2, limit = 5) {
  return `\\begin{bmatrix}${compactRows(values.map((value) => [value]), limit).map((row) => {
    if (row === "dots") return "\\vdots";
    return formatTexNumber(row[0], digits);
  }).join(" \\\\ ")}\\end{bmatrix}`;
}

function renderMathSoon() {
  clearTimeout(mathRenderTimer);
  mathRenderTimer = setTimeout(() => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      window.MathJax.typesetPromise();
    }
  }, 150);
}

function chartBounds() {
  const rect = canvas.getBoundingClientRect();
  return { width: rect.width, height: rect.height, left: 46, right: 20, top: 22, bottom: 44 };
}

function innerSize(bounds) {
  return {
    width: bounds.width - bounds.left - bounds.right,
    height: bounds.height - bounds.top - bounds.bottom
  };
}

function dataToScreen(point) {
  const bounds = chartBounds();
  const inner = innerSize(bounds);
  return {
    x: bounds.left + (point.x / xMax) * inner.width,
    y: bounds.top + ((yMax - point.y) / yMax) * inner.height
  };
}

function screenToData(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const bounds = chartBounds();
  const inner = innerSize(bounds);
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const x = ((px - bounds.left) / inner.width) * xMax;
  const y = yMax - ((py - bounds.top) / inner.height) * yMax;
  return { x: clamp(roundTo(x, 0.5), 0, xMax), y: clamp(roundTo(y, 0.1), 0, yMax) };
}

function isInsidePlot(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const bounds = chartBounds();
  const inner = innerSize(bounds);
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  return px >= bounds.left && px <= bounds.left + inner.width && py >= bounds.top && py <= bounds.top + inner.height;
}

function hitTestPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;

  for (let index = points.length - 1; index >= 0; index -= 1) {
    const screen = dataToScreen(points[index]);
    const distance = Math.hypot(screen.x - px, screen.y - py);
    if (distance <= hitRadius) return points[index];
  }
  return null;
}

function mean(list, key) {
  return list.reduce((sum, point) => sum + point[key], 0) / list.length;
}

function fitLinearRegression(list) {
  const n = list.length;
  if (n < 2) {
    return { ok: false, type: "linear", reason: "Для линии нужно минимум 2 точки." };
  }

  const meanX = mean(list, "x");
  const meanY = mean(list, "y");
  let sxx = 0;
  let sxy = 0;

  for (const point of list) {
    sxx += (point.x - meanX) ** 2;
    sxy += (point.x - meanX) * (point.y - meanY);
  }

  if (Math.abs(sxx) < 1e-12) {
    return { ok: false, type: "linear", n, meanX, meanY, sxx, sxy, reason: "Все x одинаковые, поэтому наклон линии нельзя найти." };
  }

  const a = sxy / sxx;
  const b = meanY - a * meanX;
  return calculateMetrics({ ok: true, type: "linear", n, meanX, meanY, sxx, sxy, a, b }, list);
}

function fitQuadraticRegression(list) {
  const n = list.length;
  if (n < 3) {
    return { ok: false, type: "quadratic", reason: "Для параболы нужно минимум 3 точки." };
  }

  let sx = 0;
  let sx2 = 0;
  let sx3 = 0;
  let sx4 = 0;
  let sy = 0;
  let sxy = 0;
  let sx2y = 0;

  for (const point of list) {
    const x2 = point.x ** 2;
    sx += point.x;
    sx2 += x2;
    sx3 += x2 * point.x;
    sx4 += x2 ** 2;
    sy += point.y;
    sxy += point.x * point.y;
    sx2y += x2 * point.y;
  }

  const matrix = [
    [n, sx, sx2],
    [sx, sx2, sx3],
    [sx2, sx3, sx4]
  ];
  const vector = [sy, sxy, sx2y];
  const solution = solve3x3(matrix, vector);

  if (!solution) {
    return { ok: false, type: "quadratic", reason: "Матрица для параболы вырожденная. Попробуй точки с разными x." };
  }

  const [b, a, q] = solution;
  return calculateMetrics({ ok: true, type: "quadratic", n, q, a, b, matrix, vector }, list);
}

function solve3x3(matrix, vector) {
  const a = matrix.map((row, index) => [...row, vector[index]]);
  const size = 3;

  for (let col = 0; col < size; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < size; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }

    if (Math.abs(a[pivot][col]) < 1e-10) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];

    const divisor = a[col][col];
    for (let item = col; item <= size; item += 1) a[col][item] /= divisor;

    for (let row = 0; row < size; row += 1) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let item = col; item <= size; item += 1) {
        a[row][item] -= factor * a[col][item];
      }
    }
  }

  return [a[0][3], a[1][3], a[2][3]];
}

function predict(model, x) {
  if (!model.ok) return null;
  if (model.type === "quadratic") return model.q * x * x + model.a * x + model.b;
  return model.a * x + model.b;
}

function calculateMetrics(model, list) {
  const n = list.length;
  const meanY = mean(list, "y");
  const predictions = list.map((point) => predict(model, point.x));
  const residuals = list.map((point, index) => point.y - predictions[index]);
  const squaredResiduals = residuals.map((residual) => residual ** 2);
  const rss = squaredResiduals.reduce((sum, value) => sum + value, 0);
  const mse = rss / n;
  const rmse = Math.sqrt(mse);
  const mae = residuals.reduce((sum, value) => sum + Math.abs(value), 0) / n;
  const tss = list.reduce((sum, point) => sum + (point.y - meanY) ** 2, 0);
  const r2 = Math.abs(tss) < 1e-12 ? null : 1 - rss / tss;
  return { ...model, meanY, predictions, residuals, squaredResiduals, rss, mse, rmse, mae, tss, r2 };
}

function fitCurrentModel() {
  return modelType === "quadratic" ? fitQuadraticRegression(points) : fitLinearRegression(points);
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  if (rect.width === 0 || rect.height === 0) return;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const bounds = chartBounds();
  const inner = innerSize(bounds);
  ctx.clearRect(0, 0, bounds.width, bounds.height);
  drawAxes(bounds, inner);

  const model = fitCurrentModel();
  if (model.ok) {
    if (showResiduals) drawResiduals(model);
    if (model.type === "quadratic") drawQuadraticModel(model);
    else drawLineModel(model);
  }

  drawPoints();
}

function drawAxes(bounds, inner) {
  ctx.save();
  ctx.fillStyle = "#fbfdff";
  ctx.fillRect(0, 0, bounds.width, bounds.height);
  ctx.strokeStyle = "#dce5f2";
  ctx.lineWidth = 1;
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Arial";
  ctx.fillStyle = "#475569";

  for (let x = 0; x <= xMax; x += 20) {
    const px = bounds.left + (x / xMax) * inner.width;
    ctx.beginPath();
    ctx.moveTo(px, bounds.top);
    ctx.lineTo(px, bounds.top + inner.height);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillText(String(x), px, bounds.top + inner.height + 24);
  }

  for (let y = 0; y <= yMax; y += 2) {
    const py = bounds.top + ((yMax - y) / yMax) * inner.height;
    ctx.beginPath();
    ctx.moveTo(bounds.left, py);
    ctx.lineTo(bounds.left + inner.width, py);
    ctx.stroke();
    ctx.textAlign = "right";
    ctx.fillText(String(y), bounds.left - 8, py + 4);
  }

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bounds.left, bounds.top);
  ctx.lineTo(bounds.left, bounds.top + inner.height);
  ctx.lineTo(bounds.left + inner.width, bounds.top + inner.height);
  ctx.stroke();

  ctx.fillStyle = "#334155";
  ctx.textAlign = "center";
  ctx.font = "700 11px system-ui, -apple-system, Segoe UI, Arial";
  ctx.fillText("Площадь x, м²", bounds.left + inner.width / 2, bounds.height - 8);

  ctx.save();
  ctx.translate(12, bounds.top + inner.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("Цена y, млн ₽", 0, 0);
  ctx.restore();
  ctx.restore();
}

function clipToPlot() {
  const bounds = chartBounds();
  const inner = innerSize(bounds);
  ctx.beginPath();
  ctx.rect(bounds.left, bounds.top, inner.width, inner.height);
  ctx.clip();
}

function drawLineModel(model) {
  const p1 = dataToScreen({ x: 0, y: predict(model, 0) });
  const p2 = dataToScreen({ x: xMax, y: predict(model, xMax) });
  ctx.save();
  clipToPlot();
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.stroke();
  ctx.restore();
}

function drawQuadraticModel(model) {
  ctx.save();
  clipToPlot();
  ctx.strokeStyle = "#7c3aed";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let step = 0; step <= 120; step += 1) {
    const x = (step / 120) * xMax;
    const point = dataToScreen({ x, y: predict(model, x) });
    if (step === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawResiduals(model) {
  ctx.save();
  clipToPlot();
  ctx.strokeStyle = "rgba(220, 38, 38, 0.72)";
  ctx.lineWidth = 2;

  points.forEach((point) => {
    const actual = dataToScreen(point);
    const predicted = dataToScreen({ x: point.x, y: predict(model, point.x) });
    ctx.beginPath();
    ctx.moveTo(actual.x, actual.y);
    ctx.lineTo(predicted.x, predicted.y);
    ctx.stroke();
  });

  ctx.restore();
}

function drawPoints() {
  ctx.save();

  points.forEach((point, index) => {
    const screen = dataToScreen(point);
    const isSelected = point.id === selectedPointId;

    ctx.beginPath();
    ctx.arc(screen.x, screen.y, isSelected ? 9 : 7, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? "#f97316" : "#2563eb";
    ctx.fill();
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.strokeStyle = isSelected ? "#fed7aa" : "white";
    ctx.stroke();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, 15, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(249, 115, 22, 0.42)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    ctx.fillStyle = "#111827";
    ctx.font = "800 11px system-ui, -apple-system, Segoe UI, Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(index + 1), screen.x, screen.y - 14);
  });

  ctx.restore();
}

function updateAll() {
  const model = fitCurrentModel();
  draw();
  updateModelPanel(model);
  updateMetrics(model);
  updateLiveExplanation(model);
  updateSelectedPanel(model);
  updatePrediction(model);
}

function updateModelPanel(model) {
  if (!model.ok) {
    lineFormula.textContent = model.reason;
    lineFormula.dataset.mode = "invalid";
    coefficientValues.innerHTML = "";
    modelHint.textContent = modelType === "quadratic"
      ? "Парабола требует минимум 3 точки, потому что нужно найти три коэффициента: q, a и b."
      : "Линия требует минимум 2 точки, чтобы найти наклон и сдвиг.";
    return;
  }

  if (model.type === "quadratic") {
    if (lineFormula.dataset.mode !== "quadratic") {
      lineFormula.innerHTML = "\\[\\hat{y}=qx^2+ax+b\\]";
      lineFormula.dataset.mode = "quadratic";
      renderMathSoon();
    }
    coefficientValues.innerHTML = `
      <div class="value-row"><span>q</span><strong>${format(model.q, 6)}</strong></div>
      <div class="value-row"><span>a</span><strong>${format(model.a, 5)}</strong></div>
      <div class="value-row"><span>b</span><strong>${format(model.b, 5)}</strong></div>
      <div class="value-row"><span>Итог</span><strong>ŷ = ${format(model.q, 5)}x² ${model.a >= 0 ? "+" : "−"} ${format(Math.abs(model.a), 4)}x ${model.b >= 0 ? "+" : "−"} ${format(Math.abs(model.b), 4)}</strong></div>
    `;
    modelHint.textContent = "Парабола гибче прямой: она может изгибаться, но слишком гибкая модель иногда начинает подгоняться под шум.";
  } else {
    if (lineFormula.dataset.mode !== "linear") {
      lineFormula.innerHTML = "\\[\\hat{y}=ax+b\\]";
      lineFormula.dataset.mode = "linear";
      renderMathSoon();
    }
    coefficientValues.innerHTML = `
      <div class="value-row"><span>a</span><strong>${format(model.a, 5)}</strong></div>
      <div class="value-row"><span>b</span><strong>${format(model.b, 5)}</strong></div>
      <div class="value-row"><span>Итог</span><strong>ŷ = ${format(model.a, 4)}x ${model.b >= 0 ? "+" : "−"} ${format(Math.abs(model.b), 4)}</strong></div>
    `;
    modelHint.textContent = "Линейная модель выбирает прямую, у которой сумма квадратов residuals минимальна.";
  }
}

function updateMetrics(model) {
  pointsCountText.textContent = `Точек: ${points.length}`;
  rssValue.textContent = model.ok ? format(model.rss, 3) : "—";
  mseValue.textContent = model.ok ? format(model.mse, 3) : "—";
  rmseValue.textContent = model.ok ? format(model.rmse, 3) : "—";
  maeValue.textContent = model.ok ? format(model.mae, 3) : "—";
  r2Value.textContent = model.ok && model.r2 !== null ? format(model.r2, 3) : "—";

  const linear = fitLinearRegression(points);
  const quadratic = fitQuadraticRegression(points);
  linearCompare.textContent = linear.ok ? `MSE = ${format(linear.mse, 3)}, R² = ${linear.r2 === null ? "—" : format(linear.r2, 3)}` : linear.reason;
  quadraticCompare.textContent = quadratic.ok ? `MSE = ${format(quadratic.mse, 3)}, R² = ${quadratic.r2 === null ? "—" : format(quadratic.r2, 3)}` : quadratic.reason;

  metricExplanation.textContent = model.ok && model.r2 !== null
    ? `R² = ${format(model.r2, 3)}. Это сравнение с baseline-моделью: “всегда предсказывать среднее y”. Меньшая ошибка не всегда значит лучшая модель: слишком гибкая парабола может подгоняться под шум.`
    : "R² появится, когда можно сравнить ошибку модели с ошибкой baseline-прогноза “всегда среднее y”.";
}

function updateLiveExplanation(model) {
  if (!model.ok) {
    liveExplanation.innerHTML = `<div class="explanation-row"><span>Статус</span><strong>${model.reason}</strong></div>`;
    matrixExplanation.innerHTML = "Матричный расчёт появится, когда выбрана парабола и есть минимум 3 точки.";
    return;
  }

  if (model.type === "linear") {
    liveExplanation.innerHTML = `
      <div class="formula-card">\\[S_{xx}=\\sum_{i=1}^{n}(x_i-\\bar{x})^2\\]</div>
      <div class="formula-card">\\[S_{xy}=\\sum_{i=1}^{n}(x_i-\\bar{x})(y_i-\\bar{y})\\]</div>
      <div class="formula-card">\\[a=\\frac{S_{xy}}{S_{xx}},\\quad b=\\bar{y}-a\\bar{x}\\]</div>
      <div class="explanation-row"><span>Количество точек</span><strong>n = ${points.length}</strong></div>
      <div class="explanation-row"><span>Средние</span><strong>x̄ = ${format(model.meanX, 3)}, ȳ = ${format(model.meanY, 3)}</strong></div>
      <div class="explanation-row"><span>Sxx</span><strong>${format(model.sxx, 3)}</strong></div>
      <div class="explanation-row"><span>Sxy</span><strong>${format(model.sxy, 3)}</strong></div>
      <div class="explanation-row"><span>Расчёт наклона</span><strong>a = ${format(model.sxy, 3)} / ${format(model.sxx, 3)} = ${format(model.a, 5)}</strong></div>
      <div class="explanation-row"><span>Сдвиг</span><strong>b = ${format(model.b, 5)}</strong></div>
      <p class="small-text">Sxy показывает, как x и y меняются вместе. Sxx показывает разброс x. Поэтому a показывает, насколько y в среднем меняется при увеличении x на 1.</p>
    `;
    matrixExplanation.innerHTML = "Для прямой используется ручная формула через Sxx и Sxy. Матричный расчёт нужен ниже для параболы.";
    renderMathSoon();
    return;
  }

  liveExplanation.innerHTML = `
    <div class="formula-card">\\[\\theta=(X^T X)^{-1}X^T y\\]</div>
    <div class="formula-card">\\[\\theta=\\begin{bmatrix}b\\\\a\\\\q\\end{bmatrix}\\]</div>
    <div class="explanation-row"><span>Количество точек</span><strong>n = ${points.length}</strong></div>
    <div class="explanation-row"><span>Признаки</span><strong>1, x и x²</strong></div>
    <div class="explanation-row"><span>Коэффициенты</span><strong>q = ${format(model.q, 6)}, a = ${format(model.a, 5)}, b = ${format(model.b, 5)}</strong></div>
    <p class="small-text">Здесь X — таблица признаков: 1, x и x². Так модель получает возможность изгибаться, но всё ещё подбирает коэффициенты методом наименьших квадратов.</p>
  `;
  const designRows = points.map((point) => [1, point.x, point.x ** 2]);
  matrixExplanation.innerHTML = `
    <div class="matrix-solution">
      <p>Для параболы каждая точка превращается в строку признаков \\([1, x_i, x_i^2]\\). Затем решается normal equation.</p>
      <div class="matrix-formula formula-card">
        \\[
          X=${latexMatrix(designRows, 2)},\\qquad
          y=${latexVector(points.map((point) => point.y), 2)}
        \\]
      </div>
      <div class="matrix-formula formula-card">
        \\[
          X^T X=${latexMatrix(model.matrix, 2, 3)},\\qquad
          X^T y=${latexVector(model.vector, 2, 3)}
        \\]
      </div>
      <div class="matrix-formula formula-card">
        \\[
          \\theta=(X^T X)^{-1}X^T y
        \\]
      </div>
      <div class="matrix-formula formula-card">
        \\[
          \\theta=
          \\begin{bmatrix}
            b\\\\
            a\\\\
            q
          \\end{bmatrix}
          =
          ${latexVector([model.b, model.a, model.q], 5, 3)}
        \\]
      </div>
      <p>Итог: \\(b=${format(model.b, 5)}\\), \\(a=${format(model.a, 5)}\\), \\(q=${format(model.q, 6)}\\). Эти коэффициенты дают параболу \\(\\hat{y}=qx^2+ax+b\\).</p>
    </div>
  `;
  renderMathSoon();
}

function updateSelectedPanel(model) {
  const point = selectedPoint();
  if (!point) {
    selectedBadge.textContent = "Нет выбора";
    selectedBadge.classList.remove("active");
    selectedDetails.className = "selected-details empty";
    selectedDetails.textContent = "Выберите точку на графике.";
    selectedXInput.value = "";
    selectedYInput.value = "";
    selectedXInput.disabled = true;
    selectedYInput.disabled = true;
    selectedDeleteBtn.disabled = true;
    return;
  }

  const index = points.findIndex((item) => item.id === point.id);
  const yHat = model.ok ? predict(model, point.x) : null;
  const residual = model.ok ? point.y - yHat : null;
  const residualSquared = residual === null ? null : residual ** 2;

  selectedBadge.textContent = `Точка ${index + 1}`;
  selectedBadge.classList.add("active");
  selectedDetails.className = "selected-details";
  selectedDetails.innerHTML = `
    <div class="point-stat"><span>№</span><strong>${index + 1}</strong></div>
    <div class="point-stat"><span>xᵢ</span><strong>${format(point.x, 2)}</strong></div>
    <div class="point-stat"><span>yᵢ</span><strong>${format(point.y, 2)}</strong></div>
    <div class="point-stat"><span>ŷᵢ</span><strong>${format(yHat, 3)}</strong></div>
    <div class="point-stat"><span>eᵢ = yᵢ − ŷᵢ</span><strong>${format(residual, 3)}</strong></div>
    <div class="point-stat"><span>eᵢ²</span><strong>${format(residualSquared, 3)}</strong></div>
  `;
  selectedXInput.disabled = false;
  selectedYInput.disabled = false;
  selectedDeleteBtn.disabled = false;
  selectedXInput.value = format(point.x, 2);
  selectedYInput.value = format(point.y, 2);
}

function updatePrediction(model) {
  if (!model.ok) {
    predictionValue.textContent = "—";
    predictionFormula.textContent = "Нужна обученная модель";
    return;
  }

  const x = clamp(Number(predictInput.value || 0), 0, xMax);
  const y = predict(model, x);
  predictionValue.textContent = `${format(y, 3)} млн ₽`;
  predictionFormula.textContent = model.type === "quadratic"
    ? `ŷ = ${format(model.q, 5)}·${format(x, 2)}² + ${format(model.a, 4)}·${format(x, 2)} + ${format(model.b, 4)} = ${format(y, 4)}`
    : `ŷ = ${format(model.a, 4)}·${format(x, 2)} + ${format(model.b, 4)} = ${format(y, 4)}`;
}

function handlePointerDown(event) {
  event.preventDefault();
  const hit = hitTestPoint(event.clientX, event.clientY);

  if (hit) {
    selectedPointId = hit.id;
    draggingPointId = hit.id;
    canvas.setPointerCapture(event.pointerId);
    updateAll();
    return;
  }

  if (!isInsidePlot(event.clientX, event.clientY)) return;
  const dataPoint = screenToData(event.clientX, event.clientY);
  const point = addPoint(dataPoint.x, dataPoint.y);
  draggingPointId = point.id;
  canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (draggingPointId === null) return;
  event.preventDefault();
  const point = points.find((item) => item.id === draggingPointId);
  if (!point) return;
  const dataPoint = screenToData(event.clientX, event.clientY);
  updatePoint(point.id, dataPoint.x, dataPoint.y);
}

function handlePointerUp(event) {
  if (draggingPointId !== null) {
    draggingPointId = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }
}

function syncModelControls() {
  document.querySelectorAll('input[name="modelType"]').forEach((input) => {
    input.checked = input.value === modelType;
  });
}

canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointermove", handlePointerMove);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", handlePointerUp);
window.addEventListener("resize", resizeCanvas);

document.querySelectorAll('input[name="modelType"]').forEach((input) => {
  input.addEventListener("change", () => {
    modelType = input.value;
    updateAll();
  });
});

residualsToggle.addEventListener("change", () => {
  showResiduals = residualsToggle.checked;
  updateAll();
});
resetBtn.addEventListener("click", resetExample);
clearBtn.addEventListener("click", () => {
  markCustomDataset();
  points = [];
  selectedPointId = null;
  updateAll();
});
randomLinearBtn.addEventListener("click", createRandomLinearPoints);
randomQuadraticBtn.addEventListener("click", createRandomQuadraticPoints);
addOutlierBtn.addEventListener("click", addOutlier);
deleteSelectedBtn.addEventListener("click", deleteSelectedPoint);
selectedDeleteBtn.addEventListener("click", deleteSelectedPoint);
selectedXInput.addEventListener("input", updateSelectedPointFromInputs);
selectedYInput.addEventListener("input", updateSelectedPointFromInputs);
predictInput.addEventListener("input", () => updatePrediction(fitCurrentModel()));
datasetSelect.addEventListener("change", () => loadDataset(datasetSelect.value));

document.addEventListener("keydown", (event) => {
  const tag = event.target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  if (event.key === "Delete" || event.key === "Backspace") deleteSelectedPoint();
});

syncModelControls();
resizeCanvas();
resetExample();
