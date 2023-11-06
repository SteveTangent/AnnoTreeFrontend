import { observable, computed, action } from 'mobx';
import * as AppConstant from 'AppConstant';
import * as QueryBoxConstant from './QueryBoxConstant';
import {SEARCH_TIGRFAM} from "../../AppConstant";

export default class QueryBoxStore{
  @observable options = AppConstant.QUERY_BOX_OPTIONS;
  @observable _searchOptions = _.cloneDeep(QueryBoxConstant.SEARCH_OPTIONS);
  // @observable selectedOption = AppConstant.SEARCH_KEGG;
  @observable selectedOption = AppConstant.SEARCH_TIGRFAM;
  @observable optionsShown = false;
  @observable suggestions = [];
  @observable query = '';
  /*
    lastSearchedConfig is the last successfully searched setting
    e.g. {
      option: 'pfam',
      query: 'PF00001, PF89333'
    }
  */
  @observable lastSearchedConfig = null;
  @observable warning = null;
  constructor() {
    // don't do any thing
  }

  setLastSearchedConfig(){
    this.lastSearchedConfig = {
      option: this.selectedOption,
      query: this.query
    };
    return this.lastSearchedConfig;
  }

  clearLastSearchedConfig(){
    this.lastSearchedConfig = null;
  }
  // return an array of query phrases from the text
  getQueryPhrases(queryText){
    if (typeof(queryText) === 'undefined') queryText = this.query;
    return queryText.split(',').map((s)=>s.trim()).filter((t)=>t.length>0);
  }

  getTaxIds(queryText){
    if (typeof(queryText) === 'undefined') queryText = this.query;
    return queryText.split(',')
      .map((x)=>x.replace(/ /g,''))
      .filter((x)=>x.length>0 && !x.startsWith('t'))
      .map((x)=>parseInt(x));
  }

  getNodeIds(queryText){
    if (typeof(queryText) === 'undefined') queryText = this.query;
    return queryText // tree node ids that start with 't' in front
          .split(',')
          .map((x)=>x.replace(/ /g,''))
          .filter((x)=>x.length>0 && x.startsWith('t'))
          .map((x)=>parseInt(x.replace('t','')));
  }
  @computed get currentSearchOption(){
    var self = this;
    var current = self._searchOptions[self.selectedOption];
    return current || [];
  }
  @action getCleanedSearchOptions(){
    var searchOptions = [];
    var self = this;
    var currentSearchOption = self.currentSearchOption;
    for(var i=0;i<currentSearchOption.length;++i){
      var option = currentSearchOption[i];
      option.value = parseFloat(option.value);
      if (option.value === NaN){
        throw {error: 'Enter a valid number for search option'};
      }
      if (option.name === 'eval'){
        option.value = Math.min(option.value, option.defaultVal);
      }else{
        option.value = Math.max(option.value, option.defaultVal);
      }
      searchOptions.push({
        fieldname: option.name,
        value: option.value
      });
    }
    return searchOptions;
  }
}



