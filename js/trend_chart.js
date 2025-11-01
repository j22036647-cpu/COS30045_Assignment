function renderTrendChart() {
  const container = d3.select("#chart"); container.html(""); container.append("div").attr("id","trendDiv");
  const div = d3.select("#trendDiv");

  const margin = {top:40,right:20,bottom:60,left:80},
        width = 540 - margin.left - margin.right,
        height = 340 - margin.top - margin.bottom;

  const svg = div.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  d3.csv("data/fines_2008_2024.csv").then(raw=>{
    // prepare data: attempt to aggregate year totals
    raw.forEach(d=>{
      d.YEAR = +d.YEAR || +d.Year || +d.year || null;
      d._value = + (d.TOTAL || d["Sum(FINES)"] || d["Sum(COUNT)"] || d.COUNT || 0);
      if (isNaN(d._value)) d._value = 0;
    });

    const grouped = d3.rollups(raw, v=>d3.sum(v,d=>d._value), d=>d.YEAR)
      .filter(d=>d[0] != null)
      .map(([year,total])=>({YEAR:+year, TOTAL: total}))
      .sort((a,b)=>a.YEAR - b.YEAR);

    const x = d3.scaleLinear().domain(d3.extent(grouped,d=>d.YEAR)).range([0,width]);
    const y = d3.scaleLinear().domain([0,d3.max(grouped,d=>d.TOTAL)]).nice().range([height,0]);

    const line = d3.line().x(d=>x(d.YEAR)).y(d=>y(d.TOTAL));

    const tooltip = d3.select("body").append("div").attr("class","tooltip").style("opacity",0);

    svg.append("path").datum(grouped).attr("fill","none").attr("stroke","#00ff88").attr("stroke-width",2).attr("d",line);

    svg.selectAll("circle").data(grouped).join("circle")
      .attr("cx",d=>x(d.YEAR)).attr("cy",d=>y(d.TOTAL)).attr("r",4).attr("fill","#00ff88")
      .on("mousemove",(event,d)=> tooltip.style("opacity",1).html(`${d.YEAR}<br>${d.TOTAL.toLocaleString()}`)
           .style("left",(event.pageX+12)+"px").style("top",(event.pageY-30)+"px"))
      .on("mouseout",()=> tooltip.style("opacity",0));

    svg.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    svg.append("g").call(d3.axisLeft(y));
    svg.append("text").attr("x",width/2).attr("y",-12).attr("fill","#00ff88").attr("text-anchor","middle").text("Trend of Total Fines (2008–2024)");
  }).catch(err=>{
    console.error("Trend load error:", err);
    d3.select("#trendDiv").append("p").text("Error loading fines data for trend.");
  });
}
