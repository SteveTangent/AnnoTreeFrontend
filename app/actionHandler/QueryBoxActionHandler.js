import ViewActionHandler from './ViewActionHandler';
import * as QueryBoxConstant from 'queryBox/QueryBoxConstant';
import * as TreeConstant from 'treeOfLife/TreeConstant';
import * as AppConstant from 'AppConstant';
import * as _ from 'lodash';
import Handlers from 'queryBox/QueryOptionHandler';

import Papa from 'papaparse';

export default class QueryBoxActionHandler extends ViewActionHandler{
  constructor(props){
    super(props);
    this.queryBoxStore = this.stores.queryBoxStore;
    this.treeStore = this.stores.treeStore;
    this.summaryBoxStore = this.stores.summaryBoxStore;
    this.queryService = this.services.queryService;
    Handlers.initializeOptionHandlers(this.stores, this.services);
  }

  // return the phrase that will be used to query server for suggestions
  getAutocompletePhrase(queryText){
    if (queryText === ''){
      return '';
    }
    var phrases = this.queryBoxStore.getQueryPhrases(queryText);
    if (phrases.length == 0) return '';
    return phrases[phrases.length-1];
  }

  handleQuerySuggestionClicked(suggestion){
    this.queryBoxStore.suggestions = [];
    if (_.isEqual(suggestion, QueryBoxConstant.NO_MATCH_SUGGESTION)){
      return;
    }
    var phrases = this.queryBoxStore.getQueryPhrases();
    if (phrases.length === 0){
      phrases = [suggestion.displayText]
    }else{
      phrases[phrases.length-1] = suggestion.displayText;
    }
    this.queryBoxStore.query = phrases.concat(['']).join(', ');
  }

  handleFileUploaded(files){
    var {queryBoxStore, treeStore, queryService} = this;
    if (files.length === 0){
      return;
    }
    if (files.length > 1){
      alert('please upload one file');
      return;
    }
    var f = files[0];

    var reader = new FileReader();
    reader.readAsText(f);
    var parser = new window.DOMParser();

    if(f.type === "text/xml"){
      console.log("xml file detected");
    }  
    else if(f.type === "text/csv"){
      console.log("csv file detected");
    }

    reader.onload = function(e){
      var speciesIdList;
      var csvNameList;
      try{
	if(f.type === "text/csv"){
	  var csvText = reader.result;
          var parsedFile = Papa.parse(csvText);
          var scientificNameSet = new Set();
          
	  // Assume the Scientific Name column is the second column
	  const isScientificName = (element) => element === "Scientific Name";
	  let csvHeaderPosition = parsedFile.data[0].findIndex(isScientificName);
	  if(csvHeaderPosition === -1){
            console.log("No Scientific Name Column!");
	    return;
	  }
	  for(let i = 1;i < parsedFile.data.length;i++){
            scientificNameSet.add(parsedFile.data[i][csvHeaderPosition]);  
          }
          scientificNameSet.delete(undefined);
          csvNameList = Array.from(scientificNameSet);
	  console.log("Scitifc Names in csv",csvNameList);
          if(csvNameList.length === 0){
	    alert('Scientific Names in the csv file are null, please check the Scientif Name column and its position.');
	  }
          
	  treeStore.startLoading();
          queryService
          .getNodeIdByTaxIds(csvNameList)
          .then(function(nodeIds){
            var hitData = {};
            hitData[AppConstant.SEARCH_TAX] = nodeIds;
            treeStore.setHits(hitData);
          })
          .catch(function(err){
            console.log(err);
            queryBoxStore.warning = 'Server error while processing BLAST csv,'+
              ' please take a screenshot of website console and forward it to developers';
          })
          .then(function(){
            treeStore.stopLoading();
          });
        }
        else if(f.type === "text/xml"){ 
        var xmlDoc = parser.parseFromString(reader.result,"text/xml");
        var taxids = xmlDoc.getElementsByTagName('taxid');
        if (taxids.length === 0){
          alert('The xml does not have any hit. Taxonomy ids cannot be found.')
        }
        var speciesIdSet = {}; // use a hash to deduplicate
        for(var i = 0;i<taxids.length;i++){
          speciesIdSet[parseInt(taxids[i].innerHTML)] = true;
        }
	speciesIdList = Object.keys(speciesIdSet).map(x => parseInt(x));
        console.log('species id list: ', speciesIdList);
        treeStore.startLoading();
        queryService
          .getNodeIdByTaxIds(speciesIdList)
          .then(function(nodeIds){
            var hitData = {};
            hitData[AppConstant.SEARCH_TAX] = nodeIds;
            treeStore.setHits(hitData);
          })
          .catch(function(err){
            console.log(err);
            queryBoxStore.warning = 'Server error while processing BLAST xml,'+
              ' please take a screenshot of website console and forward it to developers';
          })
          .then(function(){
            treeStore.stopLoading();
          });
	}
        else{
	  console.log("file format is neither xml nor csv");
	  alert('An error occured reading BLAST xml, is the format correct?');
	  return;
	}
      }catch(e){
        alert('An error occured reading BLAST xml, is the format correct?');
        console.log(e);
        return;
      }
    }
   }

  handleAction(action){
    var queryBoxStore = this.queryBoxStore;
    var queryOptionHandler = Handlers.selectOptionHandler(queryBoxStore.selectedOption);
    switch(action.type){
      case QueryBoxConstant.QUERY_OPTION_CHANGED:
        var option = action.payload;
        queryBoxStore.selectedOption = option;
        queryBoxStore.optionsShown = false;
        break;
      case QueryBoxConstant.QUERY_OPTION_OPENED:
        queryBoxStore.optionsShown = !queryBoxStore.optionsShown;
        break;
      case QueryBoxConstant.QUERY_TEXT_CHANGED:
        var queryText = action.payload;
        queryBoxStore.query = queryText; // maintain state consistency
        queryBoxStore.warning = null;
        queryBoxStore.suggestions = []; // clear all suggestions
        try{
          var autocompletePhrase = this.getAutocompletePhrase(queryText);
          queryOptionHandler.updateSuggestion(autocompletePhrase);
        }catch (err){
          queryBoxStore.warning = {message: err.message};
          return;
        }
        break;
      case QueryBoxConstant.QUERY_SUBMITTED:
        var queryBoxStore = this.queryBoxStore;
        queryBoxStore.warning = null;
        queryBoxStore.query = queryBoxStore.query.replace(/,\s*$/, '');
        // update URL
        var url = window.location.href.split('#/?')[0];
        var queryParam = 'qtype=' + queryBoxStore.selectedOption + '&qstring=' +
          encodeURIComponent(queryBoxStore.query);
        var searchOptions = queryBoxStore.currentSearchOption.map((opt)=>'&'+opt['name']+'='+opt['value']).join('');
        window.location.href = url + '#/?' + queryParam + searchOptions;
        queryOptionHandler.handleQuery();
        break;
      case QueryBoxConstant.QUERY_SUGGESTION_CLICKED:
        this.handleQuerySuggestionClicked(action.payload);
        break;
      case QueryBoxConstant.FILE_UPLOADED:
        this.handleFileUploaded(action.payload);
        break;
      case AppConstant.APP_CLICKED:
        queryBoxStore.optionsShown = false;
        queryBoxStore.suggestions = []; // clear the shown suggestions
        break;
      default:
        break;
    }
    return;
  }
};






