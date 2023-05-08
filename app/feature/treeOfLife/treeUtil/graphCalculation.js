
import * as util from '../../../util/';

/*
  src and target are objects with attributes x and y
  returns a string that is the svg path definition of a line from src to target
*/
export function lineTo(src,target){
    var scoord = project(src.x,src.y),tcoord=project(target.x,target.y);
    var sx = scoord[0],sy=scoord[1],tx=tcoord[0],ty=tcoord[1];
    return util.formatStr('M {0},{1} L {2},{3}',sx,sy,tx,ty);
}



// Like d3.svg.diagonal.radial, but with square corners.
export function step(startAngle, startRadius, endAngle, endRadius) {
  var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI),
      s0 = Math.sin(startAngle),
      c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI),
      s1 = Math.sin(endAngle);
  return "M" + startRadius * c0 + "," + startRadius * s0
      + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
      + "L" + endRadius * c1 + "," + endRadius * s1;
}
export function project(x,y){
  var r = y, angle = (x-90)/180 * Math.PI;
  return [r*Math.cos(angle),r*Math.sin(angle)];
}

