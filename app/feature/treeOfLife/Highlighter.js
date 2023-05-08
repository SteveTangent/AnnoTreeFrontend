import * as TreeConstant from './TreeConstant.js';
import * as _ from 'lodash';
import * as AppConstant from 'AppConstant';

/*
  Responsible for majority of highlighting function in the tree
  It manages highlight state of tree node
  
  Han 2018 July:
  The current implementation tracks each type of highlight separately,
  so a node can be pfam and taxonomy highlighted at the same time,
  it is possible to overlay different types of highlight to the tree,
  though right now there is only one color.
*/
class Highlighter{
  constructor(hits){
    var self = this;
    self.highlightedInfo = {};
    if (!hits) return;
    _.forEach(hits, function(hitInfo, type){
      if (!AppConstant.HIGHLIGHT_CLASSES[type]){
        throw 'programming error, search type does not have corresponding highlight class';
      }
      var map = {};
      hitInfo.forEach(function(h){
        map[h+''] = true;
      });
      self.highlightedInfo[type] = map;
    });
  }

  // checks if there are highlighted nodes at all
  anyHighlighted(){
    var result = false;
    return _.values(this.highlightedInfo).filter((x)=>_.keys(x).length>0).length > 0;
  }

  // get highlight types that this node needs to have
  getHighlightedTypes(nodeId){
    var result = [];
    for (var key in this.highlightedInfo){
      if (this.highlightedInfo[key][nodeId+'']){
        result.push(key);
      }
    }
    return result;
  }

  isNodeHighlighted(nodeId, type){
    if (typeof(nodeId) === 'object') nodeId = nodeId.id;
    nodeId = nodeId + '';
    if (type === AppConstant.SEARCH_ALL){
      for (var t in this.highlightedInfo){
        if(this.highlightedInfo[t][nodeId]) return true;
      }
      return false;
    }
    return this.highlightedInfo[type][nodeId];
  }

  static clearNodeHighlight(node, type){
    if (type === AppConstant.SEARCH_ALL && node.highlights){
      node.highlights = null;
    }else if (node.highlights){
      node.highlights[type] = false;
    }
  }
  static markNodeHighlight(node, type){
    if (type === AppConstant.SEARCH_ALL){
      throw 'cannot mark highlight type all';
    }
    if (node && type && !node.highlights){
      node.highlights = {};
    }
    if (typeof(type) === 'string'){
      node.highlights[type] = true;
    }
    _.forEach(type, function(t){
      node.highlights[t] = true;
    });
  }
  getState(){
    return this.highlightedInfo;
  }
  setState(highlighterState){
    this.highlightedInfo = highlighterState;
  }
};

export {Highlighter};

