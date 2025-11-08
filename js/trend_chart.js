// js/trend_chart.js
async function renderTrendChart() {
  const data = await d3.csv("data/fines_2008_2024.csv");

  // 🔹 转换数据格式
  data.forEach(d => {
    d.YEAR = +d.YEAR;
    d["Sum(FINES)"] = +d["Sum(FINES)"];
  });

  // 🔹 获取所有罪名列表
  const offenceTypes = Array.from(new Set(data.map(d => d.METRIC))).sort();

  // 默认显示第一个罪名
  let currentOffence = offenceTypes[0];

  const width = 900;
  const height = 500;
  const margin = { top: 60, right: 40, bottom: 60, left: 80 };

  // 创建 SVG
  const svg = d3.select("#line-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // ✅ 改用 scalePoint 让年份间距均匀
  const xScale = d3.scalePoint()
    .range([0, width - margin.left - margin.right])
    .padding(0.4);

  const yScale = d3.scaleLinear()
    .range([height - margin.top - margin.bottom, 0]);

  const xAxisGroup = chartArea.append("g")
    .attr("transform", `translate(0, ${height - margin.top - margin.bottom})`);

  const yAxisGroup = chartArea.append("g");

  const line = d3.line()
    .x(d => xScale(d.YEAR))
    .y(d => yScale(d["Sum(FINES)"]))
    .curve(d3.curveMonotoneX);

  const title = svg.append("text")
    .attr("x", width / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold");

  // ✅ Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // 🔹 按钮组
  const buttonGroup = d3.select("#trend-buttons");
  offenceTypes.forEach(offence => {
    buttonGroup.append("button")
      .text(offence)
      .attr("class", offence === currentOffence ? "active" : "")
      .on("click", () => {
        currentOffence = offence;
        buttonGroup.selectAll("button").classed("active", d => d === offence);
        updateChart();
      });
  });

  // 🔹 更新图表函数
  function updateChart() {
    const filtered = data.filter(d => d.METRIC === currentOffence);
    const years = Array.from(new Set(filtered.map(d => d.YEAR))).sort((a, b) => a - b);

    // 设置比例尺 domain
    xScale.domain(years);
    yScale.domain([0, d3.max(filtered, d => d["Sum(FINES)"]) * 1.1]);

    // 更新坐标轴
    xAxisGroup.transition().duration(800)
      .call(d3.axisBottom(xScale)
        .tickValues(years)
        .tickFormat(d3.format("d")));
    yAxisGroup.transition().duration(800)
      .call(d3.axisLeft(yScale).ticks(6));

    // 绑定数据绘制曲线
    const path = chartArea.selectAll(".trend-line").data([filtered]);

    path.join(
      enter => enter.append("path")
        .attr("class", "trend-line")
        .attr("fill", "none")
        .attr("stroke", "#007ACC")
        .attr("stroke-width", 3)
        .attr("d", line)
        .attr("opacity", 0)
        .call(enter => enter.transition().duration(1000).attr("opacity", 1)),
      update => update
        .transition().duration(800)
        .attr("d", line)
    );

    // ✅ 绘制小圆点
    const circles = chartArea.selectAll(".data-point").data(filtered);

    circles.join(
      enter => enter.append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.YEAR))
        .attr("cy", d => yScale(d["Sum(FINES)"]))
        .attr("r", 0)
        .attr("fill", "#FF9800")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(150).style("opacity", 1);
          tooltip.html(
            `<strong>${d.YEAR}</strong><br>Fines: ${d["Sum(FINES)"].toLocaleString()}`
          )
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 28) + "px");
          d3.select(event.currentTarget)
            .transition().duration(150)
            .attr("r", 8)
            .attr("fill", "#FFC107");
        })
        .on("mouseout", (event) => {
          tooltip.transition().duration(200).style("opacity", 0);
          d3.select(event.currentTarget)
            .transition().duration(150)
            .attr("r", 6)
            .attr("fill", "#FF9800");
        })
        .transition()
        .duration(800)
        .attr("r", 6),

      update => update
        .transition().duration(800)
        .attr("cx", d => xScale(d.YEAR))
        .attr("cy", d => yScale(d["Sum(FINES)"]))
    );

    // 标题更新
    title.text(`Trend of ${currentOffence} Fines Over Time`);
  }

  // 初始渲染
  updateChart();
}

renderTrendChart();
