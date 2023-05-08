import { observable, computed, action } from 'mobx';
import * as _ from 'lodash';
import * as TreeConstant from 'treeOfLife/TreeConstant';

export default class SummaryBoxStore{
  @observable distribution = [];
  /* [{
    label: <string>,
    value: <number>, 
  }]
  */
  @observable queryUsed = ''; //String
  @observable hasSummary = false; //bool
  @observable distributionRank = TreeConstant.PHYLUM;
  @observable hits = [];
  @observable summaryColorFns = {};
  @action clear(){
    this.distribution = [];
    this.queryUsed = '';
    this.hasSummary = false;
    this.hits = [];
  }

  @action setSummary(props){
    var distribution = props.distribution;
    this.distribution = _.map(distribution, function(val, key){
      return {
        'label': key,
        'value': val.hitCount,
      };
    });
    this.distributionRank = props.distributionRank;
    this.queryUsed = props.queryUsed || '';
    this.hasSummary = true;
  }
}


