import {Dispatch, Middleware, MiddlewareAPI} from 'redux';
import {queueScheduler, Subject} from 'rxjs';
import {map, mergeMap, observeOn, subscribeOn, takeUntil} from 'rxjs/operators';
import {PayloadAction} from '../state-processor';
import {observerManager, ReduxStateObserverManager} from './state-observer';

export function createObservableMiddleware<S>(manager: ReduxStateObserverManager<S> = observerManager): Middleware<{}, S, Dispatch<any>> {

   let store: MiddlewareAPI<Dispatch<any>, S>;

   return (api: any) => {
      store = api;
      const stateSubject$ = new Subject<S>();
      const actionSubject$ = new Subject<PayloadAction<any>>();
      const state$ = stateSubject$.asObservable();
      const action$ = actionSubject$.asObservable();
      // 终结者
      const terminatorMap = new Map<string, Subject<any>>();

      const result$ = manager.observer$.pipe(
         mergeMap((observer) => {
            // 每个'observer'都对应一个终结者, 避免某些情况下可能出现的重复订阅
            // 所以'actionName'不能使用随机名称, 必须指定且唯一
            const actionName = observer.actionName;
            let terminator = terminatorMap.get(actionName);
            if (terminator) {
               terminator.next();
            } else {
               terminator = new Subject<any>();
               terminatorMap.set(actionName, terminator);
            }

            const payload$ = observer.observe(action$, state$);

            if (!payload$) {
               throw new TypeError(
                  `Your processor "${observer.actionName}" does not return a stream. Double check you\'re not missing a return statement!
                   If you don't want to be notified when 'action' occurs, you can use a normal processor.`
               );
            }

            // todo error handling
            return payload$.pipe(
               map(observer.getActionCreator()),
               takeUntil(terminator),
               subscribeOn(queueScheduler),
               observeOn(queueScheduler)
            );
         })
      );

      result$.subscribe(store.dispatch);

      return (next: Dispatch) => {
         return (action: any) => {
            const appState = store.getState();

            const result = next(action);

            const newAppState = store.getState();

            // 状态产生变化才发射
            if (newAppState !== appState) {
               stateSubject$.next(newAppState);
            }

            actionSubject$.next(action);

            return result;
         };
      };
   };
}
