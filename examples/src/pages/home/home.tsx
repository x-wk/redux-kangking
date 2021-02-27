import React, {Component} from 'react';
import {NavLink, Redirect, Route, Switch} from 'react-router-dom';
import Counter from './counter';
import Tasks from './tasks';

export class Home extends Component {
   render() {
      return (
         <div className="row">
            <div className="col-12" style={{textAlign: 'center'}}>
               <div className="btn-group">
                  <NavLink className="btn btn-info" to="/home/counter">计数器</NavLink>
                  <NavLink className="btn btn-info" to="/home/tasks">任务列表</NavLink>
               </div>
            </div>
            <div className="col-12 mt-3">
               <Switch>
                  <Route path="/home/counter" component={Counter}/>
                  <Route path="/home/tasks" component={Tasks}/>
                  <Redirect to="/home/counter"/>
               </Switch>
            </div>
         </div>
      );
   }
}
