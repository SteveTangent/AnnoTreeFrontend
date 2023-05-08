import React, {PropTypes,Component} from 'react';
import {observer} from "mobx-react";
import * as TreeConstant from '../TreeConstant';
import AppDispatcher from 'dispatcher/AppDispatcher';
import SimpleBox from 'SimpleBox/'
import './NodeDetailContainer.less';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import * as util from 'util/';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import {LoadingBar} from 'LoadingBar/';

import {getUniprotUrl,getPfamDomainUrl} from 'util/';

import TaxonomyHitPlot from './TaxonomyHitPlot';

import * as Config from 'Config';

@observer
export default class NodeDetailContainer extends Component{
  static proptypes = {
    nodeDetail: React.PropTypes.object.isRequired,
  }
  constructor(props) {
    super(props);
  }
  handlePopUpClose(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_POP_UP_CLOSE,
      payload: null,
    });
  }

  handleRecenterClicked(e,node){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_RECENTER_CLICKED,
      payload: node,
    });
  }

  handleRecenterLevelClicked(e,node,level){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_RECENTER_LEVEL_CLICKED,
      payload: { 
        node, level, 
      }
    });
  }

  detailResultDownloadHandler(state, rowInfo, column, instance){
    var self = this;
    return {
      onClick: (e, handleOriginal) => {
          // IMPORTANT! React-Table uses onClick internally to trigger
          // events like expanding SubComponents and pivots.
          // By default a custom 'onClick' handler will override this functionality.
          // If you want to fire the original onClick handler, call the
          // 'handleOriginal' function.
          if (handleOriginal) {
            handleOriginal();
          }
          if (column['Header'] !== 'Protein Download'){
            return;
          }
          var result = rowInfo.row._original;
          // download only one row
          self.handleDownloadDetailResults(e, [result]);
        }
      }
    };

  handleDownloadDetailResults(e, detailResults){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type:TreeConstant.TREE_DOWNLOAD_DETAIL_RESULTS,
      payload: detailResults
    });
  }

  handleDragStart(e,type){
    e.stopPropagation();
    var payload = {
      'displayAt': this.props.nodeDetail.displayAt,
      'clickAt': [e.nativeEvent.pageX,e.nativeEvent.pageY]
    };
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_NODE_DETAIL_ON_DRAG_START,
      payload: payload
    });
  }

  render(){
    var {taxonName, taxonId, displayAt, taxonType, rank, isLeaf, 
      hasQueryResult, taxonomyHits, node, taxonomyLevels, 
      childrenSummary, numChild, numLeafByLevel,
      detailResults, isLoading} = this.props.nodeDetail;
    var taxonomyPlotWidth = TreeConstant.NODE_CONTAINER_WIDTH - 30;
    var taxonomyPlotHeight = 25;
    var self = this;
    var taxonNameSection = (
      <div key={0}>
        <div className="row">
          <div className="col-xs-4 form-label">
            Taxon: 
          </div>
          <div className="col-xs-8">
            {
              node.isLeaf?
              (<a href={'http://gtdb.ecogenomic.org/genomes?gid='+taxonName.substr(taxonName.indexOf('_')+1)}
              target="_blank">{taxonName}</a>)
              :
              (taxonName)
            }
          </div>
        </div>
        <div className="row">
          <div className="col-xs-4 form-label">Node ID: </div>
          <div className="col-xs-8">{node.id}</div>
        </div>
        {taxonomyLevels
          .map((l, index)=>
            (<div className="row" key={index}>
              <div className="col-xs-4 form-label">{l.rank}: </div>
              <div className="col-xs-8">{l.rank_name}</div>
            </div>
            )
          )}
        {!isLeaf && <div className="row">
          <div className="col-xs-4 form-label">Number of Genomes: </div>
          <div className="col-xs-8">{numChild}</div>
        </div>}
        {childrenSummary.length > 0 && <div className="row">
          <div className="col-xs-4 form-label">
            Child taxa: 
          </div>
          <div className="col-xs-8">
            {childrenSummary.join(', ')}, etc
          </div>
        </div>}
      </div>);
    var rankSection = (rank && <div key={1} className="row">
                                <div className="col-xs-4 form-label">
                                  Rank: 
                                </div>
                                <div className="col-xs-8">
                                  {rank}
                                </div>
                              </div>);
    var taxonomyHitSection = (!isLeaf && hasQueryResult && taxonomyHits && <div key={2} className="row">
                                          <div className="col-xs-12 taxonomyHits-section">
                                            <p className="form-label">Taxonomy Hits:</p>
                                            <TaxonomyHitPlot hitDistribution={taxonomyHits} 
                                             width={taxonomyPlotWidth}
                                             height={taxonomyPlotHeight}></TaxonomyHitPlot>
                                          </div>
                                        </div>);
    var recenterSection = (!isLeaf &&
                    <div key={3} className="row">
                      <div className="col-xs-4 form-label">
                        Zoom on: 
                      </div>
                      <div className="col-xs-8 action-section">
                        {Object.keys(numLeafByLevel).map((childLevel) => 
                          (<div className="action-item" onClick={(e)=>this.handleRecenterLevelClicked(e,node,childLevel)}
                              key={childLevel}>
                              {childLevel} [{numLeafByLevel[childLevel]}] <i className="fa fa-arrows-alt"></i>
                            </div>))}
                      </div>
                    </div>
    );

    var columns = [{
      Header: 'Protein Download',
      Cell: props=>(<a style={{'cursor':'pointer'}}> Protein Sequence </a>)
    }];
    var accessorToHeaderMapping = {
      'tigrfamId': "TIGRFAM ID",
      'pfamId': 'Pfam Family',
      'keggId': 'KEGG ID',
      'geneId': 'Gene ID',
      'subjectPercentAlignment': 'Subject Percent Alignment',
      'bitscore': 'Bit Score',
      'eval': 'E-Value',
      'queryPercentAlignment': 'Query Percent Alignment',
    };
    if (detailResults && detailResults.length > 0){
      var dynamicColumns = _.keys(detailResults[0]).map((key)=>({
        accessor: key,
        Header: accessorToHeaderMapping[key] || key,
      }));
      var idColumns = _.remove(dynamicColumns, (obj)=>/Id$/g.test(obj.accessor));
      // put id column to front
      columns = _.concat(idColumns, dynamicColumns, columns);
    }

    var detailResultSection = (detailResults && (<div key={4} className="row">
      <div className="col-xs-12">
        <ReactTable data={detailResults} defaultPageSize={99999}
          showPageSizeOptions={false}
          style={{"maxHeight":"150px", "overflow":"auto"}}
          minRows={0}
          showPagination={false}
          columns={columns}
          getTdProps={this.detailResultDownloadHandler.bind(this)}/>
      </div>
      <p className="col-xs-12 footNotes">Only {TreeConstant.RESULT_SIZE_LIMIT} are shown, full list of hits available when downloaded</p>
      <div className="col-xs-12 text-center" style={{'cursor':'pointer'}}>
        <a onClick={(e)=>this.handleDownloadDetailResults(e, detailResults)}>
          Download All Sequences</a>
      </div>
    </div>));

    var noQueryResult = (<div key={5} className="row">
        <div className="col-xs-12 footNotes">
          Sorry no query was run, there is no additional information.
        </div>
      </div>);
    var queryResult = hasQueryResult?
      (<div>{taxonomyHitSection}</div>)
      :
      noQueryResult;

    var box = (<SimpleBox 
          titleLeft={
            <div className="nodeDetailTitle" style={{"min-width":"350px"}} onMouseDown={(e)=>this.handleDragStart(e)}>{taxonName} &nbsp;</div>
          }
          titleRight={
            <span> {taxonType} <i className="fa fa-close" onClick={this.handlePopUpClose}></i></span>
          }>
            {taxonNameSection}
            {rankSection}
            <br/>
            {recenterSection}
            {queryResult}
            <div className="detailResultSection">
              {detailResultSection}
              <LoadingBar isLoading={isLoading} size="sm"></LoadingBar>
            </div>
        </SimpleBox>);

    return (
      <div className="nodeDetailContainer" style={{
        top: displayAt[1] + 'px', // the y coord is distance from top
        left: displayAt[0] + 'px', // the x coord is dist from left
      }}>
        {box}
      </div>
      );
  }
}


