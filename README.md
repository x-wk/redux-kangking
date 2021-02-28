# redux-kangking

***You don't need to write a reducer!***

***You don't need to pay attention to Immutable!***

***You don't even need to write an action!***

***Just focus on state transition.***

## Conception

1. state processor
   - handle slice state change
2. state manager
   - hold all processors
   - initialize the execution chain
   - re-establish execution chain at the right time (coming soon)

## Installation

```bash
npm install immer redux-kangking
```

## Example

**defining state types (non-essential)**

```ts
export default interface AppState {
   count?: number;
   tasks?: Array<Task>
}

export interface Task {
   id: string;
   title: string;
   isCompleted: boolean;
   createdTime?: Date;
   updatedTime?: Date;
}
```

**create redux store**

```ts
import {applyMiddleware, createStore} from 'redux';
import thunkMiddleware from 'redux-thunk';
import {composeWithDevTools} from 'redux-devtools-extension';
import {appStateReducer} from 'redux-kangking';

/**
 * import {createReducer, ReduxStateProcessor} from 'redux-kangking';
 *
 * // You can use 'appStateReducer' or create a new one like this:
 * const otherStateManager = new ReduxStateProcessor.AppStateManager<AppState>();
 * const otherStateReducer = createReducer(appStateManager);
 */

// 'appStateReducer' is a reducer created by 'redux-kangking' by default
export default createStore(appStateReducer, composeWithDevTools(applyMiddleware(thunkMiddleware)));
```

**create processor**

```ts
import {Dispatch} from 'redux';
import {appStateManager, ReduxStateProcessor} from 'redux-kangking';
import AppState from '../../redux/state';

/**
 * IncrementProcessor 和 DecrementProcessor 共用一块状态(shared slice state), 所以这里提取一个父类
 * 如果有其它 'increment' 操作也可以继承 IncrementProcessor 实现逻辑复用, 如: IncrementAsyncProcessor
 * 如果搭配 redux-observable 或 redux-saga 甚至不需要修改 getActionCreator
 */
abstract class CounterProcessor extends ReduxStateProcessor<AppState, number> {
   getSliceState(appState: AppState): number {
      return appState.count || 0;
   }
}

/**
 * handle increment action
 */
class IncrementProcessor extends CounterProcessor {
   // update state
   protected handleState(appState: AppState, prevState: number, actionData: number): void {
      appState.count = prevState + actionData;
   }
}

/**
 * handle decrement action
 */
class DecrementProcessor extends CounterProcessor {
   protected handleState(appState: AppState, prevState: number, actionData: number): void {
      appState.count = prevState - actionData;
   }
}

/**
 * with redux-thunk
 */
export class IncrementAsyncProcessor extends IncrementProcessor {
   getActionCreator(): any {
      return (data: number) => {
         return (dispatch: Dispatch) => {
            setTimeout(() => dispatch(super.getActionCreator()(data)), 1000);
         };
      };
   }
}

// identifiable actionType
export const incrementProcessor = new IncrementProcessor("incrment");
export const decrementProcessor = new DecrementProcessor();
export const incrementAsyncProcessor = new IncrementAsyncProcessor();
// necessary steps 
appStateManager.addProcessor(incrementProcessor, decrementProcessor, incrementAsyncProcessor);
```

**use processor**

```typescript jsx
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {CreateActionFunc} from 'redux-kangking';
import AppState from '../../redux/state';
import {decrementProcessor, incrementAsyncProcessor, incrementProcessor} from './counter.state';

interface CounterPropTypes {
   count: number;
   doIncrement: CreateActionFunc<number>,
   doDecrement: CreateActionFunc<number>,
   doIncrementAsync: CreateActionFunc<number>
}

class Counter extends Component<CounterPropTypes> {

   numberElement = React.createRef<HTMLSelectElement>();

   private increment = () => {
      const numberSelected = this.numberElement.current!.value;
      this.props.doIncrement(parseInt(numberSelected));
   };

   private decrement = () => {
      const numberSelected = this.numberElement.current!.value;
      this.props.doDecrement(parseInt(numberSelected));
   };

   private incrementAsync = () => {
      const numberSelected = this.numberElement.current!.value;
      this.props.doIncrementAsync(parseInt(numberSelected));
   };

   render() {
      return (
         <div className="row">
            <div className="col-12">
               <h3>当前结果: {this.props.count}</h3>
            </div>
            <div className="col-12 d-flex justify-content-start">
               <select ref={this.numberElement} className="mr-2" style={{width: '150px'}}>
                  <option>1</option>
                  <option>2</option>
               </select>
               <button className="btn btn-outline-primary mr-2" onClick={this.increment}>加</button>
               <button className="btn btn-outline-primary mr-2" onClick={this.decrement}>减</button>
               <button className="btn btn-outline-primary mr-2" onClick={this.incrementAsync}>异步加</button>
            </div>
         </div>
      );
   }
}

// with react-redux
export default connect(
   (state: AppState) => ({count: incrementProcessor.getSliceState(state)}),
   {
      doIncrement: incrementProcessor.getActionCreator(),
      doDecrement: decrementProcessor.getActionCreator(),
      doIncrementAsync: incrementAsyncProcessor.getActionCreator()
   }
)(Counter);
```

[Complete Example](https://github.com/x-wk/redux-kangking/tree/main/examples)

***Less is More, haha😊***

## License

[MIT](https://github.com/x-wk/redux-kangking/blob/main/LICENSE.md)
