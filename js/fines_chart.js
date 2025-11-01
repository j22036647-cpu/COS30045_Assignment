// js/fines_chart.js
async function renderFinesChart(selectedYear = "all") {
  const data = await d3.csv("data/fines_2008_2024.csv", d3.autoType);

  // 如果有年份筛选，只保留那一年的数据
  const filteredData =
    selectedYear === "all" ? data : data.filter(d => d.YEAR === +selectedYear);

  // 聚合罚款总数（以 METRIC 为单位）
  const finesByMetric = d3.rollup(
    filteredData,
    v => d3.sum(v, d => d.COUNT),
    d => d.METRIC
  );

  const finesArray = Array.from(finesByMetric, ([METRIC, COUNT]) => ({
    METRIC,
    COUNT
  })).sort((a, b) => d3.descending(a.COUNT, b.COUNT));

  // 图表尺寸
  const width = 800, height = 400, margin = { top: 30, right: 30, bottom: 100, left: 100 };

  d3.select("#fines-chart").selectAll("*").remove();

  const svg = d3
    .select("#fines-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const x = d3
    .scaleBand()
    .domain(finesArray.map(d => d.METRIC))
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(finesArray, d => d.COUNT)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  svg
    .append("g")
    .selectAll("rect")
    .data(finesArray)
    .join("rect")
    .attr("x", d => x(d.METRIC))
    .attr("y", d => y(d.COUNT))
    .attr("height", d => y(0) - y(d.COUNT))
    .attr("width", x.bandwidth())
    .attr("fill", "#14532d");

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y));

  // 图表标题
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(
      selectedYear === "all"
        ? "Total Fines by Metric (2008–2024)"
        : `Total Fines by Metric in ${selectedYear}`
    );
}

// ===============================
// 初始化年份下拉菜单 + 监听事件
// ===============================
d3.csv("data/fines_2008_2024.csv", d3.autoType).then(data => {
  const years = Array.from(new Set(data.map(d => d.YEAR))).sort((a, b) => a - b);
  const select = d3.select("#yearSelect");

  years.forEach(year => {
    select.append("option").attr("value", year).text(year);
  });

  select.on("change", function () {
    const selected = this.value;
    renderFinesChart(selected);
  });

  renderFinesChart("all");
});
