function renderMapChart() {
  const container = d3.select("#chart"); container.html(""); container.append("div").attr("id","mapDiv");
  const div = d3.select("#mapDiv");

  const width = 1100, height = 560;
  const svg = div.append("svg").attr("width",width).attr("height",height);

  // load local geojson and fines 2023-24
  Promise.all([
    d3.json("data/australian-states.geojson"),
    d3.csv("data/fines_2023_2024.csv")
  ]).then(([geo, raw])=>{
    // build lookup by JURISDICTION (expects ABR like NSW/VIC) or by full name
    const lookup = new Map();
    raw.forEach(d=>{
      const key = d.JURISDICTION || d.JUR || d.State || d.state || d.STATE || d.Jurisdiction;
      const val = + (d.TOTAL || d["Sum(FINES)"] || d["Sum(COUNT)"] || d.TOTAL || 0);
      lookup.set(String(key).trim(), isNaN(val)?0:val);
    });

    // attempt to map geo properties to the same keys; inspect properties names
    // common: properties.STATE_CODE (like 'NSW') or properties.ste_code; fallback to name
    const codes = geo.features.map(f=>{
      return {
        code: f.properties.STATE_CODE || f.properties.state_code || f.properties.STATE || f.properties.STE_CODE || null,
        name: f.properties.STATE_NAME || f.properties.NAME || f.properties.state || f.properties.STATE_NAME
      };
    });

    // projection
    const projection = d3.geoMercator().fitSize([width,height],geo);
    const path = d3.geoPath().projection(projection);

    // compute domain for color scale using lookup values present in raw
    const maxVal = d3.max(Array.from(lookup.values()));
    const color = d3.scaleSequential(d3.interpolateGreens).domain([0, maxVal || 1]);

    const tooltip = d3.select("body").append("div").attr("class","tooltip").style("opacity",0);

    svg.selectAll("path").data(geo.features).join("path")
      .attr("d", path)
      .attr("fill", f=>{
        // try multiple property keys for match
        const keysToTry = [
          f.properties.STATE_CODE, f.properties.state_code,
          f.properties.STATE_ABBR, f.properties.STATE, f.properties.STE_CODE,
          f.properties.STATE_NAME, f.properties.NAME
        ];
        let v = 0;
        for (const k of keysToTry) {
          if (!k) continue;
          const val = lookup.get(String(k).trim());
          if (val !== undefined) { v = val; break; }
          // try match by name
          const val2 = lookup.get(String(k).trim().toUpperCase());
          if (val2 !== undefined) { v = val2; break; }
        }
        return color(v);
      })
      .attr("stroke","#0b0")
      .on("mousemove",(event,f)=>{
        // find value with same attempts
        let v=0; let label = f.properties.STATE_NAME || f.properties.NAME || "Unknown";
        const keysToTry = [f.properties.STATE_CODE, f.properties.state_code, f.properties.STATE, f.properties.NAME, f.properties.STATE_ABBR];
        for (const k of keysToTry){
          if (!k) continue;
          const candidate = lookup.get(String(k).trim());
          if (candidate !== undefined){ v=candidate; break; }
        }
        tooltip.style("opacity",1).html(`<strong>${label}</strong><br>${(v||0).toLocaleString()}`)
          .style("left",(event.pageX+12)+"px").style("top",(event.pageY-30)+"px");
      })
      .on("mouseout",()=> tooltip.style("opacity",0));

    svg.append("text").attr("x", width/2).attr("y", 28).attr("text-anchor","middle").attr("fill","#00ff88").text("Fines by State (2023–2024)");
  }).catch(err=>{
    console.error("Map load error:", err);
    d3.select("#mapDiv").append("p").text("Error loading map or fines 2023-2024 data.");
  });
}
