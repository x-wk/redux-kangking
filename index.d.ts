import {AnyAction, Reducer} from 'redux';

export declare type CreateActionFunc<T> = (payload: T) => AnyAction;

declare class ReduxStateProcessorManager<S> {
   /**
    * 添加处状态理器
    */
   addProcessor(...processors: Array<ReduxStateProcessor<S, any>>): void;

   /**
    * 返回第一个状态处理器
    */
   getProcessor(): ReduxStateProcessor<S, any>;
}

export declare class ReduxStateProcessor<S, D, T = D> {
   /**
    * 状态管理器, 用法:
    * const appStateManager = new ReduxStateProcessor.AppStateManager<your state type>();
    */
   static AppStateManager: new<S>() => ReduxStateProcessorManager<S>;

   constructor(actionName?: string);

   /**
    * 获取操作类型
    * 如果想提供一个更有意义的名称请通过构造函数(constructor)第一个参数传递, 否则无效
    */
   getActionName(): string;

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
   protected abstract handleState(appState: S, prevState: D, payload: T): void;

   /**
    * 默认根据 actionName 是否相等来判断是否支持
    * 子类可覆盖, 实现更复杂的逻辑判断
    */
   protected isSupport(appState: S, sliceState: D, action: AnyAction): boolean;
}

/**
 * 用于创建顶层reducer
 * @param stateManager 状态管理器, 内部维护了一个 processor 执行链
 */
export declare function createReducer<S>(stateManager: ReduxStateProcessorManager<S>): Reducer<S>;

/**
 * 默认状态管理器
 */
export declare const appStateManager: ReduxStateProcessor.AppStateManager<any>;

/**
 * 默认reducer
 */
export declare const appStateReducer: Reducer;
