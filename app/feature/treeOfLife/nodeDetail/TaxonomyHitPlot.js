import React, {PropTypes,Component} from 'react';
import {findDOMNode} from 'react-dom';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap.css';

import './TaxonomyHitPlot.less';

export default class TaxonomyHitPlot extends Component{
  constructor(props) {
    super(props);
  }
  static proptypes = {
    hitDistribution: React.PropTypes.object.isRequired,
    width: React.PropTypes.number.isRequired,
    height:  React.PropTypes.number.isRequired,
  }
  render(){
    var {width,height,hitDistribution} = this.props;
    var {noHit,noInfo,hit} = hitDistribution;
    var total = noHit + noInfo + hit;
    // round hitPerct and noHitPerct to min 0.05, max 0.95 unless they are 0
    var hitPerct = (hit*1.0/total) && Math.min(0.95, Math.max(0.05, hit*1.0/total));
    var noHitPerct = (noHit * 1.0/total) && Math.min(0.95, Math.max(0.05, noHit*1.0/total));
    var noInfoPerct = noInfo*1.0/total;
    function getRect(rect, index){
      var {className, width, height, toolbarText, shiftRight, count} = rect;
      return ( width!==0 && 
        <Tooltip
        key={index}
        trigger={['hover']}
        overlayStyle={{ zIndex: 1000 }}
        overlay={toolbarText}
        placement="bottom"
        animation="zoom"
        >
          <div className={'rectangle '+className} 
          style={
            {
              'left':shiftRight+'px',
              width,
              height,
            }
          } key={0}>
            <span>{count}</span>
          </div>
        </Tooltip>
        );
    }


    var rectangles = [{
        className: 'hit',
        width: hitPerct * width,
        height: height,
        toolbarText: hit==1?'1 genome is hit':(hit+' genomes are hit'),
        shiftRight: 0,
        count: hit
      },{
        className: 'noHit',
        width: noHitPerct * width,
        height: height,
        toolbarText: noHit==1?'1 genome is not hit':(noHit+' genomes are not hit'),
        shiftRight: hitPerct * width,
        count: noHit
      },{
        className: 'noInfo',
        width: noInfoPerct * width,
        height: height,
        toolbarText: noInfo+' genomes are missing info',
        shiftRight: (noHitPerct + hitPerct) * width,
        count: noInfo
      }];
    return (
      <div className="taxonomyHitPlot text-center">
        <div style={{width,height}} className="plotContainer">
            {rectangles.map((rect,i)=>getRect(rect,i))}
        </div>
        <p>{total} genomes in total</p>
      </div>);
  }
}

