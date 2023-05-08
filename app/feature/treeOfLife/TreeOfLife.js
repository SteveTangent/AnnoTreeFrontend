import React, {PropTypes,Component} from 'react';
import TreeDrawer from './TreeDrawer';
import {findDOMNode} from 'react-dom';
import {autorun} from 'mobx';
import * as TreeConstant from './TreeConstant';
import AppDispatcher from 'dispatcher/AppDispatcher';

export default class TreeOfLife extends Component{
  constructor(props) {
    super(props);
  }
  static proptypes = {
    treeStore: React.PropTypes.object.isRequired,
  }
  render(){
    return (
      <div className="treeOfLife">
        {this.props.children}
      </div>
      );
  }

  componentDidMount(){
    var domNode = findDOMNode(this);
    var {treeStore} = this.props;
    var treeDrawer = new TreeDrawer({
      domNode:domNode,
      outerRadius: TreeConstant.OUTER_RADIUS,
      innerRadius: TreeConstant.INNER_RADIUS,
    });
    var createAction = function(typeConstant){
      return function (datum){
        AppDispatcher.handleViewAction({
          type: typeConstant,
          payload: datum
        });
      }
    }
    var events = [{
      target: 'label',
      type: 'click.general',
      callback: (datum)=>{
        // see https://github.com/d3/d3-3.x-api-reference/blob/master/Selections.md#d3_mouse
        var containerCoord = d3.mouse(domNode);
        AppDispatcher.handleViewAction({
          type: TreeConstant.TREE_LABEL_CLICKED,
          payload: {
            node: datum,
            containerCoord: containerCoord,
          }
        });
      },
    },{
      target: 'nodeInternal',
      type: 'click.general',
      callback: (datum)=>{
        // see https://github.com/d3/d3-3.x-api-reference/blob/master/Selections.md#d3_mouse
        var containerCoord = d3.mouse(domNode);
        AppDispatcher.handleViewAction({
          type: TreeConstant.TREE_INTERNAL_NODE_CLICKED,
          payload: {
            node: datum,
            containerCoord: containerCoord,
          }
        });
      },
    }];
    events.forEach((e)=>treeDrawer.bindEvent(e));
    autorun((()=>{
        var {treeStore} = this.props;
        var displayable = treeStore.displayable;
        treeDrawer.drawTree(displayable);
    }).bind(this));
  }
};



