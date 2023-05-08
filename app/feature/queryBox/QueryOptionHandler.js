import * as _ from 'lodash';
import * as QueryBoxConstant from 'queryBox/QueryBoxConstant';
import * as TreeConstant from 'treeOfLife/TreeConstant';
import * as AppConstant from 'AppConstant';


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
                    //console.log("no style", regResult)
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

class QueryOptionHandler{
  constructor(props){
    this.queryBoxStore = props.stores.queryBoxStore;
    this.treeStore = props.stores.treeStore;
    this.summaryBoxStore = props.stores.summaryBoxStore;
    this.queryService = props.services.queryService;
  }

  _updateSuggestion(phraseToSearch){
    throw 'umimplemented';
  }
  updateSuggestion = _.debounce(this._updateSuggestion, 200);

  handleQuery(){
    var {treeStore, summaryBoxStore, queryBoxStore} = this;
    treeStore.startLoading();
    summaryBoxStore.clear();
    var lastSearchedConfig = queryBoxStore.setLastSearchedConfig();
    treeStore.lastSearchedConfig = lastSearchedConfig;
    treeStore.setHits({}); // clear hits
    return this._submitQuery()
      .catch(function(err){
        console.log('query encountered error', err);
        var msg = (err && err.error) || 'internal server error';
        queryBoxStore.warning = {
          message: msg,
        };
        // clear lastSearchedConfig since query is unsuccessful
        treeStore.lastSearchedConfig = null;
        queryBoxStore.clearLastSearchedConfig();
      })
      .then(function(){
        treeStore.stopLoading();
         //New
        dealHighlightedColor(treeStore.highlightColor)
      });
  }
};

class TaxonomyQueryOptionHandler extends QueryOptionHandler{
  constructor(props){
    super(props);
  }
  _updateSuggestion(phraseToSearch){
    var self = this;
    if (phraseToSearch === ''){
      return;
    }
    this.queryService.autocompleteTaxonomy(phraseToSearch)
      .then(function(data){
        /* sample data
          [
            {
              "taxId": 9060,
              "species": "Homo Sapien"
            }
          ]
        */
        var serverSuggestions = data?data.map((d)=>{
          return {
            detail: d['species'],
            displayText: d['taxId'],
          };
        }):[];

        // not only look for suggestions from server, but also using loaded tree
        var treeSuggestions = [];
        var nodes = _.values(self.treeStore.masterIdNodeMap);
        for (var i=0;i<nodes.length;i++){
          var node = nodes[i];
          var name = node.level || node.name;
          if (name &&
              name.toLowerCase().startsWith(phraseToSearch.toLowerCase()) &&
              node.rank != TreeConstant.GENOME){
            treeSuggestions.push({
              detail: name + ' (' + node.rank +')',
              displayText: 't' + node.id
            })
          }
          // only look for a few suggestions
          if (treeSuggestions.length >= 5){
            break;
          }
        }
        var suggestions = treeSuggestions.concat(serverSuggestions);
        // nothing from tree search or server
        if (suggestions.length === 0){
          self.queryBoxStore.suggestions = [QueryBoxConstant.NO_MATCH_SUGGESTION];
          return;
        }
        self.queryBoxStore.suggestions = suggestions;
      });
  }

  _submitQuery(){
    var {queryBoxStore,treeStore,summaryBoxStore, queryService} = this;
    var {query, selectedOption} = queryBoxStore;
    // treeStore.resetToDefaultDisplayable(); don't reset view
    if (!/( *t?\d+ *, *)*/.test(query)){
      var err = {
        error: 'When selecting for taxonomy option, enter comma seperated ncbi taxonomy id. The query is invalid.'
      };
      return Promise.reject(err);
    }
    var taxIds = queryBoxStore.getTaxIds();
    var nodeIds = queryBoxStore.getNodeIds();

    return queryService.getNodeIdByTaxIds(taxIds)
      .then(function(hits){
        hits = hits.concat(nodeIds);
        if (!hits || hits.length === 0){
          throw {
            error: 'Query returned no result.'
          };
        }else{
          var hitData = {};
          hitData[AppConstant.SEARCH_TAX] = hits;
          treeStore.setHits(hitData);
        }
      })
  }
};


class DomainQueryOptionHandler extends QueryOptionHandler{
  constructor(props){
    super(props);
  }
  _updateSuggestion(phraseToSearch){
    var self = this;
    if (phraseToSearch === ''){
      return;
    }
    this.queryService.autocompleteDomain(phraseToSearch)
      .then(function(data){
        /* sample data
          [
            {
              "description": "Forkhead domain", 
              "pfamA_acc": "PF00250", 
              "pfamA_id": "Forkhead"
            }, 
            {
              "description": "Forkhead N-terminal region", 
              "pfamA_acc": "PF08430", 
              "pfamA_id": "Forkhead_N"
            }
          ]
        */
        // note that we don't use pfamA_id
        if (!data || data.length === 0){
          self.queryBoxStore.suggestions = [QueryBoxConstant.NO_MATCH_SUGGESTION];
          return;
        }
        var suggestions = data.map((d)=>{
          return {
            detail: d['description'],
            displayText: d['pfamA_acc'],
          };
        });
        self.queryBoxStore.suggestions = suggestions;
      });
  }

  _submitQuery(phrases){
    var {queryBoxStore,treeStore,summaryBoxStore, queryService} = this;
    var {query, selectedOption} = queryBoxStore;
    var phrases = queryBoxStore.getQueryPhrases();
    if (!phrases || phrases.length === 0){
      var err = {
        error: 'You have entered invalid or empty query.'
      };
      return Promise.reject(err);
    }
    var searchOptions;
    try{
      searchOptions = queryBoxStore.getCleanedSearchOptions();
    }catch(error){
      return Promise.reject(error);
    }
    return queryService.queryDomains(phrases, searchOptions)
      .then(function(hits){
        if (hits.length == 0) {
          throw {
            error: 'Query returned no result',
          };
        }
        var hitData = {};
        hitData[AppConstant.SEARCH_PFAM] = hits;
        treeStore.setHits(hitData);
        summaryBoxStore.hits = hits;
        var distributionData = {
          distributionRank: TreeConstant.PHYLUM,
          distribution: treeStore.getHitDistribution(hits, TreeConstant.PHYLUM),
          queryUsed: queryBoxStore.query,
        };
        treeStore.syncBandColors(distributionData);
        summaryBoxStore.setSummary(distributionData);
      })
  }
};

class TigrfamQueryOptionHandler extends QueryOptionHandler{
  constructor(props){
    super(props);
  }
  _updateSuggestion(phraseToSearch){
    var self = this;
    if (phraseToSearch === ''){
      return;
    }
    this.queryService.autocompleteTigrfam(phraseToSearch)
      .then(function(data){
        /* sample data
          [
            {
              "definition": <string>,
              "tigrfamId": "TIGR12345",
            },
          ]
        */
        if (!data || data.length === 0){
          self.queryBoxStore.suggestions = [QueryBoxConstant.NO_MATCH_SUGGESTION];
          return;
        }
        var suggestions = data.map((d)=>{
          return {
            detail: d['description'],
            displayText: d['tigrfamId'],
          };
        });
        self.queryBoxStore.suggestions = suggestions;
      });
  }

  _submitQuery(phrases){
    var {queryBoxStore,treeStore,summaryBoxStore, queryService} = this;
    var {query, selectedOption} = queryBoxStore;
    var phrases = queryBoxStore.getQueryPhrases();
    if (!phrases || phrases.length === 0){
      var err = {
        error: 'You have entered invalid or empty query.'
      };
      return Promise.reject(err);
    }
    var searchOptions;
    try{
      searchOptions = queryBoxStore.getCleanedSearchOptions();
    }catch(error){
      return Promise.reject(error);
    }
    return queryService.queryTigrfam(phrases, searchOptions)
      .then(function(hits){
        if (hits.length == 0) {
          throw {
            error: 'Query returned no result',
          };
        }
        var hitData = {};
        hitData[AppConstant.SEARCH_TIGRFAM] = hits;
        treeStore.setHits(hitData);
        summaryBoxStore.hits = hits;
        var distributionData = {
          distributionRank: TreeConstant.PHYLUM,
          distribution: treeStore.getHitDistribution(hits, TreeConstant.PHYLUM),
          queryUsed: queryBoxStore.query,
        };
        treeStore.syncBandColors(distributionData);
        summaryBoxStore.setSummary(distributionData);
      })
  }
};


class KEGGQueryOptionHandler extends QueryOptionHandler{
  constructor(props){
    super(props);
  }

  _updateSuggestion(phraseToSearch){
    var self = this;
    if (phraseToSearch === ''){
      return;
    }
    this.queryService.autocompleteKegg(phraseToSearch)
      .then(function(data){
        /* sample data
          [
            {
              "description": "ZDS, crtQ; zeta-carotene desaturase [EC:1.3.5.6]", 
              "keggId": "K00514"
            } ...
          ]
        */
        if (!data || data.length === 0){
          self.queryBoxStore.suggestions = [QueryBoxConstant.NO_MATCH_SUGGESTION];
          return;
        }
        var suggestions = data.map((d)=>{
          return {
            detail: d['description'],
            displayText: d['keggId'],
          };
        });
        self.queryBoxStore.suggestions = suggestions;
      });
  }

  _submitQuery(){
    var {queryBoxStore,treeStore,summaryBoxStore, queryService} = this;
    var {query, selectedOption} = queryBoxStore;
    if (!/^( *K\d{5}(&K\d{5})* *)(, *K\d{5}(&K\d{5})* *)* *,? *$/g.test(query)){
      return Promise.reject({
        error: 'Invalid query'
      });
    }
    var keggIds = queryBoxStore.getQueryPhrases();
        var searchOptions;
    try{
      searchOptions = queryBoxStore.getCleanedSearchOptions();
    }catch(error){
      return Promise.reject(error);
    }
    return queryService.queryKegg(keggIds, searchOptions)
      .then(function(hits){
        if (!hits || hits.length === 0){
          throw {
            error: 'Query returned no result.'
          };
        }else{
          var hitData = {};
          hitData[AppConstant.SEARCH_KEGG] = hits;
          treeStore.setHits(hitData);
          summaryBoxStore.hits = hits;
          var distributionData = {
            distributionRank: TreeConstant.PHYLUM,
            distribution: treeStore.getHitDistribution(hits, TreeConstant.PHYLUM),
            queryUsed: queryBoxStore.query,
          };
          treeStore.syncBandColors(distributionData);
          summaryBoxStore.setSummary(distributionData);
        }
      })
  }
};

const Handlers = {
  initializeOptionHandlers: function(stores, services){
    this._handlers = {};
    this._handlers[AppConstant.SEARCH_TAX] = new TaxonomyQueryOptionHandler({
      stores: stores,
      services: services
    });
    this._handlers[AppConstant.SEARCH_PFAM] = new DomainQueryOptionHandler({
      stores: stores,
      services: services
    });
    this._handlers[AppConstant.SEARCH_KEGG] = new KEGGQueryOptionHandler({
      stores: stores,
      services: services
    });
    this._handlers[AppConstant.SEARCH_TIGRFAM] = new TigrfamQueryOptionHandler({
      stores: stores,
      services: services
    });
  },
  selectOptionHandler: function(selectedOption){
    return this._handlers[selectedOption];
  }
};
export default Handlers;
