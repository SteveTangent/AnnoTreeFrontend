import Dispatcher from './Dispatcher';
var assign = require('object-assign');
const VIEW_ACTION = 'VIEW_ACTION';
var AppDispatcher = assign({}, Dispatcher.prototype, {

  /**
   * A bridge function between the views and the dispatcher, marking the action
   * as a view action.  Another variant here could be handleServerAction.
   * @param  {object} action The data coming from the view.
   */
  handleViewAction: function(action) {
    this.dispatch({
      source: VIEW_ACTION,
      action: action
    });
  },
  registerViewActionHandler: function(handler){
    return this.register((payload)=>{
      if (payload.source !== VIEW_ACTION) return;
      handler(payload.action);
    });
  }
});

export default AppDispatcher;
