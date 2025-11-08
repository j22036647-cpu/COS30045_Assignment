// js/fines_chart.js

// 全局 tooltip：如果页面上还没有就创建一个（避免每次渲染都新建）
function getOrCreateTooltip() {
  let tt = d3.select("body").select(".fines-tooltip");
  if (tt.empty()) {
    tt = d3.select("body")
      .append("div")
      .attr("class", "fines-tooltip tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#333")
      .style("color", "#fff")
      .style("padding", "6px 10px")
      .style("border-radius", "5px")
      .style("font-size", "13px")
      .style("pointer-events", "none");
  }
  return tt;
}

// 主函数：根据所选年份绘制总罚款图表
function renderFinesChart(selectedYear = "2008") {
  d3.csv("data/fines_2008_2024.csv").then(data => {
    data.forEach(d => {
      d.YEAR = +d.YEAR;
      d["Sum(FINES)"] = +d["Sum(FINES)"];
    });

    // 过滤选定年份
    const yearData = data.filter(d => d.YEAR === +selectedYear);

    const width = 800;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 50, left: 150 };

    // 中断并清理旧图表（防止快速切换时残留）
    const container = d3.select("#bar-chart");
    // 中断任何未完成的 transition
    container.selectAll("*").interrupt();
    // 清空 DOM
    container.selectAll("*").remove();

    // 新建 svg
    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    // X轴为罚款数量
    const x = d3.scaleLinear()
      .domain([0, d3.max(yearData, d => d["Sum(FINES)"])])
      .nice()
      .range([margin.left, width - margin.right]);

    // Y轴为违规类型
    const y = d3.scaleBand()
      .domain(yearData.map(d => d.METRIC))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    // 绘制X轴
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(".2s")))
      .attr("color", "#ccc");

    // 绘制Y轴
    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .attr("color", "#ccc");

    // 颜色比例
    const color = d3.scaleOrdinal()
      .domain(yearData.map(d => d.METRIC))
      .range(d3.schemeSet2);

    // tooltip（复用）
    const tooltip = getOrCreateTooltip();

    // 数据绑定、绘制条形（使用 join，以便后续可扩展为 update pattern）
    const bars = svg.selectAll("rect")
      .data(yearData, d => d.METRIC);

    // enter + update + exit using join
    bars.join(
      enter => enter.append("rect")
        .attr("x", margin.left)
        .attr("y", d => y(d.METRIC))
        .attr("width", 0) // 动画起点
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.METRIC))
        .attr("rx", 4)
        .attr("ry", 4)
        .call(enterSel => enterSel.transition()
          .duration(900)
          .ease(d3.easeCubicOut)
          .attr("width", d => x(d["Sum(FINES)"]) - margin.left)
        ),
      update => update
        .call(updateSel => updateSel.transition()
          .duration(700)
          .ease(d3.easeCubicOut)
          .attr("y", d => y(d.METRIC))
          .attr("height", y.bandwidth())
          .attr("width", d => x(d["Sum(FINES)"]) - margin.left)
          .attr("fill", d => color(d.METRIC))
        ),
      exit => exit.call(exitSel => exitSel.transition()
        .duration(300)
        .attr("width", 0)
        .remove()
      )
    );

    // 鼠标事件（hover 显示 tooltip、高亮）
    svg.selectAll("rect")
      .on("mouseover", function (event, d) {
        // 停止当前元素上的动画，立即高亮
        d3.select(this).interrupt()
          .transition().duration(160)
          .attr("fill", d3.color(color(d.METRIC)).darker(0.8))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .style("filter", "drop-shadow(0px 0px 6px #fff)");

        tooltip.transition().duration(80).style("opacity", 1);
        tooltip.html(
          `<strong>${d.METRIC}</strong><br/>Fines: ${d["Sum(FINES)"].toLocaleString()}`
        )
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event) {
        tooltip.style("left", (event.pageX + 15) + "px")
               .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this)
          .transition().duration(200)
          .attr("fill", color(d.METRIC))
          .attr("stroke-width", 0)
          .style("filter", "none");

        tooltip.transition().duration(200).style("opacity", 0);
      });
  });
}

// 初始化 fines chart 的年份下拉菜单
async function initFinesYearSelector() {
  const data = await d3.csv("data/fines_2008_2024.csv");
  const years = Array.from(new Set(data.map(d => +d.YEAR))).sort((a, b) => a - b);

  const select = d3.select("#year-select-fines");
  select.selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  // 默认选择最早年份
  const defaultYear = years[0];
  select.property("value", defaultYear);

  // 初次渲染
  renderFinesChart(defaultYear);

  // 切换年份时重新渲染
  select.on("change", (event) => {
    const selectedYear = event.target.value;
    renderFinesChart(selectedYear);
  });
}

// 执行初始化
initFinesYearSelector();
