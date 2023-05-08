import BaseService from './BaseService';

export default class QueryService extends BaseService{
  constructor(props) {
    super(props);
  }

  getNodeIdByTaxIds(speciesIds){
    /*
      expect a list of string
      return a list of numbers, each number represents node id
    */
    return this.postJson('/treeNodes/by/taxIds', speciesIds);
  }
  /*
    expected input: [<string> ...]
    expected return:
    [id: node_id:string ]
  */
  queryDomains(domains, searchOptions){
    var payload = {
      domains: domains
    };
    if (searchOptions) payload['thresholds'] = searchOptions;
    return this.postJson('/treeNodes/by/domains', payload);
  }

  queryTigrfam(domains, searchOptions){
    var payload = {
      domains: domains
    };
    if (searchOptions) payload['thresholds'] = searchOptions;
    return this.postJson('/treeNodes/by/tigrfam', payload);
  }

  queryKegg(keggs, searchOptions){
    var payload = {
      keggs: keggs,
    };
    if (searchOptions) payload['thresholds'] = searchOptions;
    return this.postJson('/treeNodes/by/keggs', payload);
  }

  autocompleteDomain(domainPhrase){
    return this.getJson('/pfamDomain/autocomplete?query='+domainPhrase);
  }
  autocompleteTigrfam(domainPhrase){
    return this.getJson('/tigrfam/autocomplete?query='+domainPhrase);
  }

  autocompleteTaxonomy(taxPhrase){
    return this.getJson('/taxonomy/autocomplete?query='+taxPhrase);
  }
  autocompleteKegg(keggPhrase){
    return this.getJson('/kegg/autocomplete?query='+keggPhrase);
  }
}






