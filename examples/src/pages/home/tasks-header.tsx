import React, {Component, createRef} from 'react';
import {connect} from 'react-redux';
import {CreateActionFunc} from 'redux-kangking';
import {addTask} from './tasks.state';

export class TasksHeader extends Component<{ addTask: CreateActionFunc<string> }> {
   titleElement = createRef<HTMLInputElement>();

   addTask = () => {
      const title = this.titleElement.current!.value;
      if (title.trim() !== '') {
         this.props.addTask(title);
         this.titleElement.current!.value = '';
      }
   };

   render() {
      return (
         <div className="form-row">
            <div className="col">
               <div className="form-group">
                  <input ref={this.titleElement} type="text" className="form-control" placeholder="任务名称"/>
               </div>
            </div>
            <div className="col">
               <button className="btn btn-outline-primary" onClick={this.addTask}>添加任务</button>
            </div>
         </div>
      );
   }
}

export default connect(() => ({}), {addTask: addTask.getActionCreator()})(TasksHeader);
