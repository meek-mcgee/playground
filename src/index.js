import React from "react";
import ReactDOM from "react-dom/client"; //from react-dom/client, not react
import './index.css';

//test stuff
class Osc extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      rootFreq: 440,
      currentFreq: 440,
      playing: false,
      context: props.context,
      initialized: false,
    };
    var filter = null;
    var oscillator = null;
  }
  init = () => {
    //init audioContext
    this.setState({initialized: true});
    this.oscillator = this.state.context.createOscillator();
    this.oscillator.type = 'square';
    this.oscillator.frequency.setValueAtTime(this.state.rootFreq, 2);
    this.play();
  }
  play = () => {
    if(this.state.playing == false) this.oscillator.start();
  }
  updateRootFreq = (newFreq) => {
    //For pitch adjustment purposes -- do not use with sequencer class
    this.setState({rootFreq: newFreq}, () => this.updateFreq(newFreq));
  }
  updateFreq = (newFreq) => {
    //For sequencing purposes
    this.setState({currentFreq: newFreq}, () => {
      if(this.oscillator != null) this.oscillator.frequency.value = this.state.currentFreq;
    })
    return this.state.rootFreq;
  }
  stop = () => {
    if(this.state.playing == true) {
      this.setState({playing: false}, () => this.oscillator.stop());
    }
  }
  render(){
    return (
      <div className="mainDiv">
        <button className="key" onClick={ () => {
        this.state.context.resume();
        if(this.state.initialized == false){
          this.init();
        }
        else this.play();
       } }>Play</button>
       <button className="key" onClick={ () => {
         this.state.context.suspend();
         if(this.state.playing == true) this.stop()
       }}>Stop</button>
       <Slider sliderName = "Pitch" minVal = {0} maxVal = {1000} defaultVal = {440} callbackFn = {this.updateRootFreq} />
       <Filter context = {this.props.context} oscillator = {this.oscillator} />
       <Sequencer callbackFn = {this.updateFreq}/>
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
      <span className="freq_slider">
        <div>{this.state.sliderName}</div>
          <input type ="range" min={this.state.minVal} max={this.state.maxVal} defaultValue ={this.state.defaultVal} className="slider" id={this.state.sliderName} onChange={() =>{
            this.state.callbackFn(document.getElementById(this.props.sliderName).value);
          }}></input>
      </span>
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
      running: false,
      tempo: 1000, //in milliseconds
      callbackFn: this.props.callbackFn,
    };
    const interval = null;
  }
  pluckSequence = (step) => {
    this.setState({currentStep: step});
    let newFreq = this.state.rootFreq * (step + 0.5);
    this.state.callbackFn(newFreq);
    console.log(step);
    if(this.state.running == false) {
      this.interval = setInterval(() => this.runSequence(), this.state.tempo);
    }
  }
  runSequence = () => {
    let step = (this.state.currentStep + 1) % this.state.length;
    this.setState({currentStep: step, running: true});
    let newFreq = this.state.rootFreq * (step + 0.5);
    this.setState({rootFreq: this.state.callbackFn(newFreq)});
    console.log("Current Pitch: " + newFreq + "Current Step: " + step);
  }
  stopSequence = () => {

  }
  stepUpLength = () => {
    this.setState({length: this.state.length + 1});
  }
  stepDownLength = () => {
    if(this.state.length - 1 > 0) this.setState({length: this.state.length - 1});
    else console.error("Minimum sequencer length reached");
  }
  updateTempo = (newTempo) => {
    this.setState({tempo: newTempo});
    clearInterval(this.interval);
    this.interval = setInterval(() => this.runSequence(), newTempo);
  }
  render = (props) => {
    const buttonList = [];
    for(let i = 0; i < this.state.length; i++){
      console.log(buttonList);
      buttonList[i] = <button className="seqStep" key={i + '_step'} onClick={() => this.pluckSequence(i)}>{i}</button>;
    }
    return(
      <div>
        <button className="key" onClick={() => this.stepUpLength() }>+</button>
        <button className="key" onClick={() => this.stepDownLength() }>-</button>
        <Slider sliderName="Tempo" minVal={20} maxVal={1000} defaultVal={100} callbackFn={this.updateTempo} />
        {buttonList}
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
      context: this.props.context,
      initialized: false,
    }
    const filter = 0;
    const oscillator = this.props.oscillator;
    const mode = 'lowpass';
  }
  init = (props) => {
    this.setState({initialized: true, context: this.props.context}, () => {
      this.filter = this.state.context.createBiquadFilter();
      this.oscillator = this.props.oscillator;
      console.log(this.oscillator);
      this.oscillator.connect(this.filter);
      this.filter.connect(this.state.context.destination);
      this.filter.type = this.mode;
      this.filter.frequency.setValueAtTime(this.state.cutoff, 1);
      this.filter.q = this.filter.resonance;
      console.log("filter initialized");
      console.log(this.filter);
      console.log(this.state.context.destination);
    })
  }
  updateCutoff = (freq) => {
    this.setState({cutoff: freq}, this.updateFilter());
  }
  updateResonance = (q) => {
    this.setState({resonance: q}, this.updateFilter());
  }
  updateFilter = () => {
    if(this.state.context != null){
      if(this.state.initialized != false){
        this.filter.frequency.setValueAtTime(this.state.cutoff, 1);
        this.filter.Q.value = this.state.resonance;
        this.filter.type = this.mode;
        console.log("filter updated");
      }
      else this.init();
      
    } 
    else console.log("failed to load audioContext() in updateFilter()")
  }
  render(){
    return(
      <div className="inlineDiv">
        <div>
          <Slider sliderName = "Cutoff" minVal={0} maxVal={5000} defaultVal={this.state.cutoff} callbackFn={this.updateCutoff}/>
          <Slider sliderName = "Resonance" minVal={1} maxVal={100} defaultVal={this.state.resonance} callbackFn={this.updateResonance}/>
        </div>
        <div>
          <button className="key" onClick={() => this.mode = 'lowpass'}> lowpass </button>
          <button className="key" onClick={() => this.mode = 'highpass'}> highpass </button>
        </div>
      </div>
    );
  }

}
class Envelope extends React.Component {

}
class Synth extends React.Component {
  constructor(props){
    super(props);
    this.state = {

    };

  }
  render = () => {
    return(
      <div></div>
    );
  }
}
//const mainOsc = new Osc()
const context = new window.AudioContext;
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Osc context = {context}/>);

