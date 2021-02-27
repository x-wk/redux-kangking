import React, {Component} from 'react';
import {NavLink, Redirect, Route, Switch} from 'react-router-dom';
import {Header} from './pages/header';
import {Home} from './pages/home';
import {About} from './pages/about';

class App extends Component {
   render() {
      return (
         <div className="container" style={{padding: '32px 0'}}>
            <div className="row">
               <div className="col-12">
                  <Header/>
               </div>
               <div className="col-12">
                  <hr/>
               </div>
            </div>
            <div className="row">
               <div className="col-4">
                  <NavLink className="btn btn-light btn-lg btn-block" to="/home">HOME</NavLink>
                  <NavLink className="btn btn-light btn-lg btn-block" to="/about">About</NavLink>
               </div>
               <div className="col-8">
                  <Switch>
                     <Route path="/home" component={Home}/>
                     <Route path="/about" component={About}/>
                     <Redirect to="/home"/>
                  </Switch>
               </div>
            </div>
         </div>
      );
   }
}

export default App;
