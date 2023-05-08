import { observable, computed, action } from 'mobx';
import * as _ from 'lodash';
import * as TreeConstant from '../TreeConstant';

 /*
    {
      displayAt: [x:Number,y:Number], // relative to tree of life container 
      taxonName: String,
      node: <object>, tree node object
      taxonType: enum{TreeConstant.INFERRED_ANCESTOR,TreeConstant.GENUS_REP},
      isLeaf: '1'(true) or '0'
      rank: optional String
      hasQueryResult: boolean, true if there is currently a query result shown, false otherwise
      taxonomyHits: {
        noInfo: <number>,
        noHit: <number>,
        hit: <number>,
      },
    }
*/

export default class NodeDetailModel{
  @observable displayAt;
  @observable taxonName;
  @observable taxonId;
  @observable taxonType;
  @observable isLeaf;
  @observable rank;
  @observable hasQueryResult;
  @observable taxonomyHits;
  @observable pfamScanResults;
  @observable keggResults;
  @observable node; // the actual tree node object
  @observable isLoading = false;
  constructor(props) {
    Object.assign(this, props);
  }
  @action startLoading(){
    this.isLoading = true;
  }
  @action stopLoading(){
    this.isLoading = false;
  }
};