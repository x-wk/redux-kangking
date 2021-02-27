import {Dispatch} from 'redux';
import {appStateManager, ReduxStateProcessor} from 'redux-kangking';
import AppState from '../../redux/state';

/**
 * IncrementProcessor 和 DecrementProcessor 共用一块状态, 所以提取一个父类
 * 如果有其它 'increment' 操作也可以继承 IncrementProcessor 实现逻辑复用, 如: IncrementAsyncProcessor
 * 如果搭配 redux-observable 或 redux-saga 甚至不需要修改 getActionCreator
 */
abstract class CounterProcessor extends ReduxStateProcessor<AppState, number> {
   getSliceState(appState: AppState): number {
      return appState.count || 0;
   }
}

class IncrementProcessor extends CounterProcessor {

   // 可以提供一个更有意义的actionType, 否则随机生成一个
   getActionName() {
      return 'increment';
   }

   // 更新状态
   protected handleState(appState: AppState, prevState: number, actionData: number): void {
      appState.count = prevState + actionData;
   }
}

class DecrementProcessor extends CounterProcessor {
   protected handleState(appState: AppState, prevState: number, actionData: number): void {
      appState.count = prevState - actionData;
   }
}

// 异步actionCreator
export class IncrementAsyncProcessor extends IncrementProcessor {
   getActionCreator(): any {
      return (data: number) => {
         return (dispatch: Dispatch) => {
            setTimeout(() => dispatch(super.getActionCreator()(data)), 1000);
         };
      };
   }
}

export const incrementProcessor = new IncrementProcessor();
export const decrementProcessor = new DecrementProcessor();
export const incrementAsyncProcessor = new IncrementAsyncProcessor();
appStateManager.addProcessor(incrementProcessor, decrementProcessor, incrementAsyncProcessor);
