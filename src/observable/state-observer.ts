import {Observable, Subject} from 'rxjs';
import {PayloadAction, ReduxStateProcessor, ReduxStateProcessorConfiguration} from '../state-processor';

export class ReduxStateObserverManager<S> {
   private _observer$ = new Subject<ReduxStateObserver<S, any>>();

   addObserver(observer: ReduxStateObserver<S, any>): void {
      this._observer$.next(observer);
   }

   get observer$() {
      return this._observer$.asObservable();
   }
}

export interface ReduxStateObserverConfiguration<S, D, T = D> extends ReduxStateProcessorConfiguration<S, D, T> {
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

export abstract class ReduxStateObserver<S, D, T = D> extends ReduxStateProcessor<S, D, T> {

   constructor(config: ReduxStateObserverConfiguration<S, D, T>) {
      if (!config.actionName) {
         // 必须指定一个固定且唯一的名称, 避免某些场景中出现重复订阅
         throw new TypeError(
            `You must specify a UNIQUE 'actionName' through the constructor,
             otherwise it may cause duplicate subscription in some cases!`
         );
      }

      super(config);

      // 注册观察者
      (config.observerManager || observerManager).addObserver(this);
   }

   abstract observe(action$: Observable<PayloadAction>, appState$: Observable<S>): Observable<T>;
}

// app default observerManager
export const observerManager = new ReduxStateObserverManager<any>();
