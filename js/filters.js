// js/filters.js

// 通用年份选择器函数
async function initYearSelector(selectId, renderFunction) {
  try {
    // 默认从 fines 数据里取所有年份（可以根据项目实际改成其他源）
    const data = await d3.csv("data/fines_detailed_2023_2024.csv");
    const years = Array.from(new Set(data.map(d => d.YEAR))).sort();

    const select = d3.select(selectId);
    select.selectAll("option")
      .data(years)
      .join("option")
      .attr("value", d => d)
      .text(d => d);

    // 默认选中最新年份
    const defaultYear = years[0];
    select.property("value", defaultYear);

    // 初次渲染
    renderFunction(defaultYear);

    // 当用户切换年份时重新渲染
    select.on("change", (event) => {
      const selectedYear = event.target.value;
      renderFunction(selectedYear);
    });

  } catch (err) {
    console.error("Error initializing year selector for:", selectId, err);
  }
}

// 初始化各个图表的年份选择
initYearSelector("#fines-year-select", renderFinesChart);
initYearSelector("#map-year-select", renderMap);
initYearSelector("#drug-year-select", renderDrugChart);

// 趋势图选择的是 offence type 而不是年份
async function initOffenceSelector() {
  const data = await d3.csv("data/fines_detailed_2023_2024.csv");
  const offences = Array.from(new Set(data.map(d => d.METRIC))).sort();

  const select = d3.select("#trend-year-select");
  select.selectAll("option")
    .data(offences)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const defaultOffence = offences[0];
  select.property("value", defaultOffence);

  renderTrendChart(defaultOffence);

  select.on("change", (event) => {
    const selected = event.target.value;
    renderTrendChart(selected);
  });
}

initOffenceSelector();
