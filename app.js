// US State Flags Clustering Visualization
fetch('state_flags_data.json')
  .then(res => res.json())
  .then(data => {
    plot3D(data);
    listClusters(data);
  });

let plotState = null;
let plotData = null;
let plotTraces = null;
let plotLayout = null;
let plotStateIndexMap = null;

function plot3D(data) {
  const states = data.states;
  const centroids = data.centroids;

  // Points by cluster, colored by their own RGB
  let traces = [];
  plotStateIndexMap = {};
  let stateIdx = 0;
  for (let c = 0; c < 4; c++) {
    const clusterStates = states.filter(s => s.cluster === c);
    // Map state name to trace/point index for click selection
    clusterStates.forEach((s, i) => {
      plotStateIndexMap[s.state] = { trace: traces.length, point: i };
    });
    traces.push({
      x: clusterStates.map(s => s.rgb[0]),
      y: clusterStates.map(s => s.rgb[1]),
      z: clusterStates.map(s => s.rgb[2]),
      text: clusterStates.map(s => `${s.state}<br>R: ${s.rgb[0].toFixed(3)} G: ${s.rgb[1].toFixed(3)} B: ${s.rgb[2].toFixed(3)}`),
      hovertemplate: '%{text}',
      mode: 'markers',
      type: 'scatter3d',
      marker: {
        size: 9,
        color: clusterStates.map(s => `rgb(${Math.round(s.rgb[0]*255)},${Math.round(s.rgb[1]*255)},${Math.round(s.rgb[2]*255)})`),
        line: { width: 1, color: '#222' }
      },
      name: `Cluster ${c+1}`
    });
    // Lines from each point to centroid
    traces.push({
      x: clusterStates.flatMap(s => [s.rgb[0], centroids[c][0], null]),
      y: clusterStates.flatMap(s => [s.rgb[1], centroids[c][1], null]),
      z: clusterStates.flatMap(s => [s.rgb[2], centroids[c][2], null]),
      mode: 'lines',
      type: 'scatter3d',
      line: { color: `rgb(${Math.round(centroids[c][0]*255)},${Math.round(centroids[c][1]*255)},${Math.round(centroids[c][2]*255)})`, width: 2 },
      showlegend: false,
      hoverinfo: 'none'
    });
  }
  // Centroids, colored by their own RGB
  traces.push({
    x: centroids.map(c => c[0]),
    y: centroids.map(c => c[1]),
    z: centroids.map(c => c[2]),
    text: centroids.map((c, i) => `Centroid ${i+1}<br>R: ${c[0].toFixed(3)} G: ${c[1].toFixed(3)} B: ${c[2].toFixed(3)}`),
    hovertemplate: '%{text}',
    mode: 'markers',
    type: 'scatter3d',
    marker: {
      size: 20,
      color: centroids.map(c => `rgb(${Math.round(c[0]*255)},${Math.round(c[1]*255)},${Math.round(c[2]*255)})`),
      symbol: 'diamond',
      line: { width: 3, color: '#222' }
    },
    name: 'Centroids'
  });
  plotTraces = traces;
  plotLayout = {
    margin: { l: 0, r: 0, b: 0, t: 0 },
    scene: {
      xaxis: { title: 'Red', range: [0,1] },
      yaxis: { title: 'Green', range: [0,1] },
      zaxis: { title: 'Blue', range: [0,1] }
    },
    legend: { x: 0, y: 1 }
  };
  Plotly.newPlot('plot3d', traces, plotLayout);
  plotData = data;
}

function listClusters(data) {
  const clustersDiv = document.getElementById('clusters');
  clustersDiv.innerHTML = '';
  for (let c = 0; c < 4; c++) {
    const group = document.createElement('div');
    group.className = 'cluster-group';
    group.innerHTML = `<h2>Cluster ${c+1}</h2>`;
    const states = data.states.filter(s => s.cluster === c)
      .sort((a, b) => a.state.localeCompare(b.state));
    for (const s of states) {
      const item = document.createElement('div');
      item.className = 'state-item';
      item.innerHTML = `<img src="${s.flag_file}" alt="${s.state} flag"> <span>${s.state}</span>`;
      item.style.cursor = 'pointer';
      item.onclick = () => highlightStateOnPlot(s.state);
      group.appendChild(item);
    }
    clustersDiv.appendChild(group);
  }
}

function highlightStateOnPlot(stateName) {
  if (!plotStateIndexMap || !plotTraces) return;
  // Deep copy traces for update
  let traces = JSON.parse(JSON.stringify(plotTraces));
  // Find the trace and point index
  const info = plotStateIndexMap[stateName];
  if (!info) return;
  // Highlight the selected point by increasing its size and adding a border
  let marker = traces[info.trace].marker;
  if (Array.isArray(marker.size)) {
    marker.size = marker.size.map((sz, i) => i === info.point ? 18 : 9);
  } else {
    marker.size = marker.size ? Array(traces[info.trace].x.length).fill(9) : [];
    marker.size[info.point] = 18;
  }
  if (Array.isArray(marker.line)) {
    marker.line = marker.line.map((ln, i) => i === info.point ? { width: 4, color: '#000' } : { width: 1, color: '#222' });
  } else {
    marker.line = marker.line ? Array(traces[info.trace].x.length).fill({ width: 1, color: '#222' }) : [];
    marker.line[info.point] = { width: 4, color: '#000' };
  }
  // Update the plot
  Plotly.react('plot3d', traces, plotLayout);
  // Optionally, scroll to the plot
  document.getElementById('plot3d').scrollIntoView({ behavior: 'smooth', block: 'center' });
}
