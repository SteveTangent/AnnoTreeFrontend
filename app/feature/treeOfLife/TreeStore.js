import * as _ from 'lodash';
const DEFAULT_HIGHLIGHT = 'red';
import { observable, computed, action } from 'mobx';
import * as TreeConstant from './TreeConstant';
import * as AppConstant from 'AppConstant';
import {NodeDetailModel} from './nodeDetail/';
import {Highlighter} from './Highlighter.js';
import {isBandViewAllowed} from './treeUtil';

/* 
  A class holding the representation of tree, 
  this is stateful

  A store should not use any service type class
  its functions and logic should only allow easier
  manipulation of states
*/

export default class TreeStore{
  autoScaleFontSize = true;
  // similar to query box store, this is the config of last successful search
  lastSearchedConfig = null;
  @observable displayHistory = [];
  @observable displayRoot = null;
  @observable displayable = null; // object with 2 fields, `nodes` and `links`, computed from displayRoot
  @observable isLoading = false;
  @observable downloading = false;
  @observable nodeDetail = null; // class NodeDetailModel
  // originally treeType allows toggling between different trees in display
  // code is kept here despite that feature is not used
  @observable treeType = TreeConstant.BACTERIAL_TREE;
  // hold all available trees for display
  @observable trees = {};
  // @observable currentDisplayLevel = TreeConstant.ORDER;

  @observable currentDisplayLevel = TreeConstant.CLASS;
  @observable disabledDisplayLevels = [];
  @observable fontSize = 12;
  @observable groupBandLevel = TreeConstant.PHYLUM;
  /* hits is a dictionary of string to list of node ids
    where string is SEARCH_ prefixed strings in AppConstant
    e.g. {AppConstant.SEARCH_PFAM -> [<node_id> ...]}
  */
  @observable hits = {};
  /* a master tree is any object in `trees`
    a master tree is the source of data and should not be modified
    display tree (displayRoot) is a UI model to track UI changes such
    as highlighting, changing levels of display

    The reason to have this set up is that, if we wish to display more
    than one tree, and be able to select between them, we can modify
    treeType to select which masterTree to use.
    This is useful when we want to add another tree for archaea instead
    of just bacteria.
  */
//  @observable highlightColor = "blue"; // it should be the same as default in css
  @observable highlightColor = "red";
  @observable showColorPicker = false;
  @observable bandColors = {
    queryUsed: null,
    colors: {}
  };

  @computed get masterTree(){
    return this.trees[this.treeType].tree;
  }

  @computed get masterIdNodeMap(){
    return this.trees[this.treeType].nodeMap;
  }

  @computed get highlighter(){
    return new Highlighter(this.hits);
  }

  constructor(options){

  }

  setTrees(trees){
    /*
      @var trees:
        {
          <tree name > => {
            tree: tree object
            nodeMap: tree node map
          }
        }
      @var tree, a given tree json from the backend
      @var nodeMap
      {
        '123'<nodeId:number>: <node obj>
      }
    */
    var self = this;
    this.trees = trees;
    _.forEach(this.trees, function(value){
      value.nodeMap = getIdNodeMap(value.tree);
    });

    // initialize the pruned and unpruned tree by adding computed values to it
    function processTree(tree){
      // infer `counts` for each internal node
      // e.g.
      // A has children B(counts 12) C(counts 10), A.counts is set to 22
      traverseCollect(tree,function(node,childrenResult){
        var selfCount = node.counts? parseInt(node.counts):0;
        var total = selfCount + _.sum(childrenResult);
        node.counts = total;
        return total;
      });
      // adding taxonomy domain type to each node
      // e.g. all internal and leaf nodes under Eukaryote node will have taxDomainType = 'EUKARYOTES'
      // all nodes under bacteria node will have taxDomainType = 'BACTERIA'
      // top nodes above domain level will not have taxDomainType
      function addDomainType (node, taxDomainType){
        if (!node){
          return;
        }
        // if current node is the domain node, assign taxDomainType
        if (!taxDomainType){
          taxDomainType = TreeConstant.DOMAIN_NODES[''+node.id] || null;
          // turning off 5726, the TACK group
          if (taxDomainType && (node.id + '') !== '5893') node.isDomainRoot = true;
        }
        if (taxDomainType) {
          node.taxDomainType = taxDomainType;
        }
        // recursively traverse all children
        if (node.children && node.children.length > 0) {
          node.children.forEach(function(c){
            addDomainType(c, taxDomainType);
          });
        }
      }
      
      addDomainType(tree, null);

      self.cluster = d3.layout.cluster() // cluster layout compute function
        .size([360, TreeConstant.INNER_RADIUS])
        // .children(function(d) { return d.branchset; })
        .children(function(d){return d.children})
        .value(function(d) { return 1; })
        .sort(function(a, b) { return (a.value - b.value) || d3.ascending(a.length, b.length); })
        .separation(function(a, b) { return 1; });
      self.cluster.links(self.cluster.nodes(tree)); // precompute depth in master tree, although it will not be used for display
    }

    // forEach tree, process it
    _.mapValues(this.trees,(treeObj)=>processTree(treeObj.tree));
    this.resetToLevel(this.currentDisplayLevel);
  }

  /*----------  Tree Display Methods  ----------*/
  // user interface level, display a new node and add to history
  // we assume that node is a deep copy of tree (i.e. not result of mutating displayRoot)
  // if want to display mutated tree, use displayCurrent()

  @action resetToDefaultDisplayable(){
    this.hits = {};
    this.fontSize = 12;
    this.nodeDetail = null;
    this.groupBandLevel = TreeConstant.PHYLUM;
    // this.resetToLevel(TreeConstant.ORDER);

    this.resetToLevel(TreeConstant.CLASS);
    // each tree rendering will remember the previous tree state
    // a reset should clean displayHistory
    this.clearDisplayHistory();
  }
  @action resetToLevel(rank){
    this.currentDisplayLevel = rank;
    this.setNextLevelDisplayable();
  }
  @action setLastDisplayable(){
    if (this.displayHistory.length == 0){
      return null;
    }
    this.popDisplayHistory();
    return this._setDisplayable(this.displayRoot);
  }

  // display the same displayRoot as before
  // we need this function because we might change the current tree but 
  // do not necessarily want to add the change to displayHistory
  // the use case will be when collapsing the current tree
  @action setCurrentDisplayable(){
    return this._setDisplayable(this.displayRoot);
  }

  /*
  a datum is a tree node
  display the next level of tree up to a rank (e.g. phylum, class, genus)
  if datum is not given, use master root (equivalent to reset to default view)
  @param forcedRank is one item of TreeConstant.AVAILABLE_LEVELS
  */
  @action setNextLevelDisplayable(datum, forcedRank){
    var self = this;
    var masterNode = datum?this.getMasterNode(datum.id):this.masterTree; // get a copy of this node in master tree
    if (!masterNode.children){
      return null; // do nothing if it is a leaf
    }
    var rank = self.getLowestRank(masterNode);
    var nextRank = forcedRank || getNextRankDown(rank, this.currentDisplayLevel);
    // reset bandLevel to NONE, if bandview is not allowed
    if (!isBandViewAllowed(self.groupBandLevel, nextRank)) self.groupBandLevel = TreeConstant.NONE;
    var newRoot;
    if (nextRank === TreeConstant.HIGHEST_RESOLUTION_LEVEL){
      // all leaves under this node.
      newRoot = filterTree(masterNode, function(){return true;});
    } else if (nextRank === TreeConstant.AVAILABLE_LEVELS[0]){ // root of tree -> take master node
      newRoot = displayUpToRank(this.masterTree, nextRank);
    } else if (TreeConstant.AVAILABLE_LEVELS.indexOf(rank) >= TreeConstant.AVAILABLE_LEVELS.indexOf(nextRank)){
      var upperDisplayRoot;
      var rankAboveNext = TreeConstant.AVAILABLE_LEVELS[TreeConstant.AVAILABLE_LEVELS.indexOf(nextRank)];
      while (!upperDisplayRoot){
        rankAboveNext = TreeConstant.AVAILABLE_LEVELS[TreeConstant.AVAILABLE_LEVELS.indexOf(rankAboveNext)-1];
        upperDisplayRoot = selectAncestorInTree(masterNode, (n) => getRank(n) === rankAboveNext);
      }
      newRoot = displayUpToRank(upperDisplayRoot, nextRank);
    } else{
      newRoot = displayUpToRank(masterNode, nextRank);
    }
    // because we might not get any
    // intermediate level, in that case, use the highest tree resolution
    // possible
    // This should never happen because the Resolution level buttons are disabled
    //  for these ranks (Kerrin: July 17, 2018)
    if (!newRoot.children || newRoot.children.length === 0) {
      newRoot = filterTree(masterNode, function () {
        return true;
      });
      nextRank = TreeConstant.HIGHEST_RESOLUTION_LEVEL;
    }
    this.pushDisplayHistory();
    this.currentDisplayLevel = nextRank;
    this._setDisplayable(newRoot);
    function getNextRankDown(nodeRank, currDisplayLevel){
      if (nodeRank !== currDisplayLevel || currDisplayLevel === TreeConstant.HIGHEST_RESOLUTION_LEVEL){
        return currDisplayLevel;
      }
      var nextRank = TreeConstant.AVAILABLE_LEVELS[TreeConstant.AVAILABLE_LEVELS.indexOf(rank)+1];
      return nextRank;
    }
  }
  /* A displayable object: nodes and links should be generated by d3.cluster layout function
    @return {
      nodes: [node ...],
      links: [link ...],
      bands: [band ...],
      showLabel: bool
    }
  */
  _setDisplayable(node){
    var self = this;
    if (!node){
      throw 'Programming error: node given is null in _setDisplayable';
    }
    var masterNode = this.getMasterNode(node.id);
    if (masterNode === node){
      throw 'Programming error: you should make a deep copy of node from master tree then pass it in';
    }
    self.displayRoot = node;
    if (self.autoScaleFontSize){
      var numLeaves = countChildren(node);
      if (numLeaves < 150){
        self.fontSize = 12;
      }else if (numLeaves < 300){
        self.fontSize = 8;
      }else if (numLeaves < 400){
        self.fontSize = 4;
      }else if (numLeaves < 600){
        self.fontSize = 3;
      }else if (numLeaves < 800){
        self.fontSize = 2;
      }else if (numLeaves < TreeConstant.MAX_LABEL_SHOWN){
        self.fontSize = 1;
      }else {
        self.fontSize = 0;
      }
    }
    if (self.groupBandLevel !== TreeConstant.NONE){
      // only draw label when not drawing bands
      self.fontSize = 0;
    }


    // set text for all leaf nodes in display tree
    getLeaves(self.displayRoot).forEach(function(n){
      n.text = self.getText(n);
    });

    var bands = self.getBands(self.displayRoot);

    setRadius(self.displayRoot, self.displayRoot.length = 0, TreeConstant.INNER_RADIUS / maxLength(self.displayRoot));


    // before drawing a tree, clear all current highlights
    traverseTree(self.displayRoot, function(n){
      Highlighter.clearNodeHighlight(n, AppConstant.SEARCH_ALL);
    });

    self.highlightTree(self.displayRoot);

    var nodes = this.cluster.nodes(self.displayRoot);
    var links = this.cluster.links(nodes);
    // by mutating displayable, MobX framework will call drawTree method
    // from treeDrawer
    // see autorun decorator in TreeOfLife.js
    self.displayable = {
      nodes: nodes,
      links:links,
      bands: bands,
      fontSize: self.fontSize
    };
    this.disabledDisplayLevels = this.getMissingRanks(node);
  }

  @action recenterAt(node){
    this.setNextLevelDisplayable(node);
  }

  @action recenterAtLevel(node, level){
    this.setNextLevelDisplayable(node, level);
  }

  @action forceDisplayLevel(rank){
    // equivalent to recentering at current display root, but with a 
    // different rank
    this.setNextLevelDisplayable(this.displayRoot,rank);
  }
  /*----------  Other related Display Methods  ----------*/
  @action startLoading(){
    this.isLoading = true;
  }
  @action stopLoading(){
    this.isLoading = false;
  }

  @action startDownloading(){
    this.downloading = true;
  }
  @action stopDownloading(){
    this.downloading = false;
  }

  /*
    Given a node and a coordinate at where the detail box should be displayed
    compute and mutate `nodeDetail` in treeStore
  */
  @action setNodeDetail(node, coordinate, detailResults){
    var settings = {
      displayAt: coordinate,
      node: node,
      taxonName: getRankName(node),
      taxonId: node.taxId,
      taxonType: getTaxonType(node),
      rank: getRank(node),
      isLeaf: node.isLeaf,
      taxonomyLevels: this.getTaxonomyLevels(node),
      hasQueryResult: this.highlighter.anyHighlighted(),
      taxonomyHits: this.highlighter.anyHighlighted() && this.getTaxonomyHits(node),
      childrenSummary: this.getChildrenSummary(node),
      numChild: node.num_child,
      numLeafByLevel: this.getNumLeafByLevel(node),
      detailResults: detailResults,
    };
    var newNodeDetail = new NodeDetailModel(settings);
    this.nodeDetail = newNodeDetail;
  }

  @action setTreeType(type){
    this.treeType = type;
  }

  @action setFontSize(size){
    this.fontSize = size;
    this.autoScaleFontSize = false; // do not allow auto scaling font size
    this.setCurrentDisplayable();
    this.autoScaleFontSize = true;
  }

  @action setHits(hits){
    this.hits = hits;
    this.setCurrentDisplayable();
  }

  /*
    distributionData is {
      distributionRank: string
      distribution: optional, see treeStore.getDistribution
      queryUsed: string
    }
    Syncs coloring between group bands and donut chart in summary
    This function should be called whenever group band view has changed
    or summary donut chart has changed. It makes sure that both group bands
    and donut chart uses the same coloring for taxonomic groups
  */
  @action syncBandColors(distributionData){
    var {distributionRank, queryUsed} = distributionData;
    var distribution = distributionData.distribution;
    if (queryUsed !== this.bandColors.queryUsed) this.bandColors.colors = {};
    this.bandColors.queryUsed = queryUsed;
    // coloring for that rank already set
    if (this.bandColors.colors[distributionRank]) return;
    var rankNames;
    if (!distribution) {
      var filterFn = function(n){
        return getRank(n) === distributionRank;
      };
      var nodes = selectManyInTree(this.masterTree, filterFn);
      rankNames = nodes.map(function(x){return getRankName(x);});
    }else{
      rankNames = _.keys(distribution);
    }
    var colorFn = d3.scale.category20();
    // call colorFn on each of distribution's entry
    // colorFn will remember color set for each entry
    rankNames.forEach((d)=>colorFn(d));
    this.bandColors.colors[distributionRank] = colorFn;
    this.setCurrentDisplayable();
  }

  /*----------  Data Getters  ----------*/
  /*
    @param data: [id:<int> ...]
    @param rank: one of 'phylum', 'order' ... 'species'
    @return {
      'proteobacteria': {numGenome: 6128, hitCount: 123} ...
    }
    traverse from the given node upwards until hit a rank node
    if it hits root, consider that as "unclassified"
  */
  getHitDistribution(data, rank) {
    if (!rank){
      throw 'Exception, rank is not given';
    }
    var findRankAncestor = function(node){
      return selectAncestorInTree(node, (n)=>getRank(n) === rank);
    }
    var self = this;

    // e.g. {'proteobacteria': {numGenome: 6128, hitCount: 123} ...}
    var result = {};

    data
      .filter((d)=>self.getMasterNode(d).isLeaf=='1')
      .forEach(function(d){
        var masterNode = self.getMasterNode(d);
        var rankAncestor = findRankAncestor(masterNode);
        var rankNameBackUp = rankAncestor?getRankName(rankAncestor):'unclassified';
        var rankName = getRankNameFromTaxonomy(masterNode, rank) || rankNameBackUp;
        if (!result[rankName]){
          result[rankName] = {
            'numGenome': rankAncestor?(rankAncestor.num_child || ''):'',
            'hitCount': 0
          };
        }
        result[rankName].hitCount += 1
      })

    return result;
  }

  // given a node, collect its leaf nodes' gtdb id
  getHighlightedGTDBIds(node, type){
    var self = this;
    var _isHighlighted = self.highlighter.isNodeHighlighted.bind(self.highlighter);
    var masterNode = self.getMasterNode(node.id+'');
    return reduceTree(masterNode, function(acc, n){
      if (n.isLeaf == '1' && _isHighlighted(n, type)){
        acc.push(n.level);
      }
      return acc;
    }, function(){
      return [];
    });
  }

  getAncestorRanks(node) {
    var ranksInPath = [];
    var n = this.getMasterNode(node.id);
    if (n.parent) {
      n = n.parent;
      while (n) {
        var rank = getRank(n);
        if (rank && ranksInPath.indexOf(rank) === -1) ranksInPath.push(rank);
        n = n.parent;
      }
    }
    return ranksInPath;
  }

  getChildRanks(node) {
    var ranks = [];
    traverseTree(node, function(n){
      var rank = getRank(n);
      if (n.isLeaf) rank = TreeConstant.HIGHEST_RESOLUTION_LEVEL;
      if (ranks.indexOf(rank) < 0){
        ranks.push(rank);
      }
    });
    return ranks;
  }

  // Given a node, return an array of ranks missing from its lineage
  getMissingRanks(node) {
    var ranksInPath = [];
    var masterNode = this.getMasterNode(node.id);
    ranksInPath = ranksInPath.concat(this.getAncestorRanks(masterNode));
    var currentRank = getRank(masterNode);
    if (currentRank) ranksInPath.push(currentRank);
    ranksInPath = ranksInPath.concat(this.getChildRanks(masterNode));

    var missingRanks = [];
    for (var i = 0, len = TreeConstant.AVAILABLE_LEVELS.length; i < len; i++) {
      var currentLevel = TreeConstant.AVAILABLE_LEVELS[i];
      if (ranksInPath.indexOf(currentLevel) === -1) {
        missingRanks.push(currentLevel);
      }
    }

    return missingRanks;
  }


  // returns label text for `node`
  getText(node){
    var nodename = ''
    var self = this;
    if (node.isLeaf){
      // trying using the name corresponding to current display level
      // e.g. if current level is phylum, try using the phylum name
      nodename = getRankNameFromTaxonomy(node, this.currentDisplayLevel) || getRankName(node);
      nodename += '*';
      return nodename;
    } else{
      // it is an internal node
      if (node.level){
        nodename = node.level;
      }else{
        var taxonomyLevels = this.getTaxonomyLevels(node);
        // find the taxonomy level that is just higher than the current level
        var currentLevelIndex = -1;
        for (var i=0;i<taxonomyLevels.length;i++){
          if (taxonomyLevels[i].rank === this.currentDisplayLevel){
            currentLevelIndex = i;
            break;
          }
        }
        if (i <= 0){
          nodename = 'cellular organism';
        }else{
          nodename = taxonomyLevels[i-1].rank_name + '-' + taxonomyLevels[i-1].rank + '**';
        }
      }
    }
    return nodename + ' [' + node.num_child + ']';
  }
  
  /*----------  Other Methods  ----------*/
  clearHistory(){
    this.displayHistory = [];
  }

  /*----------  Private methods  ----------*/

  /*
    given a tree node
    return the taxonomy hit distribution
    return {
      'noHit':number,
      'hit':number,
      'noInfo':number,
    }
  */
  getTaxonomyHits(node){
    var masterNode  = this.getMasterNode(node.id);
    var self = this;
    var hits = reduceTree(masterNode, function(acc,n){
      if(n.children) return acc;
      if(n && self.highlighter.isNodeHighlighted(n.id+'', AppConstant.SEARCH_ALL)){
        acc['hit']++;
      }else{
        acc['noHit']++;
      }
      return acc;
    }, {
      'noHit':0,
      'hit':0,
      'noInfo':0, // should always be 0, not used in GTDB version
    })
    if (hits['noHit'] === 0 && hits['hit'] === 0 && hits['noInfo'] === 0){
      return null; //no interesting distribution
    }
    return hits;
  }
  /*
    given a tree node
    return all possible taxonomy info from domain to species
    e.g. [{rank: 'domain', rank_name: 'bacteria'}, 
      {rank: phylum, ...} ...]
    since some nodes might not have the pre-computed gtdb taxonomy field
    we have to compute it ourselves by looking at tree ancestors
  */
  getTaxonomyLevels(node){
    if (node.gtdbTaxonomy && node.gtdbTaxonomy.length > 0){
      return node.gtdbTaxonomy
    }
    var masterNode = this.getMasterNode(node.id);
    var n = masterNode;
    var taxonomyLevels = [];
    while (n){
      var rank = getRank(n);
      var rankName = getRankName(n);
      if (rank && rankName) taxonomyLevels.push({rank:rank, rank_name:rankName});
      n = n.parent;
    }
    return taxonomyLevels.reverse(); // from highest tax to lowest
  }

  /*
    returns lowest taxonomy that this node belongs to
    if the node is order, then it will return order
    if the node is between order and family, it will return order
  */
  getLowestRank(node){
    var levels = this.getTaxonomyLevels(node);
    if (levels.length === 0){
      return null;
    }
    // return the last one
    return levels.pop().rank;
  }
  /*
    return up to 5 child rank names in this node
    e.g. [Desulfitibacterales, Syntrophomonadales, ...]

    uses Breadth First Search to traverse the tree, stop at any node who has a rank, because
    that node would summarize all its descendant nodes
  */
  getChildrenSummary(node){
    var masterNode = this.getMasterNode(node.id);
    var results = [];
    var q = [];
    if (masterNode.children) masterNode.children.forEach((c)=>q.push(c));
    while (q.length > 0 && results.length < 5){
      var n = q.shift();
      if (getRank(n)){
        results.push(getRankName(n));
        // stop here, don't push the children
        continue;
      }
      if (n.children) n.children.forEach((c)=>q.push(c));
    }
    return results;
  }

  /*
    Given a tree node, 
    returns the number of tips that would be present at each level with the given node at the root.
    Levels with no tips are not included.
    Levels are given in increasing index order.
    e.g. {class:number>0, order:number>0, family:number>0, ...} 
  */
  getNumLeafByLevel(node) {
    var masterNode = this.getMasterNode(node.id);
    var rankCounts = {};
    for (var i = 1; i < TreeConstant.AVAILABLE_LEVELS.length; i++) { // skip highest level
      rankCounts[TreeConstant.AVAILABLE_LEVELS[i]] = 0;
    }
    var newRoot;
    rankCounts[TreeConstant.HIGHEST_RESOLUTION_LEVEL] = masterNode.num_child; // do highest level manually
    for (var i = 1; i < TreeConstant.AVAILABLE_LEVELS.length - 1; i++) {
      newRoot = displayUpToRank(masterNode, TreeConstant.AVAILABLE_LEVELS[i]);
      if (countChildren(newRoot)>1) rankCounts[TreeConstant.AVAILABLE_LEVELS[i]] = rankCounts[TreeConstant.AVAILABLE_LEVELS[i]] + countChildren(newRoot);
    }    
    for (var rank in rankCounts){
      if (!rankCounts[rank]) delete rankCounts[rank];
    }
    return rankCounts;
  }

  /*
    returns [{
      start: tree node of band start,
      end: tree node of band end,
      levelName: the name of the selected level (phylum, order ..) of this band,
      id: ID that identifies this band
    } ...]
  */
  getBands(root){
    var self = this;
    if (self.groupBandLevel === TreeConstant.NONE) return [];
    var leafNodes = getLeaves(root);
    /*
      {nodeId => currently selected level}
    */
    var nodeToLevel = {};
    leafNodes.forEach(function(n){
      var levels = self.getTaxonomyLevels(n);
      var rankObj = _.find(levels, {rank: self.groupBandLevel});
      nodeToLevel[n.id+''] = rankObj?rankObj.rank_name:null;
    });
    var colorFn = self.bandColors.colors[self.groupBandLevel] || d3.scale.category20();

    if (!leafNodes || leafNodes.length <= 1) return [];
    var bands = [];
    var bandStart = leafNodes[0];
    var prev = leafNodes[0];
    for(var _i=1; _i<leafNodes.length+1; ++_i){
      var i = _i%leafNodes.length;
      var curr = leafNodes[i];
      var currLevel = nodeToLevel[curr.id+''];
      var prevLevel = nodeToLevel[prev.id+''];
      if(!currLevel || currLevel !== prevLevel){
        bands.push({
          'start': bandStart,
          'end': prev,
          'id': bandStart.id + ',' + prev.id,
          'levelName': prevLevel,
          'color': colorFn(prevLevel)
        });
        bandStart = curr;
      }

      prev = curr;
    }
    // this is a special case where every node belongs
    // to the same group
    if (bands.length === 0){
      var start = leafNodes[0];
      var end = leafNodes[leafNodes.length-1];
      bands.push({
        'start': start,
        'end': end,
        'id': start.id + ',' + end.id,
        'levelName': prevLevel,
        'color': colorFn(prevLevel)
      });
    }
    // now do some post processing
    var filteredBands = bands.filter(function(b){return b.levelName});
    return filteredBands;
  }

  highlightTree(root){
    var self = this;
    var highlightedNodes = {};
    function markParents(node, types){
      var temp = node;
      while(temp){
        highlightedNodes[temp.id+''] = types;
        temp = temp.parent;
      }
    }
    function markChildren(node, types){
      highlightedNodes[node.id+''] = types;
      if (node.children && node.children.length > 0){
        node.children.forEach(function(c){
          markChildren(c, types);
        });
      }
    }
    // for all nodes in master tree, mark all its ancestors and children
    _.values(self.masterIdNodeMap).forEach(function(node){
      var types = self.highlighter.getHighlightedTypes(node.id+'');
      if (!types || types.length === 0) return;
      markParents(node, types);
      markChildren(node, types);
    });

    function applyHighlightFn(node){
      if (!highlightedNodes[node.id+'']) return;
      var types = highlightedNodes[node.id+''];
      Highlighter.markNodeHighlight(node, types);
      if (node.children && node.children.length > 0){
        node.children.forEach(applyHighlightFn);
      }
    }
    applyHighlightFn(root);
  }

  // get a node by id in the master tree
  // you should NOT mutate any master node
  getMasterNode(id){
    if (this.masterIdNodeMap && this.masterTree){
      return this.masterIdNodeMap[id+''];
    }
  }

  pushDisplayHistory(){
    this.displayHistory.push({
      displayRoot: this.displayRoot,
      hits: this.hits,
      currentDisplayLevel: this.currentDisplayLevel,
      lastSearchedConfig: this.lastSearchedConfig
    });
  }

  popDisplayHistory(){
    var displayHistory = this.displayHistory.pop();
    this.displayRoot = displayHistory.displayRoot;
    this.hits = displayHistory.hits;
    this.currentDisplayLevel = displayHistory.currentDisplayLevel;
    this.lastSearchedConfig = displayHistory.lastSearchedConfig;
  }

  clearDisplayHistory(){
    this.displayHistory = [];
  }
}

/*===============================================
=            Tree Manipulation Logic            =
===============================================*/
/*
  Tree algorithms and functions
*/

/*
  For each node d in tree, call callback on d
*/
export function traverseTree(d,callback) {
  if(callback){
    var earlyStop = !!callback(d);
    if(earlyStop){
      return;
    }
  }
  if (d.children) d.children.forEach(function(c){
    traverseTree(c,callback);
  });
}


/*

Given a tree like this:
     A
    / \
   B   C
  /
 D

The result is Col(A, [
  Col(B, [Col(D)]), Col(C,[])
  ])


*/
export function traverseCollect(d,collector){
  var collectResult = [];
  if(d.children){
    collectResult = d.children.map(function(c){
      return traverseCollect(c,collector);
    })
  }
  return collector(d,collectResult);
}
// traverse the entire tree from node onwards
// call reducer on each node, giving also the accumulator
// return the result of accumulator
export function reduceTree(node,reducer,initializer){
  var accumulator = initializer;
  if (typeof initializer === 'function'){
    accumulator = initializer(node);
  }
  traverseTree(node,function(n){
    accumulator = reducer(accumulator,n);
  });
  return accumulator;
}

export function getIdNodeMap(root){
  var m = {};
  function _addToMap(node){
    m[node.id+''] = node;
    if(node.children) node.children.forEach(_addToMap);
  }
  _addToMap(root);
  return m;
}

export function selectOneInTree(root,selector){
  if (selector(root) ){
    return root;
  }
  if(!root.children || root.children.length === 0){
    return null;
  }
  for(var i=0;i < root.children.length;i++){
    var result = selectOneInTree(root.children[i],selector);
    if (result != null){
      return result;
    }
  }
  return null;
}

/*
  return an array of nodes for which `selector` returns tree
*/
export function selectManyInTree(root, selector){
  var results = [];
  if (selector(root)){
    results.push(root);
  }
  if (!root.children || root.children.length === 0){
    return results;
  }
  // recursefor each child in node
  return results.concat(_.flatMap(root.children, function(child){
    return selectManyInTree(child, selector);
  }));
}

// find the first ancestor that matches selector
export function selectAncestorInTree(node, selector){
  if (!node){
    return node;
  }
  if (selector(node)){
    return node;
  }
  return selectAncestorInTree(node.parent,selector);
}

// get ancestors of node
export function getAncestors(node){
  var ancestors = [];
  while (node.parent){
    ancestors.push(node.parent);
    node = node.parent;
  }
  return ancestors;
}
export function getChildren(node){
  if (node.children && node.children.length > 0){
    return _.concat(_.toArray(node.children),_.flatMap(node.children,getChildren));
  }
  return [];
}
export function countChildren(node){
  if (node == null) return 0;
  if (!node.children || node.children.length === 0) return 1;
  return _.sum(_.map(node.children, countChildren));
}
export function getLeaves(node){
  if (node === null) return [];
  if (!node.children || node.children.length === 0){
    return [node];
  }
  return _.flatMap(node.children,getLeaves);
}

// get all leaves of the given node list
export function getLeavesForNodes(nodes) {
  if (!nodes){
    throw 'invalid node list given';
  }
  var leaves = _.flatMap(nodes, function(n){
    return getLeaves(n);
  });
  return leaves;
}

export function resetColor(node){
  return traverseTree(node,function(d){
    d['color'] = null;
  });
}
// shallow copy
export function copyNode(node){
  var copy = {};
  _.extend(copy,node);
  return copy;
}
export function filterTree(root,filterFn){
  if (!filterFn(root)){
    return null;
  }
  function _filterTree(node,ff){
    var copy = copyNode(node);
    if(node.children){
      copy.children = node.children.filter(ff).map(function(d){
        return _filterTree(d,ff);
      });
    }
    return copy;
  }
  return _filterTree(root,filterFn);
}


// find all paths from root to the first nodes down the tree hierachy
// selected by `selector`
export function findPathsTo(root,selector){
  function _findPathTo(n,backtrack){
    if (selector(n)){
      // return a list with one item, which is the path
      return [backtrack.concat([n])];
    }else if(!n.children){
      return [];
    }else{
      // recursively apply _findPathTo on each child
      // collect the paths that they find
      return _.flatMap(n.children.map(function(child){
        return _findPathTo(child,backtrack.concat([n]));
      }));
    }
  }
  return _findPathTo(root,[]);
}

export function getRank(node){
  return node.rank;
}

/**
 * This gets the default rank name corresponded by this node
 * if you want a rank at a specific level, use getRankNameFromTaxonomy
 */
export function getRankName(node){
  return node.level || node.name;
}

export function getRankNameFromTaxonomy(node, rank){
  if (!node.gtdbTaxonomy){
    return
  }
  var taxonomyLevel = node.gtdbTaxonomy.filter((x)=>x.rank === rank);
  if (taxonomyLevel.length > 0 && taxonomyLevel[0].rank_name){
    return taxonomyLevel[0].rank_name;
  }
  return '';
}


export function getTaxonType(node){
  // we don't display anything
  return '';
}

export function displayUpToRank(root, rank){
  var rankSelector = function(node){
    return node.rank === rank;
  };
  // flatten the list of paths to fisrt level
  // create a set indexed by node id
  var paths = findPathsTo(root,rankSelector);
  var nodesOnPath = _.keyBy(_.flatten(paths),function(n){return n.id;}); // turn all nodes on the path to a set
  function collectNode(node){
    // assume node itself must be contained
    var copy = copyNode(node);
    if (!node.children){
      return copy;
    }
    var childrenOnPath = _.filter(copy.children,function(n){return !!nodesOnPath[n.id]});
    var childrenNotOnPath = _.filter(copy.children,function(n){return !nodesOnPath[n.id]});
    if(childrenOnPath.length == 0){
      copy.children = [];
      return copy;
    }
    // the new children is the result of collectNode for any child on path
    // and all the children not on path, excluding their grandchildren
    var newChildren = childrenOnPath
    .map(collectNode)
    .concat(childrenNotOnPath.map(function(c){
      var copy = copyNode(c);
      copy.children = [];
      return copy;
    }));
    copy.children = newChildren;
    return copy;
  }
  return collectNode(root);
}

/*=====  End of Tree Manipulation Logic  ======*/


/*==================================================
=            Graph Specific            =
==================================================*/
// Compute the maximum cumulative length of any node in the tree.
export function maxLength(d) {
  d.length = parseFloat(d.length); // convert to float first
  return d.length + (d.children && d.children.length > 0 ? d3.max(d.children, maxLength) : 0);
}

// Set the radius of each node by recursively summing and scaling the distance from the root.
export function setRadius(d, y0, k) {
  d.radius = (y0 += d.length) * k;// how far should this node be located from the center
  if (d.children) d.children.forEach(function(d) { setRadius(d, y0, k); });
}

/*=====  End of Graph Specific   ======*/



