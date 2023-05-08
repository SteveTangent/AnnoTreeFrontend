import React, {PropTypes,Component} from 'react';
import './LoadingBar.less';

export default class LoadingBar extends Component{
  constructor(props) {
    super(props);
    
  }
  static proptypes = {
    isLoading: React.PropTypes.bool.isRequired,
  }
  render(){
    var size = this.props.size;
    var clsNames = {
      'sm':'sm'
    };
    var cls = clsNames[size];
    return (
        this.props.isLoading && <div className="tol-loading-bar-wrapper">
          <div className={'tol-loading-bar ' + cls}></div>
        </div>
      );
  }
};