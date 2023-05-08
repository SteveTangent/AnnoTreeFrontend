import ViewActionHandler from './ViewActionHandler';
import * as TreeConstant from 'treeOfLife/TreeConstant';
import * as SummaryBoxConstant from 'summaryBox/SummaryBoxConstant';
import {exportToCsv,toNewick,downloadAsFile} from 'util/';
import * as _ from 'lodash';

export default class SummaryBoxActionHandler extends ViewActionHandler{
  constructor(props){
    super(props);
    this.treeStore = this.stores.treeStore;
    this.treeService = this.services.treeService; // get tree service class 
    this.summaryBoxStore = this.stores.summaryBoxStore;
  }

  handleAction(action){
    var summaryBoxStore = this.summaryBoxStore;
    var treeStore = this.treeStore;
    switch(action.type){
      case SummaryBoxConstant.DOWNLOAD_HIT_DISTRIBUTION:
        var levels = [TreeConstant.PHYLUM, TreeConstant.CLASS, TreeConstant.ORDER,
                      TreeConstant.FAMILY, TreeConstant.GENUS, TreeConstant.SPECIES];
        var rowsForEachLevel = levels.map(function(level){
                  var distribution = treeStore.getHitDistribution(summaryBoxStore.hits, level);
                  var total = 0;
                  _.forEach(distribution, function(val, key){
                    total += val.hitCount;
                  });
                  var rowsForOneLevel = []
                  _.forEach(distribution, function(val, key){
                    rowsForOneLevel.push([key, val.hitCount, val.hitCount * 1.0 / total, val.numGenome]);
                  });
                  var header = [[],[level+' name', 'number of genome hits', 'proportion of all hits', 'number of genomes in clade']];
                  return header.concat(rowsForOneLevel);
                });
        var flattened = _.flatMap(rowsForEachLevel);
        exportToCsv('hit_distribution.csv', flattened);
        break;
      case SummaryBoxConstant.DISTRIBUTION_RANK_CHANGE:
        var rank = action.payload;
        var distributionData = {
          distributionRank: rank,
          distribution: treeStore.getHitDistribution(summaryBoxStore.hits, rank),
          queryUsed: summaryBoxStore.queryUsed,
        };
        treeStore.syncBandColors(distributionData)
        summaryBoxStore.setSummary(distributionData);
        break;
    }
    return;
  }
};
