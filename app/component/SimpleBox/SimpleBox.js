import React, {PropTypes,Component} from 'react';


export default class SimpleBox extends Component{
  constructor(props) {
    super(props);
    
  }
  static proptypes = {
    titleLeft: React.PropTypes.string,
    titleRight: React.PropTypes.string,
  }
  render(){
    var {titleLeft,titleRight,children} = this.props;
    return (
        <div className="simpleBox">
          <header className="simpleBox-header">
            <span className="title title-left">{titleLeft}</span>
            <span className="title title-right">{titleRight}</span>
          </header>
          <section className="simpleBox-body">
            {children}
          </section>
        </div>
      )
  }
}

