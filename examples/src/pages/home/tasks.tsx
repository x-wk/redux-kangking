import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Task} from '../../redux/state';
import TasksHeader from './tasks-header';
import TasksItem from './tasks-item';
import {addTask} from './tasks.state';

class Tasks extends Component<{ tasks: Array<Task> }> {
   render() {
      return (
         <div className="row">
            <div className="col-12">
               <h3>任务数量: {this.props.tasks?.length}</h3>
            </div>
            <div className="col-12">
               <TasksHeader/>
            </div>
            <div className="col-12">
               <div className="list-group" title="点击完成" style={{cursor: 'pointer'}}>
                  {
                     this.props.tasks?.map(task => {
                        return <TasksItem key={task.id} {...task}/>;
                     })
                  }
               </div>
            </div>
         </div>
      );
   }
}

export default connect((state: any) => ({tasks: addTask.getSliceState(state)}))(Tasks);
