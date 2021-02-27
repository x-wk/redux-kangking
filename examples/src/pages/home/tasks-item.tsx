import React, {Component} from 'react';
import {connect} from 'react-redux';
import {completeTask} from './tasks.state';
import {Task} from '../../redux/state';
import {CreateActionFunc} from 'redux-kangking';

class TasksItem extends Component<Task & { doComplete: CreateActionFunc<string> }> {

   private completeTask: any = () => {
      if (!this.props.isCompleted && window.confirm('确认完成吗?')) {
         this.props.doComplete(this.props.id);
      }
   };

   render() {
      return (
         <div className="list-group-item list-group-item-action" onClick={this.completeTask}>
            <div className="d-flex w-100 justify-content-between">
               <h5 className="mb-1">{this.props.title}</h5>
               <small>{this.props.isCompleted ? '已完成' : '未完成'}</small>
            </div>
            <small className="text-muted">添加时间: {this.props.createdTime?.toLocaleTimeString()}</small>
            <small className="text-muted ml-3">完成时间: {this.props.updatedTime?.toLocaleTimeString()}</small>
         </div>
      );
   }
}

export default connect(() => ({}), {
   doComplete: completeTask.getActionCreator()
})(TasksItem);
