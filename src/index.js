import React from "react";
import ReactDOM from "react-dom/client"; //from react-dom/client, not react
import './index.css';

class Square extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      value: null,
    };
  }
  render() {
    return (
      <button className="square" onClick={() =>
      this.setState({value: 'X'})}>
        {this.state.value}
      </button>
    );
  }
}

class Board extends React.Component {
  renderSquare(i) {
    return <Square value={i} />;
  }

  render() {
    const status = 'Next player: X';

    return (
      <div>
        <div className="status">{status}</div>
        <div className="board-row">
          {this.renderSquare(0)}
          {this.renderSquare(1)}
          {this.renderSquare(2)}
        </div>
        <div className="board-row">
          {this.renderSquare(3)}
          {this.renderSquare(4)}
          {this.renderSquare(5)}
        </div>
        <div className="board-row">
          {this.renderSquare(6)}
          {this.renderSquare(7)}
          {this.renderSquare(8)}
        </div>
      </div>
    );
  }
}

class Game extends React.Component {
  render() {
    return (
      <div className="game">
        <div className="game-board">
          <Board />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

//test stuff
class Osc extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      freq: 440,
      playing: false,
      context: null,
    };
    var filter = null;
    var oscillator = null;
  }
  init = () => {
    //init audioContext
    this.forceUpdate(()=> this.setState({context: new window.AudioContext}), () => {
      this.filter.init();
    });
  }
  play = () => {
    if(this.state.playing == false){
      this.setState({playing: true}, () => {
        //init oscillator
        this.oscillator = this.state.context.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(this.state.freq, 2);
        this.oscillator.connect(this.state.context.destination);
        this.oscillator.start();
      })
    }
  }
  updateFreq = (newFreq) => {
    /* arrow function declaration prevents scope of this keyword from being assigned to the
    function itself rather than the class it resides in. this always points to the class or 
    function it is contained within */
    this.setState({freq: newFreq}, () => {
      if(this.oscillator != null) this.oscillator.frequency.setValueAtTime(this.state.freq, 2);
    })
  }
  stop = () => {
    if(this.state.playing == true) {
      this.setState({playing: false}, () => this.oscillator.stop());
    }
  }
  render(){
    let filter; 
    let properties = {};
    if(this.state.context != null) 
    {
      properties.context = this.state.context;
      properties.oscillator = this.oscillator;
      filter = <Filter context = {properties.context} oscillator={properties.oscillator}/>
      this.filter = filter;
    }
    return (
      <div>
        <button className="key" onClick={ () => {
        if(this.state.context == null) this.init()
        if(this.state.context != null) this.play()  
       } }>Play</button>
       <button className="key" onClick={ () => {
         if(this.state.playing == true) this.stop()
       }}>Stop</button>
       <Slider sliderName = "Pitch" minVal = {0} maxVal = {1000} defaultVal = {440} callbackFn = {this.updateFreq} />
       {filter}
      </div>
    );
  }
}
class Slider extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      minVal: props.minVal,
      maxVal: props.maxVal,
      defaultVal: props.currentVal,
      sliderName: props.sliderName,
      callbackFn: function(value){
        props.callbackFn(value);
      },
    }
  }
  render = (props) => {
    return(
      <div className="freq_slider">
        <div>{this.state.sliderName}</div>
          <input type ="range" min={this.state.minVal} max={this.state.maxVal} defaultValue ={this.state.defaultVal} className="slider" id={this.state.sliderName} onChange={() =>{
            this.state.callbackFn(document.getElementById(this.props.sliderName).value);
          }}></input>
      </div>
    );
  }
}
class Sequencer extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      length: 4,
      currentStep: 0,
      rootFreq: 440,
    };
  }
  render(){
    return(
      <div>
        {/* sequencer code goes here */}
      </div>
    );
  }
}
class Filter extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      cutoff: 5000,
      resonance: 1,     //between 0.0001 and 1000
      mode: 'lowpass', //mode of filter i.e. lowpass, highpass, bandpass, etc.
      context: null,
      initialized: false,
    }
    const filter = 0;
    const oscillator = 0;
  }
  init = (props) => {
    this.setState({initialized: true, context: this.props.context}, () => {
      this.filter = this.state.context.createBiquadFilter();
      this.oscillator = this.props.oscillator;
      console.log('this thing: ', this.oscillator);
      this.filter.connect(this.state.context.destination);
      this.filter.type = this.state.mode;
      this.filter.frequency.setValueAtTime(this.state.cutoff, 1);
      this.filter.q = this.filter.resonance;
      console.log("filter initialized");
      console.log(this.filter);
      console.log(this.state.context.destination);
    })
  }
  updateCutoff = (freq) => {
    this.setState({cutoff: freq, context: this.props.context}, this.updateFilter());
  }
  updateResonance = (q) => {
    this.setState({resonance: q, context: this.props.context}, this.updateFilter());
  }
  updateFilter = () => {
    //context = new window.AudioContext();
    if(this.state.context != null){
      if(this.state.initialized != false){
        //this.filter.frequency = this.state.cutoff;
        this.filter.q = this.state.resonance;
        console.log("freq updated");
      }
      else this.init();
      
    } 
    else console.log("failed to load audioContext() in updateFilter()")
  }
  render(){
    return(
      <div>
        <Slider sliderName = "Cutoff" minVal={0} maxVal={20000} defaultVal={this.state.cutoff} callbackFn={this.updateCutoff}/>
        <Slider sliderName = "Resonance" minVal={1} maxVal={10} defaultVal={this.state.resonance} callbackFn={this.updateResonance}/>

      </div>
    );
  }

}
class Envelope extends React.Component {

}
//const mainOsc = new Osc()

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Osc />);

