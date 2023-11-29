import React, {PropTypes,Component} from 'react';
import {findDOMNode} from 'react-dom';
import {observer} from "mobx-react";
import TreeOfLife from './TreeOfLife';
import {NodeDetailContainer} from './nodeDetail';
import * as TreeConstant from './TreeConstant';
import * as AppConstant from 'AppConstant';
import {isBandViewAllowed} from './treeUtil';

import AppDispatcher from 'dispatcher/AppDispatcher';
import * as _ from 'lodash';
import {LoadingBar} from 'LoadingBar/';
import { SketchPicker } from 'react-color'

@observer
export default class TreeContainer extends Component{
  static proptypes = {
    treeStore: React.PropTypes.object.isRequired,
  }
  constructor(props) {
    super(props);

    const levelLength = TreeConstant.AVAILABLE_LEVELS.length
    this.state = {
      isHovering: Array(levelLength).fill(false)
    };
  }
  handleMouseEnter = (index) => {

    this.setState(prevState => {
      const newHovering = [...prevState.isHovering];
      newHovering[index] = true;
      return { isHovering: newHovering };
    });
  }

  handleMouseLeave = (index) => {
    this.setState(prevState => {
      const newHovering = [...prevState.isHovering];
      newHovering[index] = false;
      return { isHovering: newHovering };
    });
  }

  handleBackClick(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_BACK_BUTTON_CLICKED,
    });
  }
  handleResetButtonClick(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_RESET_BUTTON_CLICKED,
    });
  }

  handleDownloadTree(e, type){
    e.stopPropagation();
    switch(type){
      case 'svg':
        var domNode = findDOMNode(this);
        var svgNode = domNode.getElementsByTagName('svg')[0];
        AppDispatcher.handleViewAction({
          type: TreeConstant.TREE_DOWNLOAD_SVG_CLICKED,
          payload: svgNode,
        });
        break;
      case 'newick':
        AppDispatcher.handleViewAction({
          type: TreeConstant.TREE_DOWNLOAD_NEWICK_CLICKED,
        });
        break;
      case 'query':
        AppDispatcher.handleViewAction({
          type: TreeConstant.TREE_DOWNLOAD_QUERY_RESULTS,
        });
        break;
    }
  }

  handleTreeTypeChanged(e){
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_TYPE_CHANGED,
      payload: e.target.value,
    });
  }

  handleLevelClicked(e,l){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_LEVEL_CLICKED,
      payload: l,
    });
  }

  handleFontSizeChange(e,size){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_FONT_SIZE_CHANGED,
      payload: size,
    });
  }

  handleGroupBandLevelChanged(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_GROUP_BAND_LEVEL_CHANGED,
      payload: e.target.value,
    });
  }

  toggleColorPicker(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_TOGGLE_COLOR_PICKER,
      payload: e
    });
  }

  handleColorChange(color, event){
    event.stopPropagation();
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_HIGHLIGHT_COLOR_CHANGE,
      payload: color.hex
    });
  }

  getLevelClass(level, activeLevel, disabledLevels){
    if (disabledLevels && disabledLevels.indexOf(level) > -1){
      return 'disabled';
    } else if (level === activeLevel){
      return 'active';
    }
    return 'enabled';
  }

  getLevels(currentDisplayLevel, disabledDisplayLevels) {
    return TreeConstant.AVAILABLE_LEVELS.map((l, i) => {
      if (this.getLevelClass(l, currentDisplayLevel, disabledDisplayLevels) === 'enabled'){
        return (
              <li
                onMouseEnter={()=>this.handleMouseEnter(i)}
                onMouseLeave={()=>this.handleMouseLeave(i)}
                key={i} className={this.getLevelClass(l, currentDisplayLevel, disabledDisplayLevels)}
                 onClick={(e) => this.handleLevelClicked(e, l)}>
              {
                  this.state.isHovering[i] && (l === 'species' || l === 'genus') &&(
                      <div className="popup-box">
                        Genus and species level are not recommended as it may slow down the website.
                      </div>
                  )}
              {l}
              </li>);
      } else{
        return (<li key={i} className={this.getLevelClass(l, currentDisplayLevel, disabledDisplayLevels)}>
          {l}
        </li>)
      }
    })
  }

  render(){
    var {treeStore, queryBoxStore, summaryBoxStore} = this.props;
    return (
      <div className='treeContainer'>
        <span className='back-button' onClick={(e)=>this.handleBackClick(e)}>
          <i className="fa fa-chevron-left"></i> Back
        </span>
        <br/>
        <div className="download-button-container">
          <span className='download-button svg' onClick={(e)=>this.handleDownloadTree(e, 'svg')}>
            SVG
          </span>
          <span className='download-button newick' onClick={(e)=>this.handleDownloadTree(e, 'newick')}>
            Newick
          </span>
          <span className='download-button all' onClick={(e)=>this.handleDownloadTree(e, 'query')}>
            All query results
          </span>
          <LoadingBar isLoading={treeStore.downloading} size='sm'></LoadingBar>
        </div>

        <div className="currentLevelIndicatorContainer">
          <div className="currentLevelIndicator">
            {/*Resolution level:*/}
            Outer ring annotation:
              <ul className="levelList">
                {this.getLevels(treeStore.currentDisplayLevel, treeStore.disabledDisplayLevels)}
              </ul>
          </div>
          <button className="reset-button" onClick={(e)=>this.handleResetButtonClick(e)}>
            reset view
          </button>
        </div>
        {/*<div>*/}
        {/*  Viewing: {treeStore.displayRoot.id === treeStore.masterTree.id?'Default tree':'Subset of '+treeStore.displayRoot.level}*/}
        {/*</div>*/}

	{
        <div>
          Tree Type: 
          <select value={treeStore.treeType} className='treeTypeToggle' onChange={(e)=>this.handleTreeTypeChanged(e)}>
            {
              _.keys(treeStore.trees).map((treeType)=>{
                return <option value={treeType} key={treeType}>{treeType}</option>
              })
            }
          </select>
        </div>
        }
        <div>
          Viewing: {treeStore.displayRoot.id === treeStore.masterTree.id?'Full '+ treeStore.treeType.toLowerCase() + ' tree' :'Subset of '+treeStore.treeType.toLowerCase() + ' tree'}
        </div>
        {treeStore.groupBandLevel === TreeConstant.NONE &&
          <div>
            Font Size:
            <span className="font-minus" onClick={(event)=>this.handleFontSizeChange(event,treeStore.fontSize-1)}><i className="fa fa-minus-circle"></i></span>
            {treeStore.fontSize}
            <span className="font-plus" onClick={(event)=>this.handleFontSizeChange(event,treeStore.fontSize+1)}><i className="fa fa-plus-circle"></i></span>
          </div>
        }
        {
        <div>
          Taxonomic level:
          <select value={treeStore.groupBandLevel} className='treeTypeToggle' onChange={(e)=>this.handleGroupBandLevelChanged(e)}>
            {
              TreeConstant.AVAILABLE_GROUP_BAND_LEVELS.map((levelName)=>{
                return <option value={levelName} key={levelName}
                        disabled={!isBandViewAllowed(levelName, treeStore.currentDisplayLevel)}>
                        {levelName}
                       </option>
              })
            }
          </select>
        </div>
        }
        {
          // stop click events to propagate to App
          // so that when user clicks inside color picker, the picker
          // won't be closed, (will be if user clicks outside)
        }
        <div className="colorPickerContainer" onClick={(e)=>e.stopPropagation()} >
          Highlight:
          <span className="colorSquared" onClick={this.toggleColorPicker.bind(this)} style={{backgroundColor:treeStore.highlightColor}}> </span>
          {treeStore.showColorPicker && <SketchPicker color={treeStore.highlightColor} className="colorPicker" onChangeComplete={this.handleColorChange.bind(this)}/>}
        </div>
        <TreeOfLife treeStore={treeStore}>
          {!!treeStore.nodeDetail && <NodeDetailContainer nodeDetail={treeStore.nodeDetail}></NodeDetailContainer>}
        </TreeOfLife>
        <LoadingBar isLoading={treeStore.isLoading}></LoadingBar>
        <div className="footNotes">
          *: only 1 genome from that taxonomic group
          <br/>
          [1234]: there are 1234 genomes in that group
          <br/>
          **: no corresponding taxonomy, uses a higher level taxonomy instead
        </div>
      </div>
      );
  }
};



