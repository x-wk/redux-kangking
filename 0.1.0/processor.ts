import produce from 'immer';
import {AnyAction} from 'redux';

// 数字前导0
function preZeroFill(num: number, size = 5): string {
   if (num >= Math.pow(10, size)) {
      return num.toString();
   }
   const _str = Array(size + 1).join('0') + num;
   return _str.slice(_str.length - size);
}

interface CreateActionFunc<T> {
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
abstract class ReduxStateHandler<S, D, T> {

   /**
    * 从应用状态中获取指定 "部分" 状态(注: 勿返回默认值, 否则请根据情况重写 initialized 方法)
    * @param appState 应用状态
    */
   abstract getSliceState(appState: S): D | undefined;

   /**
    * 检查初始化状态, 如果返回: false , 后续会执行 initSliceState 方法
    * @param appState 应用状态
    * @protected
    */
   protected initialized(appState: S): boolean {
      return !!this.getSliceState(appState);
   }

   /**
    * 设置初始状态
    * @param appState
    */
   protected abstract initSliceState(appState: S): void;

   /**
    * 处理状态
    * 直接修改appState, 无需担心会改变原状态. 如: appState.count = 0
    * @param appState 应用状态的代理对象(注: 传递整个应用状态是否存在隐患还有待论证; 只传部分状态也非常简单)
    * @param actionData 操作数据
    * @protected
    */
   protected abstract handleState(appState: S, actionData: T): void;

}

export abstract class ReduxStateProcessor<S, D, T = D> extends ReduxStateHandler<S, D, T> implements ReduxActionCreator<T> {

   private static _cnt = 0;
   private readonly _initOrder: number;
   private readonly _actionName: string;
   private _next: ReduxStateProcessor<S, any> | null = null;

   constructor() {
      super();
      this._initOrder = ReduxStateProcessor._cnt++;
      this._actionName = this.getActionName() || `@@ACTION#${preZeroFill(this._initOrder)}`;
   }

   /**
    * @param {any} processor
    */
   set next(processor: ReduxStateProcessor<S, any>) {
      this._next = processor;
   }

   /**
    * 默认操作类型是一个随机字符串
    * 子类覆盖此方法可以提供一个更有意义的名称
    */
   protected getActionName(): string {
      return this._actionName;
   }

   // 子类可覆盖
   getActionCreator() {
      return (actionData: T) => ({type: this.getActionName(), actionData});
   }

   // 子类可覆盖
   protected isSupport(actionName: string): boolean {
      return this.getActionName() === actionName;
   }

   process(appState: S, action: AnyAction): S {

      // 执行初始化
      const initializedState = produce(appState, (draftState: S) => {
         if (this.initialized(draftState)) {
            return false;
         }
         this.initSliceState(draftState);
      }) || appState;

      // 执行状态变更
      const {type, actionData} = action;
      if (this.isSupport(type)) {
         return produce(appState, (draftState: S) => {
            this.handleState(draftState, actionData);
         });
      }

      // 传递给下一个处理器
      if (this._next) {
         return this._next.process(initializedState, action);
      }

      // 初始化处理器兜底, 否则提示错误
      throw new Error('未配置应用状态处理器[AppStateProcessor]');
   }

   /**
    * 兜底, 返回应用状态(all)
    */
   static AppStateProcessor = class AppStateProcessor<S> extends ReduxStateProcessor<S, any> {

      protected initialized(appState: S): boolean {
         return true;
      }

      protected initSliceState(appState: S): void {
         // do nothing
      }

      protected handleState(appState: S, actionData: any): void {
         // do nothing
      }

      getSliceState(appState: S): any | undefined {
         return appState;
      }

      process(appState: S, action: AnyAction): S {
         return appState;
      }
   };
}
