import produce, {isDraft} from 'immer';
import {Action, Reducer} from 'redux';
import {padLeft} from './utils';

export interface PayloadAction<T = any> extends Action<string> {
   payload?: T
}

export type CreateActionFunc<T> = (payload: T) => PayloadAction<T>;

interface ReduxActionCreator<T> {
   /**
    * 返回一个函数, 用于创建action
    */
   getActionCreator(): CreateActionFunc<T>;
}

/**
 * S: app state shape
 * D: slice state shape
 * T: action data type
 */
abstract class ReduxStateHandler<S, D, T = D> {

   /**
    * 从应用状态中获取指定的 "部分状态", 如果未初始化可以返回默认状态
    * @param appState 应用状态
    */
   abstract getSliceState(appState: S): D;

   /**
    * 状态变更
    * 直接修改appState, 无需担心会改变原状态. 如: appState.count = 0
    * @param appState 可直接修改. 应用状态的副本集, 需要获取其它 "部分状态" 时很有用
    * @param sliceState 可直接修改. 本次操作执行前的状态
    * @param payload 操作数据
    * @protected
    */
   protected handleState(appState: S, sliceState: D, payload?: T): void {
      // do nothing
   }
}

interface ReduxStateProcessorManager<S, D, T = D> {
   /**
    * 添加状态处理器
    */
   addProcessor(processor: ReduxStateProcessor<S, D, T>): void;

   /**
    * 调度处理器处理状态
    * @param appState 应用状态
    * @param action 操作
    */
   processState(appState: S, action: PayloadAction<T>): S;
}

export interface ReduxStateProcessorConfiguration<S, D, T> {
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
   processorManager?: ReduxStateProcessorManager<S, D, T>;
}

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;
const parallelProcessors: WeakMap<any, Array<ReduxStateProcessor<any, any>>> = new PossiblyWeakMap();
const exclusiveProcessorMap: WeakMap<any, Map<any, ReduxStateProcessor<any, any>>> = new PossiblyWeakMap();

/**
 * 1. 无需特别设置即可实现按需加载, 启动速度更快
 * 2. 精准更新状态, 每派发一个 action 再不会执行所有的处理器
 *    (状态处理器分两类: a. 检查经过的所有action, b. 只处理特定的action)
 * 3. 利用 immer.js 实现 copy on write, 状态更新更自然, 再也不用担心误改状态了
 * 4. 跨切片状态共享
 * 5. 编码简单, 从此告别 action/reducer, 只关注状态转移
 * 6. (可选)基于 Rxjs 的中间件, 更轻松的管理异步副作用, 同样支持按需加载(无 root, 无 combine)
 * 更多特性正在完善中...
 */
export abstract class ReduxStateProcessor<S, D, T = D> extends ReduxStateHandler<S, D, T> implements ReduxActionCreator<T> {

   private static _cnt = 0;
   private readonly _initOrder: number;
   private readonly _actionName: string;
   private readonly _exclusive: boolean;
   private readonly _stateManager: ReduxStateProcessorManager<S, D, T>;
   private readonly _actionCreator = (payload: T) => ({type: this._actionName, payload});

   constructor(config?: ReduxStateProcessorConfiguration<S, D, T>) {
      super();
      // 初始化顺序
      this._initOrder = ReduxStateProcessor._cnt++;

      // 初始化关键属性
      const {
         actionName,
         exclusive = true,
         processorManager = appStateManager
      } = config || {};

      if (!(exclusive || actionName)) {
         // exclusive=false时会检查每个经过的action, 所以最好指定一个固定且唯一的名称, 避免某些场景中出现重复执行
         console.warn('the state processor is not exclusive, you should specify a \'actionName\' through the constructor,' +
            ' otherwise it may cause duplicate processing in some cases!');
      }

      this._exclusive = exclusive;
      this._stateManager = processorManager;
      this._actionName = actionName || `@@ACT#${padLeft(this._initOrder)}`;

      // 添加到管理器
      processorManager.addProcessor(this);
   }

   /**
    * 尽量避免覆盖此方法
    * 复杂应用可以搭配 redux-observable 或 redux-saga 使用
    */
   getActionCreator() {
      return this._actionCreator;
   }

   /**
    * 获取操作类型
    * 如果想提供一个更有意义的名称请通过构造函数(constructor)传递
    */
   get actionName() {
      return this._actionName;
   }

   private get exclusive() {
      return this._exclusive;
   }

   // private get stateManager() {
   //    return this._stateManager;
   // }

   /**
    * 默认根据 actionName 是否相等来判断是否支持
    * 子类可覆盖, 实现更复杂的逻辑判断
    */
   protected isSupport(appState: S, sliceState: D, action: PayloadAction<T>): boolean {
      const {type} = action;
      return type === this._actionName;
   }

   static AppStateManager = class AppStateManager<AT, ST, PT = ST> implements ReduxStateProcessorManager<AT, ST, PT> {
      constructor() {
         parallelProcessors.set(this, []);
         exclusiveProcessorMap.set(this, new Map<any, ReduxStateProcessor<AT, ST, PT>>());
      }

      /**
       * 添加处理器
       */
      addProcessor(processor: ReduxStateProcessor<AT, ST, PT>): void {
         if (processor.exclusive) {
            exclusiveProcessorMap.get(this)!.set(processor.actionName, processor);
         } else {
            const newProcessors = parallelProcessors.get(this)!.filter(p => p.actionName !== processor.actionName).concat(processor);
            parallelProcessors.set(this, newProcessors);
         }
      }

      processState(appState: AT, action: PayloadAction<PT>): AT {
         if (!isDraft(appState)) {
            console.warn('the given state is not a draft object, this may cause the original state to be modified.' +
               ' please use \'createReducer\' or create a mutable draft object as the state parameter!');
         }

         const {type, payload} = action;
         for (let p of parallelProcessors.get(this)!) {
            const sliceState = p.getSliceState(appState);
            if (p.isSupport(appState, sliceState, action)) {
               p.handleState(appState, sliceState, payload);
            }
         }

         const processor = exclusiveProcessorMap.get(this)!.get(type);
         if (processor) {
            const sliceState = processor.getSliceState(appState);
            if (processor.isSupport(appState, sliceState, action)) {
               processor.handleState(appState, sliceState, payload);
            }
         }

         return appState;
      }
   };
}

// 用于创建reducer
export function createReducer<S, D, T = D>(stateManager: ReduxStateProcessorManager<S, D, T>): Reducer<S> {
   return (appState: S = {} as any, action: PayloadAction<T>) => {
      return produce(appState, (draftState: S) => {
         stateManager.processState(draftState, action);
      });
   };
}

// default app stateManager
export const appStateManager = new ReduxStateProcessor.AppStateManager<any, any>();

// default app stateReducer
export const appStateReducer = createReducer(appStateManager);
