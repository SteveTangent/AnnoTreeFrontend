import BaseService from './BaseService';
import * as Config from '../Config';
import * as TreeConstant from '../feature/treeOfLife/TreeConstant';

export default class TreeService extends BaseService{
  constructor(props) {
    super(props);
  }

  getTrees(){
    var self = this;
    return Promise.all([
        this.getJson('/tree',{
          databaseType: '/'+Config.BACTERIAL_DATABASE
        }),
        this.getJson('/tree',{
          databaseType: '/'+Config.ARCHAEAL_DATABASE
        })
      ])
      .then(function(trees){
        var bac_tree = trees[0];
        var arch_tree = trees[1];
        return {
          [TreeConstant.BACTERIAL_TREE]:{
            tree: bac_tree,
          },
          [TreeConstant.ARCHAEAL_TREE]:{
            tree: arch_tree,
          },
        };
      })
  }

  getPfamScanResults(domains, gtdbIds, withSequence, sizeLimit, searchOptions) {
    return this.postJson('/pfamScanResults',{
        'domains': domains,
        'gtdbIds': gtdbIds,
        'withSequence': withSequence,
        'sizeLimit': sizeLimit,
        'thresholds': searchOptions || []
    });
  }

  getTigrfamResults(domains, gtdbIds, withSequence, sizeLimit, searchOptions) {
    return this.postJson('/tigrfamResults',{
        'domains': domains,
        'gtdbIds': gtdbIds,
        'withSequence': withSequence,
        'sizeLimit': sizeLimit,
        'thresholds': searchOptions || []
    });
  }

  getKeggResults(keggs, gtdbIds, withSequence, sizeLimit, searchOptions) {
    return this.postJson('/keggResults',{
        'keggs': keggs,
        'gtdbIds': gtdbIds,
        'withSequence': withSequence,
        'sizeLimit': sizeLimit,
        'thresholds': searchOptions || []
    });
  }
}
