import React, {PropTypes,Component} from 'react';
import {observer} from "mobx-react";
import * as SummaryBoxConstant from './SummaryBoxConstant';
import * as TreeConstant from 'treeOfLife/TreeConstant';

import AppDispatcher from 'dispatcher/AppDispatcher';
import DonutChart from 'DonutChart/';
import SimpleBox from 'SimpleBox/'
import './SummaryBox.less';

import * as _ from 'lodash';

const width = 320, height = 320;

@observer
export default class SummaryBoxContainer extends Component{
  constructor(){
    super();
    this.state = {showSummary: true};
  }
  static proptypes = {
    summaryBoxStore: React.PropTypes.object.isRequired,
    treeStore: React.PropTypes.object.isRequired,
  };
  handleDownloadHitDistribution(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: SummaryBoxConstant.DOWNLOAD_HIT_DISTRIBUTION
    });
  }
  handleToggleSummary(e){
    e.stopPropagation();
    this.setState({showSummary:!this.state.showSummary});
  }
  handleDistributionRankChange(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: SummaryBoxConstant.DISTRIBUTION_RANK_CHANGE,
      payload: e.target.value,
    });
  }
  render(){
    var {summaryBoxStore, treeStore} = this.props;
    var {distribution, queryUsed, hasSummary, distributionRank} = summaryBoxStore;
    var rankLevels = [TreeConstant.PHYLUM, TreeConstant.CLASS, TreeConstant.ORDER,
                      TreeConstant.FAMILY, TreeConstant.GENUS, TreeConstant.SPECIES];
    var bandColors = treeStore.bandColors;
    var colorFunction = bandColors.colors[distributionRank];
    return (
      <div className="summaryBox">
        <SimpleBox
        titleLeft="Summary"
        titleRight={
          <span onClick={(e)=>this.handleToggleSummary(e)}>
          {this.state.showSummary?
            (<i className='fa fa-chevron-down'></i>)
            :
            (<i className='fa fa-chevron-up'></i>)
          }
          </span>
        }
        >
          {this.state.showSummary?
            (hasSummary?
              (<div>
                <p className="form-label">Query used:</p>
                <p>{queryUsed}</p>
                <div className='pull-right' style={{'marginTop':'-12px'}}>
                  <span className="downloadHitDistribution" onClick={(e)=>this.handleDownloadHitDistribution(e)}>
                    CSV
                  </span>
                </div>
                <span className='text-left'>
                  Summarize by: <select className="rankToggle" value={distributionRank} onChange={(e)=>this.handleDistributionRankChange(e)}>
                    {_.map(rankLevels, (level)=>(
                        <option value={level} key={level}>{level}</option>
                        )
                      )
                    }
                  </select>
                </span>
                <DonutChart width={width} height={height} data={distribution} sliceColorFn={colorFunction}></DonutChart>
                <div className="footNotes">
                  &nbsp; &nbsp; [x, y%] means x genome hits in this taxonomy, y% of total hits
                </div>
              </div>
              )
              :
              <p className="form-label">Oops, no query result yet</p>
            )
            :
            (<p className="form-label">Summary collapsed</p>)
          }
        </SimpleBox>
      </div>
      )
  }
}




