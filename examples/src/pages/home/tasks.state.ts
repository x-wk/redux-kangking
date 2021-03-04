import {ReduxStateProcessor} from 'redux-kangking';
import AppState, {Task} from '../../redux/state';
import {nanoid} from 'nanoid';

abstract class TaskProcessor extends ReduxStateProcessor<AppState, Array<Task>, string> {
   getSliceState(appState: AppState): Array<Task> {
      return appState.tasks || [{
         id: '001',
         title: '这是一个默认设定的任务',
         isCompleted: true,
         createdTime: new Date(),
         updatedTime: new Date()
      }];
   }
}

export class AddTask extends TaskProcessor {
   // 放心大胆的改吧, 这只是应用状态的副本
   protected handleState(appState: AppState, prevState: Task[] = [], actionData: string): void {
      prevState.push({
         id: nanoid(),
         title: actionData,
         isCompleted: false,
         createdTime: new Date()
      });

      // ************************************
      // ***** 同步应用状态, 这里一定要写 ******
      // ************************************
      appState.tasks = prevState;
   }
}

export class CompleteTask extends TaskProcessor {
   protected handleState(appState: AppState, prevState: Task[], actionData: string): void {
      const {tasks = []} = appState;
      tasks.filter(({id}) => id === actionData).forEach(task => {
         task.isCompleted = true;
         task.updatedTime = new Date();
      });
   }
}

export const addTask = new AddTask();
export const completeTask = new CompleteTask();
