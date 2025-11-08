async function renderMap() {
  const width = 1000;
  const height = 700;

  const svg = d3.select("#map-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#f9f9f9");

  const geoData = await d3.json("data/australian-states.json");
  const data = await d3.csv("data/fines_detailed_2023_2024.csv");

  const nameMap = {
    "NSW": "New South Wales",
    "VIC": "Victoria",
    "QLD": "Queensland",
    "SA": "South Australia",
    "WA": "Western Australia",
    "TAS": "Tasmania",
    "NT": "Northern Territory",
    "ACT": "Australian Capital Territory"
  };

  const years = Array.from(new Set(data.map(d => +d.YEAR))).sort((a, b) => a - b);
  const yearSelect = d3.select("#map-year-select");
  const metricSelect = d3.select("#map-metric-select");

  yearSelect.selectAll("option")
    .data(years)
    .join("option")
    .attr("value", d => d)
    .text(d => d);

  const defaultYear = years[0];
  yearSelect.property("value", defaultYear);

  let selectedMetric = "Sum(FINES)";

  const projection = d3.geoMercator()
    .center([133, -27])
    .scale(800)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath(projection);
  const mapGroup = svg.append("g");
  const tooltip = d3.select("#map-tooltip");

  const colorScales = {
    "Sum(FINES)": d3.interpolateReds,
    "Sum(ARRESTS)": d3.interpolateBlues,
    "Sum(CHARGES)": d3.interpolateGreens
  };

  function updateMap(selectedYear) {
    const filtered = data.filter(d => +d.YEAR === +selectedYear);
    const sumByState = d3.rollup(
      filtered,
      v => d3.sum(v, d => +d[selectedMetric]),
      d => nameMap[d.JURISDICTION] || d.JURISDICTION
    );

    const maxValue = d3.max(Array.from(sumByState.values()));
    const color = d3.scaleSequential(colorScales[selectedMetric]).domain([0, maxValue]);

    // 旧地图淡出
    mapGroup.transition().duration(500).style("opacity", 0)
      .on("end", () => {
        mapGroup.selectAll("*").remove();

        // 绘制地图
        const states = mapGroup.selectAll("path")
          .data(geoData.features)
          .join("path")
          .attr("d", path)
          .attr("fill", d => {
            const state = d.properties.STATE_NAME;
            const value = sumByState.get(state);
            return value ? color(value) : "#eee";
          })
          .attr("stroke", "#444")
          .attr("stroke-width", 1.2)
          .style("transition", "all 0.2s ease-out")
          .on("mouseover", function(event, d) {//mouse in 
            const state = d.properties.STATE_NAME;
            const value = sumByState.get(state) || 0;

            // 边框发光 + 放大一点
            d3.select(this)
              .raise()
              .transition().duration(150)
              .attr("stroke", "#000")
              .attr("stroke-width", 3)
              .style("filter", "drop-shadow(0px 0px 5px rgba(0,0,0,0.4))")
              .attr("transform", "scale(1.02)");

            tooltip
              .style("opacity", 1)
              .html(`<strong>${state}</strong><br>${selectedMetric.replace("Sum(", "").replace(")", "")}: ${value.toLocaleString()}`)
              .style("left", event.pageX + 15 + "px")
              .style("top", event.pageY - 30 + "px");
          })
          .on("mousemove", (event) => {
            tooltip
              .style("left", event.pageX + 15 + "px")
              .style("top", event.pageY - 30 + "px");
          })
          .on("mouseout", function() {
            d3.select(this)
              .transition().duration(200)
              .attr("stroke", "#444")
              .attr("stroke-width", 1.2)
              .style("filter", "none")
              .attr("transform", "scale(1)");

            tooltip.style("opacity", 0);
          });

        // 新地图淡入 + 缩放动画
        mapGroup
          .attr("transform", "scale(0.9)")
          .style("opacity", 0)
          .transition()
          .duration(1000)
          .ease(d3.easeCubicOut)
          .attr("transform", "scale(1)")
          .style("opacity", 1);
      });
  }

  updateMap(defaultYear);

  yearSelect.on("change", function() {
    updateMap(this.value);
  });

  metricSelect.on("change", function() {
    selectedMetric = this.value;
    updateMap(yearSelect.property("value"));
  });

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "20px")
    .attr("font-weight", "bold")
    .text("Geographic Distribution by State");
}
