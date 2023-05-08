import * as TreeConstant from '../feature/treeOfLife/TreeConstant';
import * as Config from '../Config';
import * as _ from 'lodash';

function _fetchJson(){
  return fetch.apply(null,arguments).then((response)=>{
    return response.json().then((x)=>{
      if (response.ok) return x;
      else throw x;
    });
  });
}
export default class BaseService{
  constructor(props) {
    var {baseUrl} = props;
    this.baseUrl = baseUrl;
  }

  setConfigStore(store){
    this.configStore = store;
  }

  getDatabaseType(){
    var treeType = this.configStore.treeType;
    if (treeType === TreeConstant.BACTERIAL_TREE){
      return '/' + Config.BACTERIAL_DATABASE;
    }else if (treeType === TreeConstant.ARCHAEAL_TREE){
      return '/' + Config.ARCHAEAL_DATABASE;
    }
    throw 'unknown tree type: ' + treeType;
  }

  fetchJson(endpoint,options){
    var dbType;
    if(options && options.databaseType){
      dbType = options.databaseType;
    }else{
      dbType = this.getDatabaseType();
    }

    var fullEndpoint = this.baseUrl + dbType + endpoint;
    var defaultOptions = {
      mode: 'cors',
      headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
    }
    var fullOptions = Object.assign({},defaultOptions,options);
    var request = new Request(fullEndpoint, Object.assign({}, fullOptions, {
      headers: new Headers(fullOptions['headers']),
    }));
    return _fetchJson(request);
  }

  postJson(endpoint,data, options){
    var defaultOptions = {
      body: JSON.stringify(data),
      method: 'POST',
    };
    if(options) _.extend(defaultOptions,options);
    return this.fetchJson(endpoint,defaultOptions);
  }
  getJson(endpoint, options){
    var defaultOptions = {
      method:'GET',
    };
    if(options) _.extend(defaultOptions,options);
    return this.fetchJson(endpoint, options);
  }
}




