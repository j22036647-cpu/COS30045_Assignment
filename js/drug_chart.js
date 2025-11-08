d3.csv("data/drug_test.csv").then(data => {
  data.forEach(d => {
    d.YEAR = +d.YEAR;
    d.Count = +d["Count(ColumnValues)"];
    d.Drug = d["ColumnNames"];
    d.State = d["JURISDICTION"];
  });

  const years = [...new Set(data.map(d => d.YEAR))].sort((a, b) => a - b);
  const yearSelect = d3.select("#drug-year-select");
  yearSelect.selectAll("option")
    .data(years)
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d);

  const margin = { top: 40, right: 30, bottom: 100, left: 80 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

  const svg = d3.select("#drug-chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  function update(year) {
    const yearData = data.filter(d => d.YEAR === year);
    const states = [...new Set(yearData.map(d => d.State))];
    const drugs = [...new Set(yearData.map(d => d.Drug))];

    const groupedData = states.map(state => ({
      state,
      values: drugs.map(drug => {
        const match = yearData.find(d => d.State === state && d.Drug === drug);
        return { drug, value: match ? match.Count : 0 };
      })
    }));

    const x0 = d3.scaleBand()
      .domain(states)
      .range([0, width])
      .paddingInner(0.2);

    const x1 = d3.scaleBand()
      .domain(drugs)
      .range([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLog()
      .domain([1, d3.max(groupedData.flatMap(d => d.values), v => v.value)])
      .range([height, 0])
      .nice();

    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(drugs);

    svg.selectAll("*").remove();

    // 坐标轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("transform", "rotate(-40)")
      .style("text-anchor", "end")
      .style("fill", "#ccc");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(6, "~s"))
      .selectAll("text")
      .style("fill", "#ccc");

    svg.append("text")
      .attr("x", -50)
      .attr("y", -10)
      .attr("fill", "#ccc")
      .text("Positive Drug Tests (log scale)");

    // ✅ 动画版柱状图
    const bars = svg.append("g")
      .selectAll("g")
      .data(groupedData)
      .join("g")
      .attr("transform", d => `translate(${x0(d.state)},0)`)
      .selectAll("rect")
      .data(d => d.values)
      .join("rect")
      .attr("x", d => x1(d.drug))
      .attr("y", height) // 从底部开始
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", d => color(d.drug))
      .attr("fill-opacity", 0.7)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`
          <strong>${d.drug}</strong><br>
          ${d.value.toLocaleString()} detections
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 30) + "px");
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr("fill-opacity", 1)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5);
      })
      .on("mouseout", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0);
        d3.select(event.currentTarget)
          .transition()
          .duration(300)
          .attr("fill-opacity", 0.7)
          .attr("stroke-width", 0);
      });

    // 🎬 平滑动画
    bars.transition()
      .duration(800)
      .delay((d, i) => i * 30)
      .ease(d3.easeCubicOut)
      .attr("y", d => y(Math.max(1, d.value)))
      .attr("height", d => height - y(Math.max(1, d.value)))
      .attr("fill-opacity", 1);

    // 图例
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 100}, 0)`);

    drugs.forEach((drug, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      g.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(drug));
      g.append("text").attr("x", 18).attr("y", 10).text(drug).attr("font-size", "12px").attr("fill", "#ccc");
    });
  }

  update(years[0]);
  yearSelect.on("change", e => update(+e.target.value));
});
