import {applyMixins} from './utils';
import {PayloadAction, ReduxStateProcessor, ReduxStateProcessorConfiguration} from './state-processor';

export type SliceResolver<S, D> = (appState: S) => D;

export type SliceCreatorClass = { new(sliceResolver: SliceResolver<any, any>): BaseSliceCreator };

export class BaseSliceCreator {
   readonly getProcessors: () => Array<ReduxStateProcessor<any, any>>;
   readonly getLatest: (len: number) => ReduxStateProcessor<any, any>[];
   protected readonly registerProcessor: (processor: ReduxStateProcessor<any, any>) => void;

   constructor(protected sliceResolver: SliceResolver<any, any>) {
      const processors: Array<ReduxStateProcessor<any, any>> = [];
      this.registerProcessor = (processor: ReduxStateProcessor<any, any>) => {
         processors.push(processor);
      };

      this.getProcessors = () => {
         return processors;
      };

      this.getLatest = (len: number) => {
         return processors.slice(-1 * len);
      };
   }
}

export type SliceProcessorOptions<AT, ST, PT> = ReduxStateProcessorConfiguration<AT, ST, PT> & {
   handleState?: (appState: AT, prevState: ST, payload: PT) => void;
   isSupport?: (appState: AT, sliceState: ST, action: PayloadAction<PT>) => boolean;
}

export class DefaultSliceCreator extends BaseSliceCreator {
   addProcessor<AT, ST, PT>(processor?: SliceProcessorOptions<AT, ST, PT> | ReduxStateProcessor<AT, ST, PT>) {
      if (processor && processor instanceof ReduxStateProcessor) {
         this.registerProcessor(processor);
      } else {
         const sliceStateResolver = this.sliceResolver;
         const {isSupport, handleState, ...configs} = processor || {};
         const InnerStateProcessor = class extends ReduxStateProcessor<AT, ST, PT> {
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
         };

         this.registerProcessor(new InnerStateProcessor(configs));
      }
      return this;
   }
}

// todo 根据参数动态识别返回类型应该怎么写??
export function createSliceCreator<Ext extends DefaultSliceCreator = DefaultSliceCreator>(...extCtors: SliceCreatorClass[]):
   { <S, D>(r: SliceResolver<S, D>): Ext } {
   return <S, D>(resolver: SliceResolver<S, D>) => {
      if (typeof resolver !== 'function') {
         // 必须指定一个函数
         throw new TypeError('Expected the resolver to be a function.');
      }

      class SmartSliceCreator extends DefaultSliceCreator {
      }

      // 将扩展类混入
      applyMixins(SmartSliceCreator, extCtors);

      return new SmartSliceCreator(resolver) as Ext;
   };
}
