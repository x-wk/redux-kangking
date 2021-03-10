import {PayloadAction, ReduxStateProcessor, ReduxStateProcessorConfiguration} from './state-processor';

export type ProcessorOptions<S, D, T = D> = ReduxStateProcessorConfiguration<S, D, T> & {
   handleState?: (appState: S, prevState: D, payload: T) => void;
   isSupport?: (appState: S, sliceState: D, action: PayloadAction<T>) => boolean;
}

export type SliceStateResolver<S, D> = (appState: S) => D;

export function createSlice<S, D, T = D>(resolver: SliceStateResolver<S, D>) {
   if (!resolver || typeof resolver !== 'function') {
      throw new TypeError('必须指定一个函数');
   }

   const sliceStateResolver = resolver;
   const processors: Array<ReduxStateProcessor<S, D, T>> = [];

   return {
      addProcessor(options?: ProcessorOptions<S, D, T>) {
         const {isSupport, handleState, ...configs} = options || {};
         const InnerProcessor = class extends ReduxStateProcessor<S, D, T> {
            getSliceState(appState: S): D {
               return sliceStateResolver(appState);
            }

            protected isSupport(appState: S, sliceState: D, action: PayloadAction<T>): boolean {
               if (isSupport) {
                  // todo this绑定问题
                  return isSupport.call(this, appState, sliceState, action);
               }
               return super.isSupport(appState, sliceState, action);
            }

            protected handleState(appState: S, prevState: D, payload: T): void {
               handleState && handleState(appState, prevState, payload);
            }
         };

         processors.push(new InnerProcessor(configs));
         return this;
      },
      getProcessors() {
         return processors;
      }
   };
}
