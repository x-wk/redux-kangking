import {Observable} from 'rxjs';
import {ReduxStateObserver} from './state-observer';
import {PayloadAction} from '../state-processor';
import {BaseSliceCreator, SliceProcessorOptions} from '../state-processor-functional';

export type ObserverOptions<AT, ST, PT = ST> = SliceProcessorOptions<AT, ST, PT> & {
   /**
    * You must specify a 'actionName' through the constructor,
    * otherwise it may cause repeat subscription in some cases!
    */
   actionName: string;
   observe: (action$: Observable<PayloadAction>, appState$: Observable<AT>) => Observable<PT>;
}

export class ObservableSliceCreator extends BaseSliceCreator {
   addObserver<AT, ST, PT = ST>(observer: ObserverOptions<AT, ST, PT>) {
      const sliceStateResolver = this.sliceResolver;
      const {isSupport, handleState, observe, ...configs} = observer;
      const InnerStateObserver = class extends ReduxStateObserver<AT, ST, PT> {

         getSliceState(appState: AT): ST {
            return sliceStateResolver(appState);
         }

         protected isSupport(appState: AT, sliceState: ST, action: PayloadAction<PT>): boolean {
            if (isSupport) {
               // todo this绑定问题
               return isSupport.call(this, appState, sliceState, action);
            }
            return super.isSupport(appState, sliceState, action);
         }

         protected handleState(appState: AT, prevState: ST, payload: PT): void {
            handleState && handleState(appState, prevState, payload);
         }

         observe(action$: Observable<PayloadAction>, appState$: Observable<AT>): Observable<PT> {
            return observe(action$, appState$);
         }
      };

      this.registerProcessor(new InnerStateObserver(configs));
      return this;
   }
}
