export default class ViewActionHandler{
  constructor(props){
    var {stores,AppDispatcher,services} = props;
    this.stores = stores;
    this.services = services;
    AppDispatcher.registerViewActionHandler(this.handleAction.bind(this));
  }

  // default impl
  handleAction(){
    console.log('warning, default impl used');
    return;
  }
};





