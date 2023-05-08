import ViewActionHandler from './ViewActionHandler';
import * as TreeConstant from 'treeOfLife/TreeConstant';
import * as QueryBoxConstant from 'queryBox/QueryBoxConstant';
import * as AppConstant from 'AppConstant';

import {exportToCsv,toNewick,downloadAsFile} from 'util/';
import * as _ from 'lodash';
import * as Config from 'Config';


// New

function dealHighlightedColor(myHighlightedColor){
  var colorChangeText = d3.select('svg').select('g').select('.labels').selectAll('text');
  colorChangeText = colorChangeText[0];

  if(!colorChangeText){
    return
  }

  var myRegMatch = /text-anchor\s*:\s*([a-z]+)/
  if(colorChangeText.length !== 0){
    colorChangeText.map(item => {
      if(item.classList.contains('keggHighlighted')||
          item.classList.contains('pfamHighlighted')||
          item.classList.contains('taxHighlighted')){

        if(item.getAttribute("style")){
          let tempStr = item.getAttribute("style").toString()
          // item.setAttribute("style","fill:" + 'black' +" !important;text-anchor: end;")
          let regResult = tempStr.match(myRegMatch)
          // if there is text anchor
          if(regResult && regResult[1] === 'end'){
            item.setAttribute("style","fill:" + myHighlightedColor +" !important; text-anchor:end")
          }
          // if there is no text anchor or the text-anchor is front, then
          else{
            item.setAttribute("style","fill:" + myHighlightedColor +" !important; text-anchor:front")
          }
        }
        else{
          item.setAttribute("style","fill:" + myHighlightedColor +" !important; text-anchor:front")
        }


      }
      else{
        if(item.getAttribute("style")){
          let tempStr = item.getAttribute("style").toString()
          // item.setAttribute("style","fill:" + 'black' +" !important;text-anchor: end;")
          let regResult = tempStr.match(myRegMatch)
          // if there is text anchor
          if(regResult && regResult[1] === 'end'){
            item.setAttribute("style","fill:" + 'black' +" !important; text-anchor:end")
          }
          // if there is no text anchor or the text-anchor is front, then
          else{
            item.setAttribute("style","fill:" + 'black' +" !important; text-anchor:front")
          }
        }
        else{
          item.setAttribute("style","fill:" + 'black' +" !important; text-anchor:front")
        }

      }
    })
  }
}

export default class TreeActionHandler extends ViewActionHandler{
  constructor(props){
    super(props);
    this.treeStore = this.stores.treeStore;
    this.treeService = this.services.treeService; // get tree service class 
    this.summaryBoxStore = this.stores.summaryBoxStore;
    this.queryBoxStore = this.stores.queryBoxStore;
  }
  downloadSVG(svg){
    // index html has this already
    function setInlineStyles(svg, emptySvgDeclarationComputed) {

      function explicitlySetStyle (element) {
        var cSSStyleDeclarationComputed = getComputedStyle(element);
        var i, len, key, value;
        var computedStyleStr = "";
        for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
          key=cSSStyleDeclarationComputed[i];
          value=cSSStyleDeclarationComputed.getPropertyValue(key);
          if (value!==emptySvgDeclarationComputed.getPropertyValue(key)) {
            computedStyleStr+=key+":"+value+";";
          }
        }
        element.setAttribute('style', computedStyleStr);
      }
      function traverse(obj){
        var tree = [];
        tree.push(obj);
        visit(obj);
        function visit(node) {
          if (node && node.hasChildNodes()) {
            var child = node.firstChild;
            while (child) {
              if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
                tree.push(child);
                visit(child);
              }
              child = child.nextSibling;
            }
          }
        }
        return tree;
      }
      // hardcode computed css styles inside svg
      var allElements = traverse(svg);
      var i = allElements.length;
      while (i--){
        explicitlySetStyle(allElements[i]);
      }
    }
    var emptySvgDeclarationComputed = window.getComputedStyle(document.getElementById('emptysvg'));
    setInlineStyles(svg,emptySvgDeclarationComputed);
    
    var serializer = new XMLSerializer();
    var svgData = serializer.serializeToString(svg);
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "tree.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  retrieveDetailedSearchResults(gtdbIds, sizeLimit){
    var {treeStore, queryBoxStore,treeService} = this;
    if (!treeStore.lastSearchedConfig) return onError('no detail to be displayed');
    var {query, option} = treeStore.lastSearchedConfig;
    var phrases = queryBoxStore.getQueryPhrases(query);
    if (!phrases) return onError('no detail to be displayed');
    var searchOptions;
    try{
     searchOptions = queryBoxStore.getCleanedSearchOptions();
    }catch(exception){
      return onError(exception.error);
    }
    if (option === AppConstant.SEARCH_PFAM){
      return treeService.getPfamScanResults(phrases,gtdbIds,true, sizeLimit, searchOptions);
    }else if(option === AppConstant.SEARCH_KEGG){
      return treeService.getKeggResults(phrases,gtdbIds,true, sizeLimit, searchOptions);
    }else if (option === AppConstant.SEARCH_TIGRFAM){
      return treeService.getTigrfamResults(phrases,gtdbIds,true, sizeLimit, searchOptions);
    }else{
      return onError('invalid search option');
    }
  }

  setDetailedSearchResults(node, containerCoord, sizeLimit){
    sizeLimit = sizeLimit || 0;
    var {treeStore, queryBoxStore,treeService} = this;
    if (!treeStore.lastSearchedConfig) return onError('no detail to be displayed');
    var {query, option} = treeStore.lastSearchedConfig;
    var gtdbIds = treeStore.getHighlightedGTDBIds(node, option);
    if (!gtdbIds || gtdbIds.length === 0) return onError('no detail to be displayed');
    treeStore.nodeDetail.startLoading();
    return this.retrieveDetailedSearchResults(gtdbIds, sizeLimit)
      .then(function(data){
        if(data && data.length > 0) {
          var detailResults = data;
          if(treeStore.nodeDetail) containerCoord = treeStore.nodeDetail.displayAt;
          treeStore.setNodeDetail(node, containerCoord, detailResults);
          return data;
        }else{
          console.log('Error: no detail result to be displayed');
          if(treeStore.nodeDetail) treeStore.nodeDetail.stopLoading();
        }
      })
      .catch(function(err){
        console.log(err);
        if(treeStore.nodeDetail) treeStore.nodeDetail.stopLoading();
      })
  }

  downloadDetailResults(detailResults){
    var name = "annotree_hits";
    var header = [_.sortBy(_.keys(detailResults[0]))];
    // get the values of each object in the list
    var rows = _.map(detailResults,function(r){
      // access corresponding header element
      return _.map(header[0], function(h){
        return r[h];
      });
    });
    rows = header.concat(rows);
    exportToCsv(name, rows);
  }

  handleAction(action){
    var self = this;
    var {treeStore,summaryBoxStore,queryBoxStore,treeService} = self;
    switch(action.type){
      case AppConstant.APP_CLICKED:
        if(treeStore.showColorPicker){
          treeStore.showColorPicker = !treeStore.showColorPicker;
          var event = action.payload;
          event.stopPropagation();
        }
        break;
      case TreeConstant.TREE_BACK_BUTTON_CLICKED:
        treeStore.setLastDisplayable();
        treeStore.nodeDetail = null;
        break;
      case TreeConstant.TREE_RESET_BUTTON_CLICKED:
        treeStore.resetToDefaultDisplayable();
        summaryBoxStore.clear();
        break;
      case TreeConstant.TREE_DOWNLOAD_SVG_CLICKED:
        var svg = action.payload;
        self.downloadSVG(svg);
        break;

      case TreeConstant.TREE_DOWNLOAD_NEWICK_CLICKED:
        var newickFile = toNewick(treeStore.displayRoot);
        downloadAsFile(newickFile,'tree_of_life.newick');
        break;

      case TreeConstant.TREE_TYPE_CHANGED:
        var newTreeType = action.payload;
        treeStore.setTreeType(newTreeType);
        treeStore.resetToDefaultDisplayable();
        treeStore.nodeDetail = null;
        summaryBoxStore.clear();
        break;

      case TreeConstant.TREE_LEVEL_CLICKED:
        var level = action.payload;
        var levelIndex = TreeConstant.AVAILABLE_LEVELS.indexOf(level);
        var currIndex = TreeConstant.AVAILABLE_LEVELS.indexOf(treeStore.currentDisplayLevel);
        treeStore.nodeDetail = null;
        treeStore.forceDisplayLevel(level);

        // New
        dealHighlightedColor(treeStore.highlightColor)
        break;


      case TreeConstant.TREE_RECENTER_LEVEL_CLICKED:
        var recenterDetail = action.payload;
        var levelIndex = TreeConstant.AVAILABLE_LEVELS.indexOf(recenterDetail.level);
        var currIndex = TreeConstant.AVAILABLE_LEVELS.indexOf(treeStore.currentDisplayLevel);
        treeStore.nodeDetail = null;
        treeStore.recenterAtLevel(recenterDetail.node, recenterDetail.level);
        // New
        dealHighlightedColor(treeStore.highlightColor)
        break;

      case TreeConstant.TREE_LABEL_CLICKED:
      case TreeConstant.TREE_INTERNAL_NODE_CLICKED: 
        var {node,containerCoord} = action.payload;
        treeStore.setNodeDetail(node,containerCoord);
        self.setDetailedSearchResults(node, containerCoord, TreeConstant.RESULT_SIZE_LIMIT);
        break;
      case TreeConstant.TREE_NODE_DETAIL_ON_DRAG_START:
        treeStore.dragStartData = action.payload;
        break;
      case TreeConstant.TREE_NODE_DETAIL_ON_DRAG_END:
        treeStore.dragStartData = null;
        break;
      case TreeConstant.TREE_NODE_DETAIL_MOVED:
        if (!treeStore.dragStartData) break;
        var moveX = action.payload[0],  moveY = action.payload[1];
        var clickX = treeStore.dragStartData.clickAt[0], clickY = treeStore.dragStartData.clickAt[1];
        var offsetX = moveX - clickX, offsetY = moveY - clickY;
        var newX = treeStore.dragStartData.displayAt[0] + offsetX, newY = treeStore.dragStartData.displayAt[1] + offsetY;
        treeStore.nodeDetail.displayAt = [newX, newY];
        break;
      case TreeConstant.TREE_POP_UP_CLOSE: 
        treeStore.nodeDetail = null;
        break;

      case TreeConstant.TREE_RECENTER_CLICKED:
        var node = action.payload;
        treeStore.nodeDetail = null;
        treeStore.recenterAt(node);
        break;
      case TreeConstant.TREE_DOWNLOAD_QUERY_RESULTS:
        var self = this;
        if (!treeStore.lastSearchedConfig) break;
        treeStore.startDownloading();
        var option = treeStore.lastSearchedConfig.option;
        var gtdbIds = treeStore.getHighlightedGTDBIds(treeStore.masterTree, option);
        this.retrieveDetailedSearchResults(gtdbIds, 0)
          .then(function(data){
            self.downloadDetailResults(data);
          })
          .catch(function(err){
            console.log(err);
          })
          .then(function(){
            treeStore.stopDownloading();
          });
        break;
      case TreeConstant.TREE_DOWNLOAD_DETAIL_RESULTS:
        var detailResults = action.payload;
        if (detailResults && detailResults.length < TreeConstant.RESULT_SIZE_LIMIT){
          self.downloadDetailResults(detailResults);
          break;
        }
        treeStore.nodeDetail.startLoading();
        self.setDetailedSearchResults(treeStore.nodeDetail.node,
          treeStore.nodeDetail.displayAt)
          .then(function(data){
            self.downloadDetailResults(data);
          })
          .catch(function(err){
            console.log(err);
          })
          .then(function(){
            treeStore.nodeDetail.stopLoading();
          });
        break;
      case TreeConstant.TREE_FONT_SIZE_CHANGED:
        var size = action.payload;
        if (size < 1){
          return; // cannot be smaller than 1
        }
        treeStore.setFontSize(size);
        break;
      case TreeConstant.TREE_HIGHLIGHT_COLOR_CHANGE:
        var color = action.payload;
        // not only change color in store to reflect on color square
        treeStore.highlightColor = color;
        // but also change css styles that govern tree highlights
        var jss = window.jss;
        _.values(AppConstant.HIGHLIGHT_CLASSES)
          .forEach(function(highlightClass){
            jss.set('.'+highlightClass, {
              stroke: color
            });
          });



        // New
        dealHighlightedColor(treeStore.highlightColor)
        break;
      case TreeConstant.TREE_TOGGLE_COLOR_PICKER:
        treeStore.showColorPicker = !treeStore.showColorPicker;
        break;
      case TreeConstant.TREE_GROUP_BAND_LEVEL_CHANGED:
        var newGroupBandLevel = action.payload;
        treeStore.groupBandLevel = newGroupBandLevel;
        var distributionData = {
          queryUsed: summaryBoxStore.queryUsed,
          distributionRank: newGroupBandLevel,
        };
        treeStore.syncBandColors(distributionData);
        treeStore.setCurrentDisplayable();
	// New
        dealHighlightedColor(treeStore.highlightColor)
        break;
      case TreeConstant.TREE_DRAWN_FINISHED:
        treeStore.stopLoading();
        break;
      default:
        break;
    }
    return;
  }
};

function onError(msg){
  return Promise.reject({msg:msg});
}



