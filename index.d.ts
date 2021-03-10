declare module 'redux-kangking' {
   import {Action, Reducer} from 'redux';

   export declare interface PayloadAction extends Action {
      payload?: any
   }

   declare class ReduxStateProcessorManager<S> {
      addProcessor(processor: ReduxStateProcessor<S, any>): void;

      processState(appState: S, action: PayloadAction): S;
   }

   export declare interface ReduxStateProcessorConfiguration<S> {
      /**
       * it's better to specify a constant actionName when 'exclusive' is false,
       * because 'stateManager' judges uniqueness based on this name
       */
      actionName?: string;

      /**
       * if true, the processor returns immediately after 'handleState', otherwise it continues to execute other processors.
       */
      exclusive?: boolean;

      /**
       * if not specified(undefined), this processor will be added to into the default state manager(appStateManager)
       * you can pass other state manager as needed
       */
      stateManager?: ReduxStateProcessorManager<S>;
   }

   export declare type CreateActionFunc<T> = (payload: T) => PayloadAction;

   export declare abstract class ReduxStateProcessor<S, D, T = D> {
      /**
       * 状态管理器, 用法:
       * const appStateManager = new ReduxStateProcessor.AppStateManager<your state type>();
       */
      static AppStateManager: new<S>() => ReduxStateProcessorManager<S>;

      constructor(config?: ReduxStateProcessorConfiguration<S>);

      /**
       * 获取操作类型
       * 如果想提供一个更有意义的名称请通过构造函数(constructor)第一个参数传递
       */
      get actionName(): string;

      /**
       * 尽量避免覆盖此方法
       * 复杂应用可以搭配 redux-observable 或 redux-saga 使用
       */
      getActionCreator(): CreateActionFunc<T>;

      /**
       * 从应用状态中获取指定的 "部分状态", 如果未初始化可以返回默认状态
       * @param appState 应用状态
       */
      abstract getSliceState(appState: S): D;

      /**
       * 处理状态
       * 直接修改appState, 无需担心会改变原状态. 如: appState.count = 0
       * @param appState 可直接修改. 应用状态的副本集, 需要获取其它 "部分状态" 时很有用
       * @param prevState 可直接修改. 本次操作执行时的状态
       * @param payload 操作数据
       * @protected
       */
      protected handleState(appState: S, prevState: D, payload: T): void;

      /**
       * 默认根据 actionName 是否相等来判断是否支持
       * 子类可覆盖, 实现更复杂的逻辑判断
       */
      protected isSupport(appState: S, sliceState: D, action: PayloadAction): boolean;
   }

   /**
    * 用于创建顶层reducer
    * @param stateManager 内部维护了一组处理器, 负责协调状态处理
    */
   export declare function createReducer<S>(stateManager: ReduxStateProcessorManager<S>): Reducer<S>;

   ////////////////////////////// START FUNCTIONAL TYPES ////////////////////////////////

   export declare type SliceStateResolver<S, D> = (appState: S) => D;

   export declare type ProcessorOptions<S, D, T> =
      ReduxStateProcessorConfiguration<S> &
      {
         handleState?: (appState: S, prevState: D, payload: T) => void;
         isSupport?: (appState: S, sliceState: D, action: PayloadAction) => boolean;
      }

   export declare function createSlice<S, D, T = D>(resolver: SliceStateResolver<S, D>): {
      addProcessor(options?: (ProcessorOptions<S, D, T> | undefined)),
      getProcessors(): ReduxStateProcessor<S, D, T>[]
   };

   ////////////////////////////// END FUNCTIONAL TYPES ////////////////////////////////

   /**
    * 默认状态管理器
    */
   export declare const appStateManager: ReduxStateProcessorManager<any>;

   /**
    * 默认reducer
    */
   export declare const appStateReducer: Reducer;

}

declare module 'redux-kangking/observable' {
   import {Observable} from 'rxjs';
   import {Dispatch, Middleware} from 'redux';
   import {PayloadAction, ReduxStateProcessor, ReduxStateProcessorConfiguration} from 'redux-kangking';

   export declare class ReduxStateObserverManager<S> {
   }

   export declare interface ReduxStateObserverConfiguration<S> extends ReduxStateProcessorConfiguration<S> {
      /**
       * You must specify a 'actionName' through the constructor,
       * otherwise it may cause repeat subscription in some cases!
       */
      actionName: string;

      /**
       * if not specified(undefined), this observer will be added to into the default manager(observerManager)
       * you can pass other 'manager' as needed
       */
      observerManager?: ReduxStateObserverManager<S>;
   }

   export declare abstract class ReduxStateObserver<S, D, T = D> extends ReduxStateProcessor<S, D, T> {
      constructor(config: ReduxStateObserverConfiguration<S>);

      abstract observe(action$: Observable<PayloadAction>, appState$: Observable<S>): Observable<T>;
   }

   /**
    * 用于创建中间件
    * @param observerManager 提供注册观察者的流(observer stream)
    */
   export declare function createKangKingMiddleware<S>(observerManager?: ReduxStateObserverManager<S>): Middleware<{}, S, Dispatch<any>>;

   // app default observerManager
   export declare const observerManager: ReduxStateObserverManager<any>;
}
