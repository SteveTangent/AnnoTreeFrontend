import React, {PropTypes,Component} from 'react';
import DonutChartDrawer from './DonutChartDrawer';
import {findDOMNode} from 'react-dom';
import {autorun} from 'mobx';
import './DonutChart.less';
export default class DonutChart extends Component{
  constructor(props) {
    super(props);
  }
  static proptypes = {
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    data: React.PropTypes.array.isRequired,
  };
  render(){
    return (
      <div className="donutChart"></div>
      );
  }

  componentDidMount(){
    this.domNode = findDOMNode(this);
    var {width,height,data, sliceColorFn} = this.props;
    this.drawer = new DonutChartDrawer({domNode:this.domNode,width,height});
    this.drawer.draw(data, sliceColorFn);
  }
  componentDidUpdate(){
    var {width,height,data, sliceColorFn} = this.props; 
    this.drawer.draw(data, sliceColorFn);
  }
};



