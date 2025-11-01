function renderDrugChart() {
  const container = d3.select("#chart"); container.html(""); container.append("div").attr("id","drugDiv");
  const div = d3.select("#drugDiv");

  const margin = {top:40,right:20,bottom:120,left:80},
        width = 540 - margin.left - margin.right,
        height = 340 - margin.top - margin.bottom;

  const svg = div.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g").attr("transform",`translate(${margin.left},${margin.top})`);

  d3.csv("data/drug_tests_2008_2024.csv").then(raw=>{
    raw.forEach(d=>{
      // robust numeric extraction
      d._value = + (d["Sum(COUNT)"] || d.TOTAL || d.COUNT || 0);
      if (isNaN(d._value)) d._value = 0;
      d.JUR = d.JURISDICTION || d.State || d.jurisdiction || d.JUR || "Unknown";
    });

    const agg = d3.rollups(raw, v=>d3.sum(v,d=>d._value), d=>d.JUR)
      .map(([jur,total])=>({JURISDICTION:jur, TOTAL:total}))
      .sort((a,b)=>b.TOTAL - a.TOTAL);

    const x = d3.scaleBand().domain(agg.map(d=>d.JURISDICTION)).range([0,width]).padding(0.2);
    const y = d3.scaleLinear().domain([0,d3.max(agg,d=>d.TOTAL)]).nice().range([height,0]);

    const tooltip = d3.select("body").append("div").attr("class","tooltip").style("opacity",0);

    svg.selectAll("rect").data(agg).join("rect")
      .attr("x",d=>x(d.JURISDICTION)).attr("y",d=>y(d.TOTAL))
      .attr("width",x.bandwidth()).attr("height",d=>height - y(d.TOTAL)).attr("fill","#00ff88")
      .on("mousemove",(event,d)=> tooltip.style("opacity",1).html(`${d.JURISDICTION}<br>${d.TOTAL.toLocaleString()}`)
           .style("left",(event.pageX+12)+"px").style("top",(event.pageY-30)+"px"))
      .on("mouseout",()=> tooltip.style("opacity",0));

    svg.append("g").attr("transform",`translate(0,${height})`).call(d3.axisBottom(x)).selectAll("text").attr("transform","rotate(-45)").style("text-anchor","end");
    svg.append("g").call(d3.axisLeft(y));
    svg.append("text").attr("x",width/2).attr("y",-12).attr("fill","#00ff88").attr("text-anchor","middle").text("Positive Drug Tests by State (2008–2024)");
  }).catch(err=>{
    console.error("Drug CSV load error:", err);
    d3.select("#drugDiv").append("p").text("Error loading drug tests data.");
  });
}
