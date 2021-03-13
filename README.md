# redux-kangking

## Features

- Super easy to use.
- Achieve lazy loading without special settings.
- Accurately update the state, and each action will not be handled by all processors.
- Automatically uses the [`immer` library](https://github.com/immerjs/immer) to let you write simpler immutable updates
  with normal mutative code, like `appState.tasks[1].completed = true`.
- Sharing slice state without special settings.
- (Optional) Rxjs-based middleware, easier to manage asynchronous side effects, and also supports lazy loading (no root,
  no combine).

***Because the responsibility of updating the state has been decoupled from `reducer`, there are more features to
explore***

## Conception

1. state processor
   - Extracts slice state
     `processor.getSliceState(appState)`
   - Provides action creator
     `processor.getActionCreator()`
   - Makes a decision
     `processor.isSupport(appState, sliceState action)`
   - Handles slice state change
     `processor.handleState(appState, sliceState, payload)`

> The good news is that these methods have default implementations except for the first one

## Installation

```bash
npm install immer redux-kangking
```

## How to use

*Just two steps*

**Step1. create redux store**

```ts
import {applyMiddleware, createStore} from 'redux';
import {appStateReducer, createSliceCreator} from 'redux-kangking';

// createSlice is a function
// this code can be omitted when only using class 
export const createSlice = createSliceCreator();

export default createStore(appStateReducer);
```

**Step2. create processor**

There are two ways to create a processor:

- function call the `createSlice` created above
- inherit the abstract class `ReduxStateProcessor`

*Choose one according to your preference. Of course, the two can also coexist.*

```ts
import {ReduxStateProcessor} from 'redux-kangking';
import {createSlice} from '../../redux/store';

///////////////////////// function call ///////////////////////////////////////

const [incrementProcessor, decrementProcessor] = createSlice((appState: AppState) => {
   return appState.count || 0;
})
   // onIncrement
   .addProcessor({
      handleState(appState: AppState, prevState: number, payload: number): void {
         appState.count = prevState + payload;
      }
   })
   // onDecrement
   .addProcessor({
      handleState(appState: AppState, prevState: number, payload: number): void {
         appState.count = prevState - payload;
      }
   })
   .getProcessors();

///////////////////////// or inherit ReduxStateProcessor ///////////////////////////////////////

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

// you can provide an identifiable actionName
// export const incrementProcessor = new IncrementProcessor({actionName: 'increment', exclusive: true});
// export const decrementProcessor = new DecrementProcessor();
export {incrementProcessor, decrementProcessor};
```

**use in component**

just a general container component

```typescript jsx
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {incrementProcessor, decrementProcessor} from './counter.state';

class Counter extends Component<any> {

   private increment = () => {
      this.props.doIncrement(1);
   };

   private decrement = () => {
      this.props.doDecrement(1);
   };

   render() {
      return (
         <div>
            <h3>Current: {this.props.count}</h3>
            <button onClick={this.increment}>&nbsp;+&nbsp;</button>
            <button onClick={this.decrement}>&nbsp;-&nbsp;</button>
         </div>
      );
   }
}

// with react-redux
export default connect(
   (state: AppState) => ({count: incrementProcessor.getSliceState(state)}),
   {
      doIncrement: incrementProcessor.getActionCreator(),
      doDecrement: decrementProcessor.getActionCreator()
   }
)(Counter);
```

## Middleware

This middleware is optional, you can also choose other middlewares.

**Step1. create middleware**

```ts
import {applyMiddleware, createStore} from 'redux';
import {appStateReducer, createSliceCreator, DefaultSliceCreator} from 'redux-kangking';
import {createObservableMiddleware, ObservableSliceCreator, ObserverOptions} from 'redux-kangking/observable';

// 支持异步的中间件(rxjs/observable)
const middleware = createObservableMiddleware();

// 这个接口仅用于编码时开发工具的提示, 无其它用途
// This interface is only used for IDE hints when coding, and has no other purpose
interface MySliceCreator extends DefaultSliceCreator {
   addObserver<S, D, T>(observer: ObserverOptions<S, D, T>): this;
}

// 默认只能创建普通的Processor
// ObservableSliceCreator是一个扩展类, 用于创建Observer
// 支持多个自定义扩展类
// Only ordinary Processors can be created by default
// ObservableSliceCreator is an extended class that supports the creation of Observer.
// Support multiple custom extension classes 
export const createSlice = createSliceCreator<MySliceCreator>(ObservableSliceCreator);

export default createStore(appStateReducer, applyMiddleware(middleware));
```

> Note: import {createObservableMiddleware} from 'redux-kangking/observable';

**Step2. create observer**

There are two ways to create a observer:

- function call the `createSlice` created above
- inherit the abstract class `ReduxStateObserver`

*Choose one according to your preference. Of course, the two can also coexist.*

```ts
import {ReduxStateObserver} from 'redux-kangking/observable';
import {createSlice} from '../../redux/store';

///////////////////////// function call ///////////////////////////////////////

const [incrementAsyncProcessor, decrementProcessor, incrementProcessor] =
   createSlice((appState: AppState) => {
      return appState.count || 0;
   })
      .addProcessor()
      .addProcessor()
      .addObserver({
         actionName: 'increment',
         // 处理状态
         handleState(appState: AppState, prevState: number, payload: number) {
            appState.count = prevState + payload;
         },
         // 监听并响应感兴趣的 Action , 返回值(流)会触发新的Action以改变自身的状态
         observe(action$: Observable<PayloadAction<number>>, state$: Observable<AppState>): Observable<number> {
            return action$.pipe(
               filter(({type}) => type === incrementAsyncProcessor.actionName || type === decrementProcessor.actionName),
               mergeMap(({type, payload}) => {
                  if (type === decrement.actionName) {
                     // 减法
                     return of(-1 * payload!);
                  }
                  // 延迟加法
                  return of(payload!).pipe(delay(1000));
               })
            );
         }
      })
      .getProcessors();

///////////////////////// or inherit ReduxStateObserver ///////////////////////////////////////

class CounterObserver extends ReduxStateObserver<AppState, number> {

   getSliceState(appState: AppState): number {
      return appState.count || 0;
   }

   // 更新状态
   protected handleState(appState: AppState, prevState: number, actionData: number): void {
      appState.count = prevState + actionData;
   }

   observe(action$: Observable<PayloadAction<any>>, appState$: Observable<AppState>): Observable<number> {
      return action$.pipe(
         filter(({type}) => type === incrementAsync.actionName || type === decrement.actionName),
         mergeMap(({type, payload}) => {
            if (type === decrement.actionName) {
               return of(-1 * payload);
            } else {
               return of(payload).pipe(delay(1000));
            }
         })
      );
   }
}

// export const incrementProcessor = new CounterObserver({actionName: 'increment'});
export {incrementProcessor, decrementProcessor, incrementAsyncProcessor};
```

> Note: `Observer` is also a `Processor`, but with an additional `observe` method.

**use in component**

just a general container component

[More Examples](https://github.com/x-wk/redux-kangking-examples)

***Less is More, haha😊***

## License

[MIT](https://github.com/x-wk/redux-kangking/blob/main/LICENSE.md)
