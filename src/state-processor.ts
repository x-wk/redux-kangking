import produce, {isDraft} from 'immer';
import {Action, Reducer} from 'redux';

// 数字前导0
function padLeft(num: number, size = 5): string {
   if (num >= Math.pow(10, size)) {
      return num.toString();
   }
   const _str = Array(size + 1).join('0') + num;
   return _str.slice(_str.length - size);
}

export interface PayloadAction<T> extends Action<string> {
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
    * 处理状态
    * 直接修改appState, 无需担心会改变原状态. 如: appState.count = 0
    * @param appState 可直接修改. 应用状态的副本集, 需要获取其它 "部分状态" 时很有用
    * @param prevState 可直接修改. 本次操作执行时的状态
    * @param payload 操作数据
    * @protected
    */
   protected handleState(appState: S, prevState: D, payload?: T): void {
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

export interface ReduxStateProcessorConfiguration<S, D, T = D> {
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

/**
 * 更多特性有待完善
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

   static AppStateManager = class AppStateManager<AppState, SliceState, Payload = SliceState> implements ReduxStateProcessorManager<AppState, SliceState, Payload> {
      private _parallelProcessors: Array<ReduxStateProcessor<AppState, SliceState, Payload>> = [];
      private _exclusiveProcessorMap = new Map<any, ReduxStateProcessor<AppState, SliceState, Payload>>();

      /**
       * 添加处理器
       */
      addProcessor(processor: ReduxStateProcessor<AppState, SliceState, Payload>): void {
         if (processor.exclusive) {
            this._exclusiveProcessorMap.set(processor.actionName, processor);
         } else {
            this._parallelProcessors = this._parallelProcessors.filter(p => p.actionName !== processor.actionName).concat(processor);
         }
      }

      processState(appState: AppState, action: PayloadAction<Payload>): AppState {
         if (!isDraft(appState)) {
            console.warn('the given state is not a draft object, this may cause the original state to be modified.' +
               ' please use \'createReducer\' or create a mutable draft object as the state parameter!');
         }

         const {type, payload} = action;
         for (let p of this._parallelProcessors) {
            const sliceState = p.getSliceState(appState);
            if (p.isSupport(appState, sliceState, action)) {
               p.handleState(appState, sliceState, payload);
            }
         }

         const processor = this._exclusiveProcessorMap.get(type);
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