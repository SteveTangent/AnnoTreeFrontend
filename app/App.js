import React, { Component } from 'react';
import {render} from 'react-dom';

import {TreeContainer, TreeStore} from 'treeOfLife/';
import {QueryBoxContainer, QueryBoxStore} from 'queryBox';
import {SummaryBoxContainer, SummaryBoxStore} from 'summaryBox';

import AppDispatcher from './dispatcher/AppDispatcher';
import TreeActionHandler from './actionHandler/TreeActionHandler';
import QueryBoxActionHandler from './actionHandler/QueryBoxActionHandler'; 
import SummaryBoxActionHandler from './actionHandler/SummaryBoxActionHandler'; 

import * as AppConstant from './AppConstant';
import * as TreeConstant from 'treeOfLife/TreeConstant'
import * as QueryBoxConstant from 'queryBox/QueryBoxConstant';
import * as Config from './Config';
import DonutChart from 'DonutChart/';

/*Services*/
import QueryService from 'QueryService';
import TreeService from 'TreeService';

import 'style/';
import * as Util from 'util/';
import * as _ from 'lodash';
/*----------  store initialization  ----------*/

// tree store initialization

function initializeServices(){
  // error check
  if (!Config.SERVER_BASE_URL) throw 'SERVER_BASE_URL missing from Config';
  if (!Config.BACTERIAL_DATABASE) throw 'BACTERIAL_DATABASE missing from Config';
  if (!Config.ARCHAEAL_DATABASE) throw 'ARCHAEAL_DATABASE missing from Config';

  var queryService = new QueryService({
    baseUrl: Config.SERVER_BASE_URL,
  });
  var treeService = new TreeService({
    baseUrl: Config.SERVER_BASE_URL,
  });
  var services = {queryService, treeService};
  return Promise.resolve(services);
}

function initializeStores(services){
  // QueryBox store initialization
  var queryBoxStore = new QueryBoxStore();
  var summaryBoxStore = new SummaryBoxStore();
  var treeStore = new TreeStore();
  _.forEach(services, (svc)=>svc.setConfigStore(treeStore));
  var {treeService} = services;
  return treeService.getTrees()
    .then(function(trees){
      treeStore.setTrees(trees);
      return {queryBoxStore,summaryBoxStore, treeStore};
    });
}

/*----------  handler initialization  ----------*/

// make sure each handler is linked to stores and services
function initializeHandlers(stores,services, AppDispatcher){
  var handlers = [
    TreeActionHandler,
    QueryBoxActionHandler,
    SummaryBoxActionHandler].map((HandlerClass) => new HandlerClass({stores,services,AppDispatcher}));
  return Promise.resolve(handlers);
}

/*
  TODO, this bootstrapping performs dependency injection to each component
  There could be a better way of doing proper initialization and dependency injection
*/
function bootstrapApp(){
  initializeServices()
    .then(function(services){
      return initializeStores(services).then(function(stores){
        return {services,stores};
      });
    })
    .then(function(servicesAndStores){
      var services = servicesAndStores.services;
      var stores = servicesAndStores.stores;
      initializeHandlers(stores,services,AppDispatcher);
      // get query from url then auto run it
      var queryParams = Util.parseQuery();
      var qtype = queryParams['qtype'];
      delete queryParams['qtype'];
      var qstring = queryParams['qstring'];
      delete queryParams['qstring'];
      var queryBoxStore = stores.queryBoxStore;
      if (qtype && qstring && AppConstant.QUERY_BOX_OPTIONS[qtype]){
        queryBoxStore.selectedOption = qtype;
        queryBoxStore.query = qstring;
        var currentSearchOption = queryBoxStore.currentSearchOption;
        _.forEach(currentSearchOption, function(suboption){
          var name = suboption['fieldname'];
          suboption['value'] = queryParams[name] || suboption['value'];
        });
        AppDispatcher.handleViewAction({
          type: QueryBoxConstant.QUERY_SUBMITTED
        });
      }
      // whether or not to show news dot for current app version
      var showNewsDot = Config.HAS_NEWS && !Util.readCookie('news_read_'+AppConstant.VERSION);
      render(<App stores={stores} showNewsDot={showNewsDot}/>, document.getElementById('root'));
    });
}


// link stores and action handlers

class App extends Component {
  static proptypes = {
    stores: React.PropTypes.object.isRequired,
  }
  constructor(props) {
    super(props);
  }
  handleMouseUp(e){
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_NODE_DETAIL_ON_DRAG_END,
    });
  }
  componentWillMount(){
    this.setState({newsDotClicked: false});
  }
  /*
    Respond to drag event when moving nodeDetail box
    See NodeDetailContainer handleMoveState for more detail
  */
  handleMouseMoved(e){
    AppDispatcher.handleViewAction({
      type: TreeConstant.TREE_NODE_DETAIL_MOVED,
      payload: [e.nativeEvent.pageX,e.nativeEvent.pageY]
    });
  }
  handleNewsClicked(e){
    var cookieName = 'news_read_' + AppConstant.VERSION;
    if (Config.HAS_NEWS && !Util.readCookie(cookieName)){
      // create news_read cookie with value '1' that lasts 200 days
      Util.createCookie(cookieName, '1', 200);
    }
    this.setState({newsDotClicked: true});
  }
  render(){
    var {treeStore, summaryBoxStore, queryBoxStore} = this.props.stores;
    var newsDotClicked = this.state.newsDotClicked;
    return (
      <div onClick={(e)=>AppDispatcher.handleViewAction({
        type: AppConstant.APP_CLICKED,
        payload: e
      })}
      onMouseUp={(e)=>this.handleMouseUp(e)}
      onMouseMove={(e)=>this.handleMouseMoved(e)}>
        <header className="appHeader">
          <div className="row ">
            <div className="col-md-2">
              <div className="brand">
                <img src="annotree_tree_1_dark.png" alt="anno_tree_logo"/>
                ANNOTREE
              </div>
            </div>
            <div className="col-md-6">
              {
              <QueryBoxContainer queryBoxStore={queryBoxStore}></QueryBoxContainer>
              }
            </div>
            <div className="col-md-4">
              <ul className="actions">
                <li className="action-item" style={{'cursor':'initial'}} onClick={this.handleNewsClicked.bind(this)}>
                  <a href="./news.html" style={{'position':'relative'}} target="_blank">NEWS
                    {this.props.showNewsDot && (!newsDotClicked) && <span className='news-dot'> </span>}
                  </a>
                </li>
                <li className="action-item" style={{'cursor':'initial'}}>
                  <a href="./about.html" target="_blank">ABOUT</a>
                </li>
                <li className="action-item" style={{'cursor':'initial'}}>
                  <a href="./examples.html" target="_blank">EXAMPLES</a>
                </li>
                <li className="action-item" style={{'cursor':'initial'}}>
                  <a href="./downloads.html" target="_blank">DOWNLOADS</a>
                </li>
                <li className="action-item" style={{'cursor':'initial'}}>
                  <a href="./known_issues.html" target="_blank">ISSUES</a>
                </li>
              </ul>
            </div>
          </div>
        </header>
        <div className="row">
          <div className="col-lg-8">
            <TreeContainer treeStore={treeStore} queryBoxStore={queryBoxStore}></TreeContainer>
          </div>
          <div className="col-lg-4">
            <SummaryBoxContainer summaryBoxStore={summaryBoxStore} treeStore={treeStore}></SummaryBoxContainer>
          </div>
        </div>
        <footer className="appFooter">
          {/*AnnoTree {AppConstant.VERSION}; GTDB Bacteria {AppConstant.GTDB_BAC_VERSION}; GTDB Archaea {AppConstant.GTDB_AR_VERSION}; Pfam {AppConstant.PFAM_VERSION}; KEGG {AppConstant.KEGG_VERSION}; TIGRFAM {AppConstant.TIGRFAM_VERSION}*/}
          AnnoTree {AppConstant.VERSION}; GTDB Bacteria {AppConstant.GTDB_BAC_VERSION}; GTDB Archaea {AppConstant.GTDB_AR_VERSION}}
          <br />
          Built with <i className="fa fa-heart" style={{color: "#f06595"}}></i> by folks in Doxey Lab
          <br/>
          © Doxey Lab 2017-2024, University of Waterloo Department of Biology
        </footer>
      </div>
    );
    // note that {...{treeStore}} is same as using prop treeStore=treeStore
  }
};

bootstrapApp();

