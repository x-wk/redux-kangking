import React, {Component} from 'react';
import {connect} from 'react-redux';
import {CreateActionFunc} from 'redux-kangking';
import AppState from '../../redux/state';
import {decrementProcessor, incrementAsyncProcessor, incrementProcessor} from './counter.state';

interface CounterPropTypes {
   count: number;
   doIncrement: CreateActionFunc<number>,
   doDecrement: CreateActionFunc<number>,
   doIncrementAsync: CreateActionFunc<number>
}

class Counter extends Component<CounterPropTypes> {

   numberElement = React.createRef<HTMLSelectElement>();

   // 执行加法
   private increment = () => {
      const numberSelected = this.numberElement.current!.value;
      this.props.doIncrement(parseInt(numberSelected));
   };

   // 执行减法
   private decrement = () => {
      const numberSelected = this.numberElement.current!.value;
      this.props.doDecrement(parseInt(numberSelected));
   };

   // 延迟1秒再执行加法
   private incrementAsync = () => {
      const numberSelected = this.numberElement.current!.value;
      this.props.doIncrementAsync(parseInt(numberSelected));
   };

   render() {
      return (
         <div className="row">
            <div className="col-12">
               <h3>当前结果: {this.props.count}</h3>
            </div>
            <div className="col-12 d-flex justify-content-start">
               <select ref={this.numberElement} className="mr-2" style={{width: '150px'}}>
                  <option>1</option>
                  <option>2</option>
                  <option>3</option>
                  <option>4</option>
                  <option>5</option>
               </select>
               <button className="btn btn-outline-primary mr-2" onClick={this.increment}>加</button>
               <button className="btn btn-outline-primary mr-2" onClick={this.decrement}>减</button>
               <button className="btn btn-outline-primary mr-2" onClick={this.incrementAsync}>异步加</button>
            </div>
         </div>
      );
   }
}

export default connect(
   (state: AppState) => ({count: incrementProcessor.getSliceState(state)}),
   {
      doIncrement: incrementProcessor.getActionCreator(),
      doDecrement: decrementProcessor.getActionCreator(),
      doIncrementAsync: incrementAsyncProcessor.getActionCreator()
   }
)(Counter);
