import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
// import GeoJSON from 'ol/format/GeoJSON';
import TopoJSON from 'ol/format/TopoJSON';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import Overlay from 'ol/Overlay';
import VectorSource from 'ol/source/Vector';
import {defaults as defaultControls, ZoomToExtent} from 'ol/control';
import {Fill, Stroke, Style, Text} from 'ol/style';
const https = require('https');
// var d3 = require("d3");
var colorSequence = d3.scaleSequential()
            .interpolator(d3.interpolateReds);

// 7582123.989659,  10842024.260498, 731252.369785, 4255931.279733
var covid_details = null;
var total_cases = null;
var cured = null;
var death = null;
var createTextStyle = (feature) => {
  return new Text({
    text: feature.get('ST_NM'),
    color: "#000"
  });
};
// variable for mover interaction ferature
var selected = null;

var tooltipDiv = d3.select('body').append('div')
.attr('class', 'tooltip')
.style('display', 'none');

// filte function for available data
var filteredData = (name)=> covid_details.records.filter(d => d.name_of_state_ut == name);
// return color based on value
var createColor = (feature) => {
  if (covid_details == null){
    return  'rgba(255, 255, 255, 0.6)'
  }else{
    let data = filteredData( feature.get('ST_NM'));
    // covid_details.records.filter(d => d.name_of_state_ut == feature.get('ST_NM'));
    if (data.length){
      return colorSequence(parseInt(data[0].total_confirmed_cases));

    }
    return  'rgba(255, 255, 255, 0.6)';
  }
};

// Default style
var indiaStyle = (feature, resolution)=>{
  return new Style({
    fill: new Fill({
      color: createColor(feature),
    }),
    // createFillColor(feature),
    stroke: new Stroke({
      color: '#DCDCDC',
      width: 1
    }),
    text: createTextStyle(feature)
    // new Text({
    //   font: '12px Calibri,sans-serif',
    //   fill: new Fill({
    //     color: '#000'
    //   }),
    //   stroke: new Stroke({
    //     color: '#fff',
    //     width: 3
    //   })
    // })
  });
};

// hight light for chart on hover
var indiaHighlightStyle = (feature)=>{
  return new Style({
    fill: new Fill({
      color: createColor(feature),
    }),
    // createFillColor(feature),
    stroke: new Stroke({
      color: 'Tomato',
      width: 3
    }),
    text: createTextStyle(feature)
  });
};

// refresh topojson
function updateMapColor(feature){
  // vector.getSource().forEachFeature((feature)=>{
  //   console.log(feature);
  // });
  vector.getSource().refresh();
  d3.select('.pageloader').classed("is-active", false);
  // style.getText().setText(feature.get('ST_NM'));
  // return style;
}

// table structure for state hover or click event
var constructTable = function(data){
  let header = "<table class='table is-narrow is-bordered''> \
  <thead> \
    <tr> \
    <th>Field</th> \
    <th>Value</th> \
    </tr> \
  </thead>";
  let body = 
    ` <tbody><tr> \
    <td>Id</td> \
    <td>${data.s_no}</td> \
    </tr> \
    <tr> \
    <td>Name</td> \
    <td>${data.name_of_state_ut}</td> \
    </tr> \
    <tr> \
    <td>Total Confirm Cases</td> \
    <td>${data.total_confirmed_cases}</td> \
    </tr> \
    <tr> \
    <td>Cured\/Discharged\/Migrated</td> \
    <td>${data.cured_discharged_migrated}</td> \
    </tr> \
    <tr> \
    <td>Death</td> \
    <td>${data.death}</td> \
    </tr> \
    <tr> \
    <td>Last Update</td> \
    <td>${data.date_time}</td> \
    </tr> </tbody></table>`;
let mobile_body = 
    `<tbody><tr> \
    <td>Id</td> \
    <td>${data.s_no}</td> \
    </tr> \
    <tr> \
    <td>Name</td> \
    <td>${data.name_of_state_ut}</td> \
    </tr> \
    <tr> \
    <td>TotalCases</td> \
    <td>${data.total_confirmed_cases}</td> \
    </tr> \
    <tr> \
    <td>Cured</td> \
    <td>${data.cured_discharged_migrated}</td> \
    </tr> \
    <tr> \
    <td>Death</td> \
    <td>${data.death}</td> \
    </tr> \
    <tr> \
    <td>LastUpdate</td> \
    <td>${data.date_time.split(' ')[0] + '<br/>' + data.date_time.split(' ')[1]}</td> \
    </tr> </tbody></table>`;
return header+mobile_body;
};

// get request from data.gov,in
https.get('https://api.data.gov.in/resource/cd08e47b-bd70-4efb-8ebc-589344934531?format=json&limit=all&api-key=579b464db66ec23bdd000001cdc3b564546246a772a26393094f5645',(res) => {
  console.log('statusCode:', res.statusCode);
  console.log('headers:', res.headers);
  var body = '';
  res.on('data', (chunk) =>{
    body += chunk;
  });
  res.on('end', function() {
    console.log(body);
    covid_details = JSON.parse(body);
    let initial_val = 0;
    // sum for main display
    total_cases = covid_details.records.reduce((total, curr) =>{
      total += parseInt(curr.total_confirmed_cases);
      return total;
    }, initial_val);
    d3.select('#confirmCases').html(total_cases);
    cured = covid_details.records.reduce((total, curr) =>{
      total += parseInt(curr.cured_discharged_migrated);
      return total;
    }, initial_val);
    d3.select('#curedCases').html(cured);
    death = covid_details.records.reduce((total, curr) =>{
      total += parseInt(curr.death);
      return total;
    }, initial_val);
    d3.select('#deathCases').html(death);
    // min max for color creation
    let min = d3.min(covid_details.records, d => parseInt(d.total_confirmed_cases));
    let max = d3.max(covid_details.records, d => parseInt(d.total_confirmed_cases));
    colorSequence.domain([min, (max+200)]);
    //  update style for map
    vector.style = updateMapColor();

    var sorted_data = covid_details.records.sort((a, b) => parseInt(a.s_no) < parseInt(b.s_no) ? 1: -1);
    covid_details.records = sorted_data.reverse();
    // top for bar chart most cases
    var top5Cases = covid_details.records.sort((a, b) => parseInt(a.total_confirmed_cases) < parseInt(b.total_confirmed_cases) ? 1: -1)
                        .slice(0,5);
    // console.log(top5Cases);
    highestcaseChart(top5Cases);
    // pie chart data update
    pieChart(covid_details.records);
    createDatatable(covid_details);
  });
}).on('error', (e) =>{
  console.error(e);
});


// chart events
function mouseover(){
  tooltipDiv.style('display', 'inline');
}

function mousemove(){
  var d = d3.select(this).data()[0]
  tooltipDiv
      .html(d.name_of_state_ut + '<br/>' + d.total_confirmed_cases)
      .style('left', (d3.event.pageX -10) + 'px')
      .style('top', (d3.event.pageY - 12) + 'px');
  
  setTimeout(()=>{
    mouseout();
  },5000);
}

function mouseout(){
tooltipDiv.style('display', 'none');
}


// changes of position for overlay popup
var getOverlayOffsets = function (mapInstance, overlay) {
  const overlayRect = overlay.getElement().getBoundingClientRect();
  const mapRect = mapInstance.getTargetElement().getBoundingClientRect();
  const margin = 15;
  // if (!ol.extent.containsExtent(mapRect, overlayRect)) //could use, but need to convert rect to extent
  const offsetLeft = overlayRect.left - mapRect.left;
  const offsetRight = mapRect.right - overlayRect.right;
  const offsetTop = overlayRect.top - mapRect.top;
  const offsetBottom = mapRect.bottom - overlayRect.bottom;
  console.log('offsets', offsetLeft, offsetRight, offsetTop, offsetBottom );

  const delta = [0, 0];
  if (offsetLeft < 0) {
    // move overlay to the right
    delta[0] = margin - offsetLeft;
  } else if (offsetRight < 0) {
    // move overlay  to the left
    delta[0] = -(Math.abs(offsetRight) + margin);
  }
  if (offsetTop < 0) {
    // will change the positioning instead of the offset to move overlay down.
    delta[1] = margin - offsetTop; 
  } else if (offsetBottom < 0) {
    // move overlay up - never happens if bottome-center is default.
    delta[1] = -(Math.abs(offsetBottom) + margin);
  }
  return(delta);
};

// create bar chart
function highestcaseChart(data){
  let element = document.getElementById("mostCasesBarChart");
  d3.select("#mostCasesBarChart svg").remove();
  let width = +element.clientWidth;
  element.style.height = (width/2) + 'px';
  // element.clientHeight = +element.clientHeight+50
  let height = +element.clientHeight;
  // set the dimensions and margins of the graph
  var margin = { left: 40, top: 0, right: 10, bottom: 50 };
  width = width - margin.left - margin.right,
  height = height - margin.top - margin.bottom;

  // append the svg object to the body of the page
  var svg = d3.select("#mostCasesBarChart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

  // X axis
  var x = d3.scaleBand()
  .range([ 0, width ])
  .domain(data.map(function(d) { return d.name_of_state_ut; }))
  .padding(0.2);
  svg.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x))
  .selectAll("text")
  .attr("class", "axis")
  .attr("transform", "translate(-10,0)rotate(-35)")
  .style("text-anchor", "end");

  // Add Y axis
  var y = d3.scaleLinear()
  .domain([0, d3.max(data, (d)=> parseInt(d.total_confirmed_cases)+100)])
  .range([ height, 0]);
  svg.append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y).ticks(5));

  // Bars
  svg.selectAll("bar")
  .data(data)
  .enter()
  .append("rect")
  .attr("x", function(d) { return x(d.name_of_state_ut); })
  .attr("width", x.bandwidth())
  .attr("fill", (d)=> {
          return colorSequence(d.total_confirmed_cases)})
  // no bar at the beginning thus:
  .attr("height", function(d) { return height - y(0); }) // always equal to 0
  .attr("y", function(d) { return y(0); })
  .on('mouseover', mouseover)
  .on('click', mousemove);

  // Animation
  svg.selectAll("rect")
  .transition()
  .duration(1000)
  .attr("y", function(d) { return y(d.total_confirmed_cases); })
  .attr("height", function(d) { return height - y(d.total_confirmed_cases); })
  .delay(function(d,i){console.log(i) ; return(i*200)})

  // text label for the y axis
  svg.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x",0 - (height / 2))
  .attr("dy", ".8em")
  .style("text-anchor", "middle")
  .style("font-size", '11px')
  .text("No of cases");

  svg.append('text')
  .attr('transform', `translate(${width-margin.left}, ${height+50})`)
  .style("text-anchor", "middle")
  .style("font-size", '11px')
        .text("States");
 }

// create pie charts
function pieChart(rawData){
  // var margin = { left: 40, top: 0, right: 10, bottom: 50 };
  let element = document.getElementById("pieChart");
  d3.select("#pieChart svg").remove();
  let width = +element.clientWidth -50 ;
  let height = +element.clientWidth -50;
  let r = 100;
  rawData.forEach((d)=>{
    d.death = +d.death;
  })
  let data = rawData.filter((d)=> d.death != 0);
  data.sort((a, b) => parseInt(a.death) < parseInt(b.death) ? 1: -1);
  let color = d3.scaleOrdinal()
    .domain(data.map(d => d.death))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

  let arc = d3.arc()
    .innerRadius(0)
    .outerRadius(Math.min(width, height) / 2 - 1);
    
  const radius = Math.min(width, height) / 2 * 0.8;
  let arcLabel =d3.arc().innerRadius(radius).outerRadius(radius);

  let pie = d3.pie()
    .sort(null)
    .value(d => d.death)
  const arcs = pie(data);

  const svg = d3.select("#pieChart")
        .append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height]);


  svg.append("g")
        .attr("stroke", "white")
      .selectAll("path")
      .data(arcs)
      .join("path")
        .attr("fill", d => color(d.data.name_of_state_ut))
        .attr("d", arc)
        .on("click", function (d) {
          d3.select(".tooltip")
              .style("left", d3.event.pageX + "px")
              .style("top", d3.event.pageY + "px")
              .style('font-size', '12px')
              .text(`${d.data.name_of_state_ut}: ${d.data.death}`);
          setTimeout(()=>{
                mouseout();
              },3000);
      })
      .on('mouseover', mouseover);
      // .on('mouseover', mouseover);

        svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
      .selectAll("text")
      .data(arcs)
      .join("text")
        .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
        .call(text => text.append("tspan")
            .attr("y", "-0.4em")
            .attr("font-weight", "bold")
            .text(d => d.data.death));
}

// create data table for Map
function createDatatable(data){
  var th_rows = '';
  var td_rows = '';
  d3.select("#tableViewTitle").html(data.title)
  data.field.forEach((field) =>{
    th_rows+=`<th>${field.name}</th>`;
  });
  d3.select('#tableView thead tr').html(th_rows);
  data.records.forEach((d) =>{
    td_rows += `<tr>
      <td>${d.s_no}</td>
      <td>${d.name_of_state_ut}</td>
      <td>${d.total_confirmed_cases}</td>
      <td>${d.cured_discharged_migrated}</td>
      <td>${d.death}</td>
      <td>${d.date}</td>
      <td>${d.date_time}</td>
    </tr>`
  });
  d3.select('#tableView tbody').html(td_rows);
}

// vector layer creation
var vector = new VectorLayer({
  source: new VectorSource({
    url: './data/top.json',
    format: new TopoJSON({
      featureProjection: 'EPSG:3857'
    }),
    overlaps: false
  }),
  style: indiaStyle
  //  function(feature) {
  //   style.getText().setText(feature.get('ST_NM'));
  //   return style;
  // }
});

// map data
var map = new Map({
  layers: [vector],
  target: 'map',
  view: new View({
    center: [8649002.624524, 2377497.327782],
  }),
});
map.getView().fit([7083572.2852,670199.8640, 10842024.260498, 4255931.279733], { constrainResolution: true });

// pointer move click for state value display
map.on(['pointermove', 'singleclick'], function(e) {
  if (selected !== null) {
    selected.setStyle(undefined);
    selected = null;

  }

  map.forEachFeatureAtPixel(e.pixel, function(f) {
    popup.getElement().innerHTML = '';
    selected = f;
    f.setStyle(indiaHighlightStyle);
    let data = filteredData( selected.get('ST_NM'));
    popup.getElement().innerHTML = constructTable(data[0]);
    popup.setPosition(e.coordinate);
   
    popup.setPositioning('bottom-left');
    if(window.screen.width <=520){
      popup.setPositioning('center-center');
    }
    return selected;
  });
  // var element = popup.getElement();
  const delta = getOverlayOffsets(map, popup);
  // popup.setPosition(e.coordinate);
  if(delta[0] < 0) {
    popup.setPositioning('top-right');
    if(window.screen.width <=520){
      popup.setPositioning('top-right');
    }
  }
  else if(delta[0] == 0 && delta[1]>0) {
    popup.setPositioning('top-left');
    if(window.screen.width <=520){
      popup.setPositioning('center-left');
    }
  }
  // else if(delta[1] ==0 && delta[0]==0){
  //   popup.setPositioning('top-left');
  // }
  // popup.setOffset(delta);

  popup.getElement().style.display = selected ? '' : 'none';
  document.body.style.cursor = selected ? 'pointer' : '';
});

// Popup showing the position the user clicked
var popup = new Overlay({
  element: document.getElementById('popup'),
  positioning: 'bottom-left'
});
map.addOverlay(popup);


window.addEventListener("resize", function(event) {
  map.getView().fit([7083572.2852,670199.8640, 10842024.260498, 4255931.279733], { constrainResolution: true });
  var top5Cases = covid_details.records.sort((a, b) => parseInt(a.total_confirmed_cases) < parseInt(b.total_confirmed_cases) ? 1: -1)
  .slice(0,5);
  // console.log(top5Cases);
  highestcaseChart(top5Cases);
  // pie chart data update
  pieChart(covid_details.records);
})