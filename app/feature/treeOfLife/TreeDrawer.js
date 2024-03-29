
/*

  Tree drawing logic, mainly manipulating UI
*/
'use strict';
import {step,project,lineTo} from './treeUtil/graphCalculation' // for graph calculation functions
import {moveToFront} from '../../util/';
import './treeStyle.less';
import * as TreeConstant from './TreeConstant';
import * as AppConstant from 'AppConstant.js';

import AppDispatcher from 'dispatcher/AppDispatcher';

const ANIMATION_TIME = 350;
const COLLAPSE_ROOT_COLOR = 'red';

class TreeDrawer{
  constructor(props) {
    this.domNode = props.domNode;
    this.outerRadius = props.outerRadius;
    this.innerRadius = props.innerRadius;
    // key function is used to maintain 'object constancy' in d3
    // google to find more
    this.keyFn = props.keyFn || function(d){
      return d.id;
    }
    // constructing all the elements
    if (!d3.select(this.domNode).select('svg').empty()){
      this.svg = d3.select(this.domNode).select('svg');
      this.chart = this.svg.select('g');
    } else {
      this.svg = d3.select(this.domNode).append('svg')
          .attr('width', this.outerRadius * 2)
          .attr('height', this.outerRadius * 2);
      this.chart = this.svg.append('g')
      .attr('transform', 'translate(' + this.outerRadius + ',' + this.outerRadius + ')');
      this.chart.append('g')
            .attr('class', 'link-extensions');
      this.chart.append('g')
            .attr('class', 'links');
      this.chart.append('g')
            .attr('class', 'labels');
      this.chart.append('g')
            .attr('class', 'internalNodes');
      this.chart.append('g')
            .attr('class', 'groupBands');
    }
    this.boundEvents = [{
      target: 'label',
      type: 'mouseover.togglePath',
      callback: mouseovered(true)
    },{
      target: 'label',
      type: 'mouseout.togglePath',
      callback: mouseovered(false)
    },{
      target: 'nodeInternal',
      type: 'mouseover.showChildren',
      callback: function(d){
        function toggleActiveClass(d){
          d3.select(d.linkNode).classed('link--active',true);
          if (d.linkExtensionNode){
            d3.select(d.linkExtensionNode).classed('link-extension--active',true);
          }
          if (d.children && d.children.length > 0){
            d.children.forEach(toggleActiveClass);
          }
        }
        if (d.children && d.children.length > 0){
          d.children.forEach(toggleActiveClass);
        }
        d3.selectAll('.nodeInternal')
          .filter(function(d1){return d1===d})
          .transition()
          .duration(15)
          .attr('r','4');
      }
    },{
      target: 'nodeInternal',
      type: 'mouseout.hideChildren',
      callback: function(d){
        function toggleActiveClass(d){
          d3.select(d.linkNode).classed('link--active',false);
          if (d.linkExtensionNode){
            d3.select(d.linkExtensionNode).classed('link-extension--active',false);
          }
          if (d.children && d.children.length > 0){
            d.children.forEach(toggleActiveClass);
          }
        }
        if (d.children && d.children.length > 0){
          d.children.forEach(toggleActiveClass);
        }
        d3.selectAll('.nodeInternal')
          .filter(function(d1){return d1===d})
          .transition()
          .duration(15)
          .attr('r','2');
      }
    }];
  }

  /*
    accepts an object like 
    {
      nodes: [node, ...]
      links: [link, ...]
      bands: [band, ...]
      fontSize: int
    }
    nodes and links generated by d3.cluster layout function
    bands are generated by TreeStore getBands() function
  */
  drawTree({nodes,links, bands, fontSize}){
    var boundEvents = this.boundEvents;
    if (this.timeout){
      clearTimeout(this.timeout);
    }
    var leafNodes = nodes.filter(function(d) { return !d.children; });
    this.numLeafNode = leafNodes.length;
    // clear all events
    boundEvents.forEach(function(e){
      d3.selectAll(getSelector(e.target)).on(e.type,null);
    });
    var internalNodes = nodes.filter(function(d){return !!d.children});
    this.drawInternalNodes(internalNodes);
    this.drawLinkExtensions(links);
    this.drawLinks(links);
    this.drawLabels(leafNodes, fontSize);
    this.drawGroupBands(bands,nodes);
    // re-attach events after animation finished
    this.timeout = setTimeout((function(){
      boundEvents.forEach(function(e){
        var selector = getSelector(e.target);
        d3.selectAll(selector).on(e.type,function (datum){
          e.callback.call(this,datum);
        });
      });
      this.timeout = null;
    }).bind(this), ANIMATION_TIME+100);
  }

  drawInternalNodes(internalNodes){
    var keyFn = this.keyFn;
    var nodeRadius = 2;
    var internalData = 
      this.chart
        .select('g.internalNodes')
        .selectAll('circle.nodeInternal')
        .data(internalNodes,keyFn)
        ;

    // New
    if (internalNodes.length <= 300){
      nodeRadius = 1.5;
    }
    else if (internalNodes.length > 300 && internalNodes.length <= 600){
      nodeRadius = 1.5;
    }else if (internalNodes.length > 600 && internalNodes.length <= 900){
      nodeRadius = 1;
    }else if (internalNodes.length > 900 && internalNodes.lenght <= 2000){
      nodeRadius = 0.8;
    }else{
      nodeRadius = 0.5;
    }

    internalData
      .exit()
      .remove()
      ;
    // we ran into a bug when recentering node, currently the logic is to
    // remove all node and append again, so we don't support collapsing animation

    internalData
      .attr('transform',function(d){
        var coord = project(d.x,d.radius);
        return 'translate('+ coord[0]+','+coord[1]+')';
      })
      .attr('r',nodeRadius)
      ;

    internalData
      .enter()
      .append('circle')
      .classed('nodeInternal',true)
      .classed('root-of-domain', function(d){return d.isDomainRoot;})
      .attr('color',function(d){return d.color})
      .attr('transform',function(d){
        var coord = project(d.x,d.radius);
        return 'translate('+ coord[0]+','+coord[1]+')';
      })
      .attr('r',nodeRadius)
      ;
  }

  drawLinkExtensions(links){
    var keyFn = this.keyFn;
    var self = this;
    this.chart.select('g.link-extensions')
      .selectAll('path')
        .remove();
    var linkTips = links.filter(function(d) { return !d.target.children; });
    var linkExtensionData = this.chart.select('g.link-extensions')
      .selectAll('path')
        .data(linkTips,function(d){
          return keyFn(d.target);});


    linkExtensionData
      .each(function(d) {d.target.linkExtensionNode = this; });
    addLinkHighlightClass(linkExtensionData);
    var newLinkExtensions = linkExtensionData
      .enter().append('path')
      .each(function(d) { d.target.linkExtensionNode = this; })
      .attr('d', lineToInnerCircle);
    addLinkHighlightClass(newLinkExtensions);

    function lineToInnerCircle(d) { 
      return step(d.target.x, d.target.radius, d.target.x, self.innerRadius);
    }
  }

  drawLinks(links){
    var keyFn = this.keyFn;
    var linkData = this.chart.select('g.links')
      .selectAll('path')
        .data(links,function(d){
          return keyFn(d.target);
        });

    addLinkHighlightClass(linkData);
    linkData
      .exit()
      .remove();
    var newLinks = linkData
      .enter().append('path');
    addLinkHighlightClass(newLinks);
    if (linkData.length < 1200){
      linkData
        .each(function(d) { d.target.linkNode = this; })
        .transition()
        .duration(ANIMATION_TIME)
        .attr('d',computePathStep)
        ;
      newLinks.each(function(d) { d.target.linkNode = this; })
        .attr('d',function(d) { return lineTo({x:0,y:0},{x:1,y:1}) })
        .transition()
        .duration(ANIMATION_TIME)
        .attr('d', computePathStep)
        ;
    }else {
      linkData
        .each(function(d) { d.target.linkNode = this; })
        .attr('d',computePathStep)
        ;
      newLinks.each(function(d) { d.target.linkNode = this; })
        .attr('d', computePathStep)
        ;
    }


    function computePathStep(d){
      return step(d.source.x, d.source.radius, d.target.x, d.target.radius);
    }

    function lineToCollapseTarget(d){
      var collapseTarget = d.target.collapseTo;
      var currCoord = {x: d.target.x, y:d.target.radius};
      var targetCoord = {x:collapseTarget.x, y: collapseTarget.radius};
      return lineTo(currCoord,targetCoord);
    }

    function degeneratelineToCollapseTarget(d){
      var collapseTarget = d.target.collapseTo;
      var coord = {x:collapseTarget.x, y: collapseTarget.radius};
      return lineTo(coord,coord);
    }
  }

  drawLabels(leafNodes, fontSize){
    var keyFn = this.keyFn;
    var innerRadius = this.innerRadius + 4;
    var length = leafNodes.length;
    if (fontSize === 0){
      this.chart.select('g.labels').selectAll('text').remove();
      return;
    }
    var labelData = this.chart.select('g.labels')
      .selectAll('text')
        .data(leafNodes,keyFn);


    // New
    this.chart.selectAll('g.labels').style("cursor","pointer");

    labelData.exit()
      .remove();

    addLabelHighlightClass(labelData)
      .transition()
      .duration(ANIMATION_TIME)
      .attr('color',function(d){return d.color;})
      .attr('transform', function(d) { return 'rotate(' + (d.x - 90) + ')translate(' + (innerRadius + 4) + ',0)' + (d.x < 180 ? '' : 'rotate(180)'); })
      .style('text-anchor', function(d) { return d.x < 180 ? 'start' : 'end'; })
      .text(getText)
      .attr('font-size',function(d){
        return fontSize;
      })
      ;

    labelData
      .filter(function(d) {
        return d.collapseTo;
      })
      .transition()
      .duration(ANIMATION_TIME)
      .attr('transform',function(d){
        var rootCoord = project(d.collapseTo.x,d.collapseTo.y);
        return 'translate(' + rootCoord[0]+','+rootCoord[1]+')';
      })
      .remove();

    addLabelHighlightClass(labelData
        .enter().append('text')
      )
      .attr('dy', '.31em')
      .attr('transform', function(d) { return 'rotate(' + (d.x - 90) + ')' + (d.x < 180 ? '' : 'rotate(180)'); })
//      .classed('internal-node-label',function(d){
//        return !d.isLeaf=='1';
//      })
      .transition(ANIMATION_TIME)
      .attr('transform', function(d) { return 'rotate(' + (d.x - 90) + ')translate(' + (innerRadius + 4) + ',0)' + (d.x < 180 ? '' : 'rotate(180)'); })
      .style('text-anchor', function(d) { return d.x < 180 ? 'start' : 'end'; })
      .text(getText)
      .attr('font-size',function(d){
        return fontSize;
      })
      ;
    function getText(d) {
      return d.text;
    }
  }

  /*
    draw colored group bands
    see TreeStore.js getBands() for description on bands data
  */
  drawGroupBands(bands,nodes){
    var self = this;
    var keyFn = this.keyFn;
    var innerRadius = this.innerRadius;

    if (!bands || bands.length === 0){
      this.chart.select('g.groupBands').selectAll('text').remove();
      this.chart.select('g.groupBands').selectAll('path').remove();
      return;
    }

    var bandData = this.chart.select('g.groupBands')
      .selectAll('path')
        .data(bands, function(d){return d.id});

    bandData.exit()
      .remove();
    bandData
      .enter()
      .append('path')
      .attr('d', self.getBandPathDefinition.bind(self))
      .attr('fill', function(d){return d.color})
      ;
    bandData
      .transition()
      .duration(ANIMATION_TIME)
      .attr('d', self.getBandPathDefinition.bind(self))
      .attr('fill', function(d){return d.color})
      ;
    var bandTextData = this.chart.select('g.groupBands')
      .selectAll('text').data(bands, function(d){return d.id});
    bandTextData.exit()
      .remove();
    bandTextData
      .enter()
      .append('text')
      .attr('transform', self.getBandTextTransform.bind(self))
      .attr('style', function(d){
        var deg = d.start.x+ ((d.end.x - d.start.x) / 2.0) - 90;
        return 'text-anchor:' + (deg > 90 && deg <= 270?'end':'begin');
      })
      .text(function(d){return d.levelName})
      ;
    bandTextData
      .attr('transform', self.getBandTextTransform.bind(self))
      .attr('style', function(d){
        var deg = d.start.x+ ((d.end.x - d.start.x) / 2.0) - 90;
        return 'text-anchor:' + (deg > 90 && deg <= 270?'end':'begin');
      })
      .text(function(d){return d.levelName})
      ;

     // new
    self.chart.selectAll('g.groupBands').style("cursor","pointer");

    bandData
        .on("mouseover.showNodeBand", function(d){
          var curNode = nodes.filter(function (e) {return e.level === d.levelName})[0]

          self.chart.select('g.groupBands').selectAll('text').filter(function(td,i){
            return td.levelName === d.levelName
          }).style("font-size", "15px")
            .style("font-weight","bold");



          if(!curNode){
            let curId = d.id.split(',')
            if(curId[0] === curId[1]){
              curNode = nodes.filter(function (e) {return e.id === parseInt(curId[0])})[0]
            }
          }

          if(!curNode){
            return
          }
          function toggleActiveClassToRoot(c){
            d3.select(this).classed('label--active', true);
            d3.select(c.linkExtensionNode).classed('link-extension--active', true);
            do d3.select(c.linkNode).classed('link--active', true); while (c = c.parent);
          }


          toggleActiveClassToRoot(curNode)

          function toggleActiveClass(c){
            d3.select(c.linkNode).classed('link--active',true);
            if (c.linkExtensionNode){
              d3.select(c.linkExtensionNode).classed('link-extension--active',true);
            }
            if (c.children && c.children.length > 0){
              c.children.forEach(toggleActiveClass);
            }
          }

          if (curNode.children && curNode.children.length > 0){
            curNode.children.forEach(toggleActiveClass);
          }

          d3.selectAll('.nodeInternal')
              .filter(function(d1){return d1===d})
              .transition()
              .duration(15)
              .attr('r','4');
        })
        .on("click.nodeDetailBand",function(d){
          var curNode = nodes.filter(function (e) {return e.level === d.levelName})[0]


          if(!curNode){
            let curId = d.id.split(',')
            if(curId[0] === curId[1]){
              curNode = nodes.filter(function (e) {return e.id === parseInt(curId[0])})[0]
            }
          }

          if(!curNode){
            return
          }

          var containerCoord = d3.mouse(self.chart[0][0]);
          containerCoord[0] += 540
          containerCoord[1] += 540

          AppDispatcher.handleViewAction({
            type: TreeConstant.TREE_INTERNAL_NODE_CLICKED,
            payload: {
              node: curNode,
              containerCoord: containerCoord,
            }
          })
        });


    bandData
        .on("mouseout.hideNodeBand", function(d){

          var curNode = nodes.filter(function (e) {return e.level === d.levelName})[0]


          self.chart.select('g.groupBands').selectAll('text').filter(function(td,i){
            return td.levelName === d.levelName
          }).style("font-size", "10px")
              .style("font-weight","normal");


          if(!curNode){
            let curId = d.id.split(',')
            if(curId[0] === curId[1]){
              curNode = nodes.filter(function (e) {return e.id === parseInt(curId[0])})[0]
            }
          }

          if(!curNode){
            return
          }

          function toggleActiveClassToRoot(c){
            d3.select(this).classed('label--active', false);
            d3.select(c.linkExtensionNode).classed('link-extension--active', false);
            do d3.select(c.linkNode).classed('link--active', false); while (c = c.parent);
          }


          toggleActiveClassToRoot(curNode)

          function toggleActiveClass(c){
            d3.select(c.linkNode).classed('link--active',false);
            if (c.linkExtensionNode){
              d3.select(c.linkExtensionNode).classed('link-extension--active',false);
            }
            if (c.children && c.children.length > 0){
              c.children.forEach(toggleActiveClass);
            }
          }

          if (curNode.children && curNode.children.length > 0){
            curNode.children.forEach(toggleActiveClass);
          }

          d3.selectAll('.nodeInternal')
              .filter(function(d1){return d1===d})
              .transition()
              .duration(15)
              .attr('r','1');
        });


    bandTextData
        .on("mouseover.showNodeBandText", function(d){
          var curNode = nodes.filter(function (e) {return e.level === d.levelName})[0]

          d3.select(this)
              .style("font-size", "15px")
              .style("font-weight","bold");

           if(!curNode){
            let curId = d.id.split(',')
            if(curId[0] === curId[1]){
              curNode = nodes.filter(function (e) {return e.id === parseInt(curId[0])})[0]
            }
          }


          if(!curNode){
            console.log("Current Node can not be found")
            return
          }


          function toggleActiveClassToRoot(c){
            d3.select(this).classed('label--active', true);
            d3.select(c.linkExtensionNode).classed('link-extension--active', true);
            do d3.select(c.linkNode).classed('link--active', true); while (c = c.parent);
          }


          toggleActiveClassToRoot(curNode)

          function toggleActiveClass(c){
            d3.select(c.linkNode).classed('link--active',true);
            if (c.linkExtensionNode){
              d3.select(c.linkExtensionNode).classed('link-extension--active',true);
            }
            if (c.children && c.children.length > 0){
              c.children.forEach(toggleActiveClass);
            }
          }

          if (curNode.children && curNode.children.length > 0){
            curNode.children.forEach(toggleActiveClass);
          }

          d3.selectAll('.nodeInternal')
              .filter(function(d1){return d1===d})
              .transition()
              .duration(15)
              .attr('r','4');
        })
        .on("click.nodeDetailBandText",function(d){
          var curNode = nodes.filter(function (e) {return e.level === d.levelName})[0]
          
	  if(!curNode){
            let curId = d.id.split(',')
            if(curId[0] === curId[1]){
              curNode = nodes.filter(function (e) {return e.id === parseInt(curId[0])})[0]
            }
          }

	  if(!curNode){
            return
          }
          // see https://github.com/d3/d3-3.x-api-reference/blob/master/Selections.md#d3_mouse
          var containerCoord = d3.mouse(self.chart[0][0]);
          containerCoord[0] += 540
          containerCoord[1] += 540

          AppDispatcher.handleViewAction({
            type: TreeConstant.TREE_INTERNAL_NODE_CLICKED,
            payload: {
              node: curNode,
              containerCoord: containerCoord,
            }
          })
        });


    bandTextData
        .on("mouseout.hideNodeBandText", function(d){
          var curNode = nodes.filter(function (e) {return e.level === d.levelName})[0]

          d3.select(this)
              .style("font-size", "10px")
              .style("font-weight","normal");

          if(!curNode){
            let curId = d.id.split(',')
            if(curId[0] === curId[1]){
              curNode = nodes.filter(function (e) {return e.id === parseInt(curId[0])})[0]
            }
          }

          if(!curNode){
            return
          }

          function toggleActiveClassToRoot(c){
            d3.select(this).classed('label--active', false);
            d3.select(c.linkExtensionNode).classed('link-extension--active', false);
            do d3.select(c.linkNode).classed('link--active', false); while (c = c.parent);
          }

          toggleActiveClassToRoot(curNode)

          function toggleActiveClass(c){
            d3.select(c.linkNode).classed('link--active',false);
            if (c.linkExtensionNode){
              d3.select(c.linkExtensionNode).classed('link-extension--active',false);
            }
            if (c.children && c.children.length > 0){
              c.children.forEach(toggleActiveClass);
            }
          }

          if (curNode.children && curNode.children.length > 0){
            curNode.children.forEach(toggleActiveClass);
          }

          d3.selectAll('.nodeInternal')
              .filter(function(d1){return d1===d})
              .transition()
              .duration(15)
              .attr('r','1');
        });




  }
  /*
    Draws a donut slice
  */
  getBandPathDefinition(band){
    // For reference to arc path, see
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#Path_commands
    var outerRadius = this.innerRadius ;
    var innerRadius = this.innerRadius - 30;
    // gap in degrees between neighboring leaf nodes
    var gap = this.numLeafNode>0?(360.0 / this.numLeafNode):360.0;
    var halfGap = gap / 2.0;
    var b1 = band.start.x - halfGap;
    var b2 = band.end.x + halfGap;
    var arcDegree = b2 - b1;
    // fix a bug where full circle cannot be displayed
    if (Math.abs(arcDegree - 360) < 0.001){
      arcDegree = 359.99;
      b2 -= 0.01;
    }
    var inner1 = project(b1, innerRadius).join(',')+'';
    var inner2 = project(b2, innerRadius).join(',')+'';
    var outer1 = project(b1, outerRadius).join(',')+'';
    var outer2 = project(b2, outerRadius).join(',')+'';
    var result = 'M ' + inner1 // start at inner1
        + ' L ' + outer1 +
        // inner arc
        ' A ' + outerRadius + ' ' + outerRadius + ' '+
        arcDegree + ' ' +
        (arcDegree >= 180?'1 ':'0 ') + // large arc if spans more than 180 degrees
        '1 ' + // always clockwise
        outer2 +
        ' L ' + inner2 + // line to inner 2
        // begin arc from inner2 to inner1
        ' A ' + innerRadius + ' ' + innerRadius + ' ' +
        arcDegree + ' ' +
        (arcDegree >= 180?'1 ':'0 ') +
        '0 ' + //inner arc is always counterclockwise
        inner1
        ;
    return result;
  }

  // returns a transform string from a band object
  getBandTextTransform(d){
    // center text to the middle
    // -90 because all labels are rotated 90 counterclockwise
    // deg is between [-90, 270]
    var deg = d.start.x+ ((d.end.x - d.start.x) / 2.0) - 90;
    var textRadius = this.innerRadius + 8;
    return 'rotate('+deg+')translate('+ textRadius +')'+
        (deg > 90 && deg <= 270?'rotate(180)':'')
        ;
  }
  // TODO
  // drawLinksProportionalToLength(){
  //   d3.transition().duration(ANIMATION_TIME).each(function() {
  //     linkExtension.transition().attr('d', function(d) { return step(d.target.x, checked ? d.target.radius : d.target.y, d.target.x, innerRadius); });
  //     link.transition().attr('d', function(d) { return step(d.source.x, checked ? d.source.radius : d.source.y, d.target.x, checked ? d.target.radius : d.target.y) });
  //   });
  // }
  bindEvent(event){
    this.boundEvents.push(event);
  }
  unbindEvent(event){
    for(var i=0;i<this.boundEvents.length;i++){
      if(this.boundEvents[i].target === event.target && this.boundEvents[i].type === event.type){
        this.boundEvents.splice(i,1);
      }
    }
    d3.selectAll(getSelector(where)).off(eventType);
  }
}



function getSelector(where){
  switch(where){
    case 'nodeInternal':
      return '.nodeInternal';
    case 'linkExtension':
      return 'g.link-extensions path';
    case 'link':
      return 'g.links path';
    case 'label':
      return 'g.labels text';
    default:
      throw where+' is not a valid event selector';
  }
}


function addLinkHighlightClass(elements){
  _.forEach(AppConstant.HIGHLIGHT_CLASSES, function(cls, type){
    elements.classed(cls,function(d){
      return d.target.highlights && !!d.target.highlights[type];
    });
  });
  return elements;
}

function addLabelHighlightClass(elements){
  _.forEach(AppConstant.HIGHLIGHT_CLASSES, function(cls, type){
    elements.classed(cls,function(d){
      return d.highlights && !!d.highlights[type];
    });
  });
  return elements;
}

/*======================================
=            Tree UI Events            =
======================================*/
// if mouseOverTrigger = 1, then the mouse is over the label, font size will not
// be changed until mouseOverTrigger  = 0
var mouseOverTrigger = 0

// initialized font size
var oldFontSize = 12
var fontSizeDivider = 15

function mouseovered(active) {
  return function(d) {
    d3.select(this).classed('label--active', active);

    let boldFontSize = parseInt(d3.select(this).attr("font-size"))

    if(mouseOverTrigger === 0 && active === true){

      let curFontSize = 0
      if(boldFontSize <= fontSizeDivider){
        curFontSize = boldFontSize + 5
      }
      else{
        curFontSize = boldFontSize + 2
      }

      d3.select(this).attr("font-size",curFontSize+"px")
      mouseOverTrigger = 1
      oldFontSize = boldFontSize
    }
    else if(mouseOverTrigger === 1 && active === true){
      // nothing to do
    }
    else if(active === false){
      mouseOverTrigger = 0
      d3.select(this).attr("font-size",oldFontSize + "px")
    }

    d3.select(d.linkExtensionNode).classed('link-extension--active', active);
    do d3.select(d.linkNode).classed('link--active', active); while (d = d.parent);
  };
}



/*=====  End of Tree UI Events  ======*/


export default TreeDrawer;

