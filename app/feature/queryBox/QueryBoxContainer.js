import React, {PropTypes,Component} from 'react';
import {observer} from "mobx-react";
// import QueryBoxView from './QueryBoxView';
import * as QueryBoxConstant from './QueryBoxConstant';
import * as AppConstant from 'AppConstant';
import AppDispatcher from 'dispatcher/AppDispatcher';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';
import './QueryBox.less';

@observer
export default class QueryBoxContainer extends Component{
  static proptypes = {
    queryBoxStore: React.PropTypes.object.isRequired,
  };
  constructor(props) {
    super(props);
    this.queryBoxStore = props.queryBoxStore;
  
    this.state = {isOpen:false}

    this.onTileClick = this.onTileClick.bind(this)
    this.handleOptionChanged = this.handleOptionChanged.bind(this)


  }
  handleOptionChanged(e, searchType){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: QueryBoxConstant.QUERY_OPTION_CHANGED,
      payload: searchType
    });


    // add height change
    var content = document.getElementById("content");
    if(this.state.isOpen && this.queryBoxStore.selectedOption === AppConstant.SEARCH_KEGG){
      content.style.height = '110px'
    }
    else if(this.state.isOpen && (this.queryBoxStore.selectedOption === AppConstant.SEARCH_TIGRFAM ||
        this.queryBoxStore.selectedOption === AppConstant.SEARCH_PFAM)){
      content.style.height = '40px'
    }
    else if(this.state.isOpen && this.queryBoxStore.selectedOption === AppConstant.SEARCH_TAX){
      content.style.height = '0px'
    }

    // *************************************
  }

  handleOpenOption(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: QueryBoxConstant.QUERY_OPTION_OPENED,
      payload: null
    });
  }
  handleQueryTextChange(e){
    e.stopPropagation();
    var newQueryText = e.target.value;
    AppDispatcher.handleViewAction({
      type: QueryBoxConstant.QUERY_TEXT_CHANGED,
      payload: newQueryText,
    });
  }
  handleSuggestionClicked(e,suggestion){
    e.stopPropagation();
    AppDispatcher.handleViewAction({

      type: QueryBoxConstant.QUERY_SUGGESTION_CLICKED,
      payload: suggestion,
    });
    if(this.queryInput) this.queryInput.focus();
  }
  handleQueryKeyDown(e){
    if (e.keyCode === 13){
      AppDispatcher.handleViewAction({
        type: QueryBoxConstant.QUERY_SUBMITTED,
      });
    }
  }
  handleQueryGoClick(e){
    e.stopPropagation();
    AppDispatcher.handleViewAction({
      type: QueryBoxConstant.QUERY_SUBMITTED,
    });
  }
  handleFileUpload(e){
    e.stopPropagation();
    var files = e.target.files;
    AppDispatcher.handleViewAction({
      type: QueryBoxConstant.FILE_UPLOADED,
      payload: files,
    });
    // clear file input
    this.refs.fileInput.value = null;
  }
  triggerUpload(e){
    this.refs.fileInput.click();
  }
  handleSearchOptionValueChanged(e, searchOption){
    e.stopPropagation();
    var newVal = e.target.value
    if (newVal!=='' && newVal !==0 && !newVal) newVal = searchOption.defaultVal;
    searchOption.value = newVal;
  }

  onTileClick(e){
    e.stopPropagation();
    var content = document.getElementById("content");
    this.setState((state, props) => ({
      isOpen : !state.isOpen
    }));

    if(this.queryBoxStore.selectedOption === AppConstant.SEARCH_KEGG){

      //content.style.height = content.offsetHeight===120?0+'px':120+'px';
      if(this.state.isOpen){
        content.style.height = '0px'
      }
      else{
        content.style.height = '110px'

      }
    }
    else if(this.queryBoxStore.selectedOption === AppConstant.SEARCH_TIGRFAM ||
        this.queryBoxStore.selectedOption === AppConstant.SEARCH_PFAM){
      //content.style.height = content.offsetHeight===110?0+'px':110+'px';
      if(this.state.isOpen){
        content.style.height = '0px'
      }
      else{
        content.style.height = '40px'
      }
    }

  }

  render(){
    var {selectedOption,
      optionsShown,
      options,
      currentSearchOption,
      suggestions,
      query,
      warning} = this.queryBoxStore;
    var selectedObj = AppConstant.QUERY_BOX_OPTIONS[selectedOption];

    var self = this;
    return (
        <div className='queryBoxContainer' onKeyDown={this.handleQueryKeyDown}>
          <div className="">
            <div className='optionContainer'>
              <button className='optionButton' onClick={this.handleOpenOption}> {selectedObj.displayText}
                &nbsp; <span className="fa fa-chevron-down"></span>
              </button>
              {optionsShown && <ul className="optionList">
                            {
                              _.chain(options)
                              .map(function(o, type){
                                return {
                                  'type': type,
                                  'displayText':o.displayText,
                                }
                              })
                              .filter((o)=>o.type!==selectedOption)
                              .map((o)=>
                                (<li className="optionItem" key={o.type} onClick={(e)=>self.handleOptionChanged(e,o.type)}>
                                  {o.displayText}</li>))
                              .value()
                            } 
                          </ul>}
            </div>
            <div className="inputContainer">
              <input value={query} type="text"
                className="input"
                onChange={this.handleQueryTextChange}
                placeholder={selectedObj.placeholder}
                ref={(input) => { this.queryInput = input; }}
                />
              <button className="goButton fa fa-search" onClick={(e)=>this.handleQueryGoClick(e)}>
              </button>
              {warning && 
                <span className="warningContainer">
                  <Tooltip
                    animation="zoom"
                    trigger={['hover']}
                    overlayStyle={{ zIndex: 1000 }}
                    overlay={<span>{warning.message}</span>}
                  >
                  <i className="fa fa-warning"></i>
                  </Tooltip>
                </span>}
              {suggestions.length > 0 && <div className="autocompleteContainer">
                {suggestions.map((s,index)=>
                  (<div className="row suggestionEntry" key={index} onClick={(e)=>this.handleSuggestionClicked(e,s)}>
                    <div className="col-xs-9">{s.detail}
                    </div>
                    <div className="col-xs-3 text-right">{s.displayText}
                    </div>
                  </div>))
                }
              </div>}
            </div>

            {currentSearchOption.length !== 0 &&
              // <div className='AdvancedContainer'>
              //   <button className='AdvancedButton' onClick={this.onTileClick}> Advanced
              //   </button>
              // </div>

                // no advanced option for r214
                <div className='AdvancedPlaceHolder'>
                  <div className='AdvancedDiv'>
                  </div>
                </div>
            }


            <input type='file'
                    ref='fileInput'
                    onChange={this.handleFileUpload.bind(this)}
                    accept='.xml,.csv'
                    className='fileUploader'/>

            {// display the file uploader only if taxonomy is selected
                selectedOption === AppConstant.SEARCH_TAX &&
                <div className='uploadContainer'>
                  <button className='uploadButton' onClick={this.triggerUpload.bind(this)}> BLAST CSV
                  </button>
                </div>
            }

            {/*{*/}
            {/*  currentSearchOption.length && <span className={"advancedOptions"}*/}
            {/*                                      onClick={this.onTileClick}>Advanced</span>}*/}
            {/*}*/}

	    { currentSearchOption &&
              <div className="col-sm-12 search-option-container" id="content" style={{height:"0px"}}>
                {this.state.isOpen && currentSearchOption.map((option,index)=>
                  (<div className="row" key={index}>
                    <div className="col-sm-8">
                      <label className="search-option-label">{option.displayName} ({(option.name==='eval'?'max ':'min ') + option.defaultVal})</label>
                    </div>
                    <div className="col-sm-2">
                      <input type="text" className="search-option-value" onChange={(e)=>self.handleSearchOptionValueChanged(e, option)} value={option.value}></input>
                    </div>
                  </div>))}
              </div>
            }
          </div>
        </div>
      );
  }
};
