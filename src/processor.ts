import produce from 'immer';
import {AnyAction, Reducer} from 'redux';

// 数字前导0
function padLeft(num: number, size = 5): string {
   if (num >= Math.pow(10, size)) {
      return num.toString();
   }
   const _str = Array(size + 1).join('0') + num;
   return _str.slice(_str.length - size);
}

export interface CreateActionFunc<T> {
   (actionData: T): AnyAction;
}

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
abstract class ReduxStateHandler<S, D, T = any> {

   /**
    * 从应用状态中获取指定的 "部分状态", 如果未初始化可以返回默认状态
    * @param appState 应用状态
    */
   abstract getSliceState(appState: S): D;

   /**
    * 检查初始化状态, 如果返回: false , 后续会执行 initSliceState 方法
    * @param appState 应用状态
    * @protected
    */
   // protected initialized(appState: S): boolean {return !!this.getSliceState(appState);}

   /**
    * 设置初始状态
    * @param appState
    */

   // protected abstract initSliceState(appState: S): void;

   /**
    * 处理状态
    * 直接修改appState, 无需担心会改变原状态. 如: appState.count = 0
    * @param appState 可直接修改. 应用状态的副本集, 需要获取其它 "部分状态" 时很有用
    * @param prevState 可直接修改. 本次操作执行时的状态
    * @param actionData 操作数据
    * @protected
    */
   protected abstract handleState(appState: S, prevState: D, actionData: T): void;

}

interface ReduxStateProcessorManager<S> {
   /**
    * 添加处状态理器
    */
   addProcessor(...processors: Array<ReduxStateProcessor<S, any>>): void;

   /**
    * 返回第一个状态处理器
    */
   getProcessor(): ReduxStateProcessor<S, any>;
}

/**
 * 更多特性有待完善
 */
export abstract class ReduxStateProcessor<S, D, T = D> extends ReduxStateHandler<S, D, T> implements ReduxActionCreator<T> {

   private static _cnt = 0;
   private readonly _initOrder: number;
   private readonly _actionName: string;
   private _next: ReduxStateProcessor<S, any> | null = null;

   constructor() {
      super();
      this._initOrder = ReduxStateProcessor._cnt++;
      this._actionName = this.getActionName() || `@@ACT#${padLeft(this._initOrder)}`;
   }

   private set next(processor: ReduxStateProcessor<S, any>) {
      this._next = processor;
   }

   /**
    * 默认操作类型是一个随机字符串
    * 子类覆盖此方法可以提供一个更有意义的名称
    */
   getActionName(): string {
      return this._actionName;
   }

   /**
    * 子类可覆盖, 如搭配 redux-thunk 时返回一个函数型 Action
    */
   getActionCreator() {
      return (actionData: T) => ({type: this.getActionName(), actionData});
   }

   /**
    * 子类可覆盖, 实现更复杂的逻辑判断
    */
   protected isSupport(actionName: string): boolean {
      return this.getActionName() === actionName;
   }

   process(appState: S, action: AnyAction): S {

      // 执行初始化
      /*
            const initializedState = produce(appState, (draftState: S) => {
               if (this.initialized(draftState)) {
                  return false;
               }
               this.initSliceState(draftState);
            }) || appState;
      */

      // 执行状态变更
      const {type, actionData} = action;
      if (this.isSupport(type)) {
         return produce(appState, (draftState: S) => {
            this.handleState(draftState, this.getSliceState(draftState), actionData);
         });
      }

      // 传递给下一个处理器
      if (this._next) {
         return this._next.process(appState, action);
      }

      // AppStateManager必须兜底
      throw new Error('未配置应用状态处理器[AppStateProcessor]');
   }

   /**
    * APP状态管理器, 可以实例多个 Manager 实现处理器分组
    */
   static AppStateManager = class AppStateManager<S> extends ReduxStateProcessor<S, S> implements ReduxStateProcessorManager<S> {
      private _first: ReduxStateProcessor<S, any> = this;
      private _processors: Array<ReduxStateProcessor<S, any>> = [];

      /**
       * 添加处理器(遗憾没有依赖注入...)
       * @param processors
       */
      addProcessor(...processors: Array<ReduxStateProcessor<S, any>>): void {
         // actionName相同的去重
         const actionNames = this._processors.map(p => p.getActionName());
         const newProcessors = processors.filter(p => p && actionNames.indexOf(p.getActionName()) < 0);

         // 构造链
         if (newProcessors && newProcessors.length > 0) {
            this._processors.push(...newProcessors);
            newProcessors.forEach(p => {
               p.next = this._first;
               this._first = p;
            });
         }
      }

      getProcessor(): ReduxStateProcessor<S, any> {
         return this._first;
      }

      protected handleState(appState: S, prevState: any, actionData: any): void {
         // do nothing
      }

      getSliceState(appState: S): any {
         return appState;
      }

      process(appState: S, action: AnyAction): S {
         return appState;
      }
   };
}

// 用于创建reducer
export function createReducer<S>(stateManager: ReduxStateProcessorManager<S>): Reducer<S> {
   return (appState: S = {} as any, action: AnyAction) => {
      return stateManager.getProcessor().process(appState, action);
   };
}

// default app stateManager
export const appStateManager = new ReduxStateProcessor.AppStateManager<any>();

// default app stateReducer
export const appStateReducer = createReducer(appStateManager);
