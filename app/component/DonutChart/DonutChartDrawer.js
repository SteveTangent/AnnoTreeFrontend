import * as _ from 'lodash';

const POLY_LINE_RADIUS_PROPORTION = 0.6;
const TEXT_RADIUS_PROPORTION = 0.7;
export default class DonutChartDrawer{
  constructor(props){
    var {domNode,width,height} = props;
    if (!width || !domNode || !height){
      throw 'UNDEFINED PROPERTIES';
    }
    var pieChartProportion = 0.9;
    var legendProportion = 1 - pieChartProportion;
    var radius = Math.min(width*pieChartProportion, height) / 2;
    // assign those properties to `this`
    this.domNode = domNode;
    this.width = width;
    this.height = height;
    this.radius = radius; 

    this.pieChartCenter = [width * pieChartProportion/2 + 10, height/2];
    this.lengendContainerCenter = [width * (pieChartProportion + legendProportion * 0.3), height/2];
    this.svg = d3.select(domNode)
      .append('svg')
      .attr('width',width)
      .attr('height',height)
      .style('overflow','visible')
      .append('g')
      ;

    this.svg.append("g")
      .attr("class", "slices")
      .attr('transform','translate(' + this.pieChartCenter[0] + ',' + this.pieChartCenter[1] + ')');
    this.svg.append("g")
      .attr("class", "labelName")
      .attr('transform','translate(' + this.pieChartCenter[0] + ',' + this.pieChartCenter[1] + ')');
    this.svg.append("g")
      .attr("class", "labelValue")
      .attr('transform','translate(' + this.pieChartCenter[0] + ',' + this.pieChartCenter[1] + ')');
    this.svg.append("g")
      .attr("class", "lines")
      .attr('transform','translate(' + this.pieChartCenter[0] + ',' + this.pieChartCenter[1] + ')');
    this.svg.append("g")
    .attr("class", "centerText")
    .attr('transform','translate(' + this.pieChartCenter[0] + ',' + this.pieChartCenter[1] + ')');

    this.legendContainer = d3.select(domNode)
        .append('div')
        .classed('legendContainer', true);
    this.pie = d3.layout.pie()
      .sort(null)
      .value(function(d) {
        return d.value;
      });

    this.arc = d3.svg.arc()
      .outerRadius(radius * 0.6)
      .innerRadius(radius * 0.3);

    this.outerArc = d3.svg.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius * 0.5);

    this.legendRectSize = Math.max((radius * 0.05), 14);
    this.legendSpacing = Math.max(radius * 0.02, 4);

  }
  /*
    @param data [{label: <string>, value: <int>}]
  */
  draw(data, sliceColorFn) {
    var {svg,pie,arc,outerArc,
      colorRange,legendRectSize, 
      legendSpacing, radius} = this;

    var color = sliceColorFn;
    // d3 color function adds argument to its internal `domain`
    // each time it's called, we want to make sure that
    // all data labels are added to that internal `domain` variable
    data.forEach((d)=>color(d.label));
    /* ------- PIE SLICES -------*/
    var totalVal = _.sumBy(data,'value');

    var slice = svg
        .select(".slices")
        .selectAll("path.slice")
        .data(pie(data), function(d){ return d.data.label });

      slice.enter()
          .insert("path")
          .style("fill", function(d) { return color(d.data.label); })
          .attr("class", "slice");

      slice
          .transition().duration(1000)
          .attrTween("d", function(d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  return arc(interpolate(t));
              };
          })

      slice.exit()
          .remove();

      var legend = this.drawLegend(this.legendContainer, color, data);
      svg.selectAll('.centerText > text').remove()
      var centerText = svg
        .select('.centerText');
      var centerTextMain = centerText
        .append('text')
        .attr('text-anchor','middle')
        .attr('class','centerText-main')
        .text(totalVal);

      centerText
        .append('text')
        .attr('text-anchor','middle')
        .attr('class','centerText-sub')
        .text('genome hits')
        .attr('transform','translate(0,14)');

      slice
          .on("mouseover", function(d){
              d3.select(this).classed('highlighted', true);
              legend.filter(function(l){
                return l === d.data.label;
              }).classed('highlighted',true);
              var t = d3.select('.lines')
                .selectAll('polyline')
                .filter(function(d1){
                  return d.data === d1.data;
                })
                t.style('display','initial');
              var t2 =d3.select('.labelName')
                .selectAll('text')
                .filter(function(d1){
                  return d.data === d1.data;
                })
                t2.style('display','initial');
              centerTextMain.text(d.data.value);
          });
      slice
          .on("mouseout", function(d){
              d3.select(this).classed('highlighted', false);
              legend.filter(function(l){
                return l === d.data.label;
              }).classed('highlighted',false);
              d3.select('.lines')
                .selectAll('polyline')
                .filter(function(d1){
                  return d.data === d1.data;
                })
                .style('display', 'none')
                ;
              d3.select('.labelName')
                .selectAll('text')
                .filter(function(d1){
                  return d.data === d1.data;
                })
                .style('display', 'none')
                ;
              centerTextMain.text(totalVal);
          });
      /* ------- TEXT LABELS -------*/

      var text = svg.select(".labelName").selectAll("text")
          .data(pie(data), function(d){ return d.data.label });

      text.enter()
          .append("text")
          .attr("dy", ".35em")
          .text(function(d) {
              return (d.data.label+": "+d.value+"%");
          });

      function midAngle(d){
          return d.startAngle + (d.endAngle - d.startAngle)/2;
      }

      text
          .style('display', 'none')
          .transition().duration(500)
          .attrTween("transform", function(d) {
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  var d2 = interpolate(t);
                  var pos = outerArc.centroid(d2);
                  pos[0] = radius * TEXT_RADIUS_PROPORTION * (midAngle(d2) < Math.PI ? 1 : -1);
                  return "translate("+ pos +")";
              };
          })
          .styleTween("text-anchor", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  var d2 = interpolate(t);
                  return midAngle(d2) < Math.PI ? "start":"end";
              };
          })
          .text(function(d) {
              return (d.data.label);
          })
          


      text.exit()
          .remove();

      /* ------- SLICE TO TEXT POLYLINES -------*/

      var polyline = svg.select(".lines").selectAll("polyline")
          .data(pie(data), function(d){ return d.data.label });

      polyline.enter()
          .append("polyline");

      polyline
          .style('display', 'none')
          .transition()
          .duration(500)
          .attrTween("points", function(d){
              this._current = this._current || d;
              var interpolate = d3.interpolate(this._current, d);
              this._current = interpolate(0);
              return function(t) {
                  var d2 = interpolate(t);
                  var pos = outerArc.centroid(d2);
                  pos[0] = radius * POLY_LINE_RADIUS_PROPORTION * (midAngle(d2) < Math.PI ? 1 : -1);
                  return [arc.centroid(d2), outerArc.centroid(d2), pos];
              };
          })
          

      polyline.exit()
          .remove();
  };

  drawLegend(legendContainer, color, data){
    legendContainer
      .selectAll('.legend')
      .remove();
    var legendData = legendContainer
      .selectAll('.legend')
      .data(_.sortBy(data, 'label'))
      // data is [{label: 'Firmicutes', value: 123} ...] sorted by label
      ;

    var totalVal = _.sumBy(data, 'value');
    legendData.exit().remove();
    var legend = legendData
        .enter()
        .append('span')
        .classed('legend', true);

    legend.text(function(d) {
          return d.label + 
            ' [' + d.value + ', ' +
              parseFloat(d.value*100.0/totalVal).toFixed(2)
              + '%]' ;
        });
    legend.append('span')
      .classed('color-tag', true)
      .style('background-color', function(d){return color(d.label)})

    return legend;

  }
};