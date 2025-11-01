// attach UI behaviour: call the appropriate renderer
document.getElementById("btnFines").addEventListener("click", ()=>{
  setActive("btnFines"); renderFinesChart();
});
document.getElementById("btnTrend").addEventListener("click", ()=>{
  setActive("btnTrend"); renderTrendChart();
});
document.getElementById("btnMap").addEventListener("click", ()=>{
  setActive("btnMap"); renderMapChart();
});
document.getElementById("btnDrug").addEventListener("click", ()=>{
  setActive("btnDrug"); renderDrugChart();
});

function setActive(id){
  document.querySelectorAll(".nav-button").forEach(b=>b.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// initial
renderFinesChart();
