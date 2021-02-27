import {applyMiddleware, createStore} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {composeWithDevTools} from 'redux-devtools-extension';
import {appStateReducer} from 'redux-kangking';

export default createStore(appStateReducer, composeWithDevTools(applyMiddleware(thunkMiddleware)));
