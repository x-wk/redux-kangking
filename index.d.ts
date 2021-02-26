import { AnyAction, Reducer } from 'redux';
interface CreateActionFunc<T> {
    (actionData: T): AnyAction;
}
interface ReduxActionCreator<T> {
    getActionCreator(): CreateActionFunc<T>;
}
declare abstract class ReduxStateHandler<S, D, T> {
    abstract getSliceState(appState: S): D | undefined;
   //  initialized(appState: S): boolean;
   //  abstract initSliceState(appState: S): void;
   //  abstract handleState(appState: S, actionData: T): void;
}
interface ReduxStateProcessorManager<S> {
    addProcessor(...processors: Array<ReduxStateProcessor<S, any>>): void;
    getProcessor(): ReduxStateProcessor<S, any>;
}
export declare abstract class ReduxStateProcessor<S, D, T = D> extends ReduxStateHandler<S, D, T> implements ReduxActionCreator<T> {
   //  static _cnt: number;
   //  readonly _initOrder: number;
   //  readonly _actionName: string;
   //  _next: ReduxStateProcessor<S, any> | null;
    constructor();
   //  set next(processor: ReduxStateProcessor<S, any>);
    getActionName(): string;
    getActionCreator(): (actionData: T) => {
        type: string;
        actionData: T;
    };
   //  isSupport(actionName: string): boolean;
    process(appState: S, action: AnyAction): S;
    static AppStateManager: {
        new <S_1>(): {
            // _first: ReduxStateProcessor<S_1, any, any>;
            // _processors: ReduxStateProcessor<S_1, any, any>[];
            addProcessor(...processors: ReduxStateProcessor<S_1, any, any>[]): void;
            getProcessor(): ReduxStateProcessor<S_1, any, any>;
            // initialized(appState: S_1): boolean;
            // initSliceState(appState: S_1): void;
            // handleState(appState: S_1, actionData: any): void;
            getSliceState(appState: S_1): any | undefined;
            process(appState: S_1, action: AnyAction): S_1;
            // readonly _initOrder: number;
            // readonly _actionName: string;
            // _next: ReduxStateProcessor<S_1, any, any> | null;
            // next: ReduxStateProcessor<S_1, any, any>;
            getActionName(): string;
            getActionCreator(): (actionData: any) => {
                type: string;
                actionData: any;
            };
            // isSupport(actionName: string): boolean;
        };
      //   _cnt: number;
        AppStateManager: any;
    };
}
export declare function reducerCreator<S>(stateManager: ReduxStateProcessorManager<S>): Reducer<S>;
declare const appStateManager: {
   //  _first: ReduxStateProcessor<any, any, any>;
   //  _processors: ReduxStateProcessor<any, any, any>[];
    addProcessor(...processors: ReduxStateProcessor<any, any, any>[]): void;
    getProcessor(): ReduxStateProcessor<any, any, any>;
   //  initialized(appState: any): boolean;
   //  initSliceState(appState: any): void;
   //  handleState(appState: any, actionData: any): void;
    getSliceState(appState: any): any | undefined;
    process(appState: any, action: AnyAction): any;
   //  readonly _initOrder: number;
   //  readonly _actionName: string;
   //  _next: ReduxStateProcessor<any, any, any> | null;
   //  next: ReduxStateProcessor<any, any, any>;
    getActionName(): string;
    getActionCreator(): (actionData: any) => {
        type: string;
        actionData: any;
    };
   //  isSupport(actionName: string): boolean;
};
export declare const appStateReducer: Reducer<any, AnyAction>;
export default appStateManager;
