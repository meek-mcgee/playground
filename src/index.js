import React from "react";
import ReactDOM from "react-dom/client"; //from react-dom/client, not react
import './index.css';

/**
 * 'The sun is rising
 * it's almost dawn! 
 * The night is short --
 * walk on, girl.
 */

//test stuff
class Slider extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      minVal: props.minVal,
      maxVal: props.maxVal,
      step: props.step,
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
          <input type ="range" min={this.state.minVal} max={this.state.maxVal} defaultValue ={this.state.defaultVal} step = {this.state.step} className="slider" id={this.state.sliderName} onChange={() =>{
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
    this.interval = null;
    this.envelope = null;
  }
  pluckSequence = (step) => {
    this.setState({currentStep: step});
    let newFreq = this.state.rootFreq * (step + 0.5);
    this.state.callbackFn(newFreq);
    console.log(step);
    if(this.state.running === false) {
      this.interval = setInterval(() => this.runSequence(), this.state.tempo);
    }
  }
  runSequence = () => {
    document.getElementById("triggerEnvelope").click(); //will break when there's more than one envelope, must fix later
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
      <div className="inlineDiv">
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
      initialized: false,
    }
    this.context = null;
    this.filter = 0;
    this.oscillator = this.props.oscillator;
    this.mode = 'lowpass';
  }
  init = (props) => {
    if(this.props.oscillator !== null){
      this.oscillator = this.props.oscillator;
      this.setState({initialized: true}, () => {
        this.context = this.oscillator.context;
        this.filter = this.context.createBiquadFilter();
        console.log(this.oscillator);
        console.log(this.oscillator.gain);
        this.oscillator.gain.connect(this.filter);
        this.filter.connect(this.context.destination);
        this.filter.type = this.mode;
        this.filter.frequency.setValueAtTime(this.state.cutoff, 1);
        this.filter.Q.value = this.state.resonance;
        console.log("filter initialized");
        console.log(this.filter);
        console.log(this.context.destination);
      })
    }
    else console.error("this.props.oscillator == null");
    
  }
  updateCutoff = (freq) => {
    if(this.context) this.setState({cutoff: freq}, this.updateFilter());
  }
  updateResonance = (q) => {
    if(this.context) this.setState({resonance: q}, this.updateFilter());
  }
  updateFilter = () => {
    if(this.context !== null){
      if(this.state.initialized !== false){
        this.filter.frequency.setValueAtTime(this.state.cutoff, 1);
        this.filter.Q.value = this.state.resonance;
        this.filter.type = this.mode;
        console.log("filter updated");
      }
      else this.init();
      
    } 
    else console.error("failed to load audioContext() in updateFilter()")
  }
  updateMode = (mode) => {
    this.mode = mode;
    this.updateFilter();
  }
  render(){
    return(
      <div>
        <div>
          <Slider sliderName = "Cutoff" minVal={0} maxVal={5000} defaultVal={this.state.cutoff} callbackFn={this.updateCutoff}/>
          <Slider sliderName = "Resonance" minVal={1} maxVal={10} step={0.1} defaultVal={this.state.resonance} callbackFn={this.updateResonance}/>
        </div>
        <div>
          <button className="key" id="lowpass_button" onClick={() => this.updateMode('lowpass')}> lowpass </button>
          <button className="key" onClick={() => this.updateMode('highpass')}> highpass </button>
        </div>
      </div>
    );
  }

}
class Envelope extends React.Component {
  //Takes in a gain node from props.oscillator.gain
  constructor(props) {
    super(props);
    this.state = {
      attack: 50, //cycles of updateAttack
      release: 50, //cycles of updateRelease
      gain: 1,
      callbackFn: this.props.callbackFn,
    }
    this.gain = null;
    this.counter = 0;
    this.attackInterval = null;
    this.releaseInterval = null;
  }
  updateGain = (newGain) => {
    this.gain.gain.setValueAtTime(newGain, 0);
    console.log('gain updated');
  }
  setAttack = (val) => this.setState({attack: val});
  setRelease = (val) => this.setState({release: val});
  updateAttack = () => {
    //let newGain = this.state.gain/(this.state.attack - this.counter);
    let newGain = Math.log10(this.counter + 1);
    //console.log("current attack: " + newGain);
    this.updateGain(newGain);
    this.counter++;
    if(!(this.counter < this.state.attack)){
      this.counter = 0; 
      clearInterval(this.attackInterval);
      this.releaseInterval = setInterval(() => this.updateRelease(), 0);
    }
  }
  updateRelease = () => {
    //clear the attack interval and start the release timeout
    let newGain = 0;
    if(this.counter >= this.state.release){
      newGain = 0;
      this.updateGain(newGain);
      clearInterval(this.releaseInterval);
      if(this.attackInterval !== null) clearInterval(this.attackInterval);
    }
    else {
      newGain = this.state.gain - Math.log10((1/this.state.release)*this.counter + 1); //f(x) = log(-(x - 9)+ (z + 1)) puts y = 0 at the point (x, z); x-9 keeps starter point at gain = 1
      this.updateGain(newGain);
      //console.log("current release: " + newGain);
      this.counter++;
    }

  }
  resetEnvelope = (props) => {
    /**
     * envelope takes attack and release and updates the envelope based on this 
     * by creating an interval var. 
     * creates interval that lasts length of attack,
     * then once interval ends, calls the release callbackFn 
     * and runs that until it ends.
     */
    console.log("envelope triggered");
    this.gain = this.props.oscillator.gain;
    this.counter = 0;
    if(this.attackInterval !== null) clearInterval(this.attackInterval);
    if(this.releaseInterval !== null) clearInterval(this.releaseInterval);
    this.setState({gain: 1}, () => {
      console.log('this.secsPerUpdate: ' + this.secsPerUpdate);
      this.attackInterval = setInterval(() => this.updateAttack(), 0);
      this.updateGain(this.state.gain);
      this.updateAttack();
    });
  }
  render = (props) => {
    return(
      <div>
        <button className="key" id="triggerEnvelope" onClick={() => this.resetEnvelope()}>Trigger Env</button>
        <button className="key" onClick={() => this.setLooping()} >Loop Envelope</button>
        <Slider sliderName= "Attack" minVal = {0} maxVal = {50} defaultVal = {5} step = {1} callbackFn={this.setAttack}/>
        <Slider sliderName= "Release" minVal = {0} maxVal = {50} defaultVal = {5} step = {1} callbackFn={this.setRelease}/>
      </div> 
    );
  }
}
class Oscillator extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      rootFreq: 440,
      currentFreq: 440,
      playing: false,
      context: props.context,
      initialized: false,
    };
    this.oscillator = null;
    this.sequencer = null;
  }
  printMessage = () => {console.log('hello');}
  init = () => {
    //init audioContext
    this.setState({initialized: true});
    this.oscillator = this.state.context.createOscillator();
    this.oscillator.gain = this.state.context.createGain();
    this.oscillator.gain.gain.setValueAtTime(1, 0);
    this.oscillator.type = 'square';
    this.oscillator.frequency.setValueAtTime(this.state.rootFreq, 2);
    this.oscillator.connect(this.oscillator.gain);
    this.sequencer = <Sequencer callbackFn = {this.updateFreq}/>
    this.play();
  }
  play = () => {
    if(this.state.playing === false) this.oscillator.start();
  }
  stop = () => {
    if(this.state.playing === true) {
      this.setState({playing: false}, () => this.oscillator.stop());
    }
  }
  updateGain = (newGain) => {
    this.oscillator.gain.gain.setValueAtTime(newGain, 0);
    console.log('gain updated');
  }
  updateRootFreq = (newFreq) => {
    //For pitch adjustment purposes -- do not use with sequencer class
    this.setState({rootFreq: newFreq}, () => this.updateFreq(newFreq));
  }
  updateFreq = (newFreq) => {
    //For sequencing purposes
    this.setState({currentFreq: newFreq}, () => {
      if(this.oscillator !== null) this.oscillator.frequency.value = this.state.currentFreq;
    })
    return this.state.rootFreq;
  }
  render = () => {
    return (
      <div className="mainDiv">
        {/** Render play/pause buttons */}
        <button className="key" onClick={ () => {
        this.state.context.resume();
        if(this.state.initialized === false){
          this.init();
        }
        else this.play();
       } }>Play</button>
       <button className="key" onClick={ () => {
         this.state.context.suspend();
         if(this.state.playing === true) this.stop()
       }}>Stop</button>
       {/** Render gain/pitch sliders */}
       {this.sequencer}
       <Slider sliderName = "Gain" minVal = {0} maxVal = {1} defaultVal = {0.5} step ={0.05} callbackFn = {this.updateGain} />
       <Slider sliderName = "Pitch" minVal = {0} maxVal = {1000} defaultVal = {440} callbackFn = {this.updateRootFreq} />
      </div>
    );
  }
}
class Connector {
  constructor(o, d, cb){ //o - origin, d - destination, cb - callbackFunction()
    this.origin = o;
    this.destination = d;
    this.callbackFn = cb;
  }
  getOrigin = () => this.origin;
  getDestination = () => this.destination;
  getCallbackFn = () => this.callbackFn;
  connect = () => this.origin.connect(this.destination);
  disconnect = () => this.origin.disconnect(this.destination);
}

class Synth extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      rootFreq: 440,
      currentFreq: 440,
      playing: false,
      context: props.context,
      initialized: false,
      currentModules: [],
      moduleList: ['oscillator', 'filter', 'envelope'],
    };
    this.oscillator = null;
  }
  init = () => {
    //init audioContext
    this.setState({initialized: true}, () => document.getElementById("lowpass_button").click()); //initializes filter 
    this.oscillator = this.state.context.createOscillator();
    this.oscillator.gain = this.state.context.createGain();
    this.oscillator.gain.gain.setValueAtTime(1, 0);
    this.oscillator.type = 'square';
    this.oscillator.frequency.setValueAtTime(this.state.rootFreq, 2);
    this.oscillator.connect(this.oscillator.gain);
    this.play();
  }
  play = () => {
    if(this.state.playing === false) this.oscillator.start();
  }
  stop = () => {
    if(this.state.playing === true) {
      this.setState({playing: false}, () => this.oscillator.stop());
    }
  }
  updateGain = (newGain) => {
    this.oscillator.gain.gain.setValueAtTime(newGain, 0);
    console.log('gain updated');
  }
  updateRootFreq = (newFreq) => {
    //For pitch adjustment purposes -- do not use with sequencer class
    this.setState({rootFreq: newFreq}, () => this.updateFreq(newFreq));
  }
  updateFreq = (newFreq) => {
    //For sequencing purposes
    this.setState({currentFreq: newFreq}, () => {
      if(this.oscillator !== null) this.oscillator.frequency.value = this.state.currentFreq;
    })
    return this.state.rootFreq;
  }
  addModule = (stringIndex) => {
    let subArray = this.state.currentModules;
    switch(stringIndex) {
      case 'oscillator':
        console.log('oscillator');
        subArray.push(<Oscillator context={this.state.context} />);
        this.setState({currentModules: subArray});
        break;
      case 'filter':
        console.log('filter');
        subArray.push(<Filter oscillator = {this.oscillator} />);
        this.setState({currentModules: subArray});
        break;
      case 'envelope':
        console.log('envelope');
        subArray.push(<Envelope oscillator = {this.oscillator} callbackFn = {this.updateGain} />);
        this.setState({currentModules: subArray});
        break;
      default:
        console.error('Synth.addModule() stringIndex out of range');
    }
    console.log(this.state.currentModules);
  }
  render = () => {
    
    const availableModules = [];
    for(let i = 0; i < this.state.moduleList.length; i++ ){
      availableModules[i] = <button className="key" key={this.state.moduleList[i] + "_module"} onClick={() => this.addModule(this.state.moduleList[i])}>{this.state.moduleList[i]}</button>
    }
    return (
      <div className="mainDiv">
        <button className="key" onClick={ () => {
        this.state.context.resume();
        if(this.state.initialized === false){
          this.init();
          
        }
        else this.play();
       } }>Play</button>
       <button className="key" onClick={ () => {
         this.state.context.suspend();
         if(this.state.playing === true) this.stop()
       }}>Stop</button>
       <Slider sliderName = "Gain" minVal = {0} maxVal = {1} defaultVal = {0.5} step ={0.05} callbackFn = {this.updateGain} />
       <Slider sliderName = "Pitch" minVal = {0} maxVal = {1000} defaultVal = {440} callbackFn = {this.updateRootFreq} />
       <Filter oscillator = {this.oscillator} />
       <Sequencer callbackFn = {this.updateFreq}/>
       <Envelope oscillator = {this.oscillator} />
      </div>
    );
  }
}
const context = new window.AudioContext();
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Synth context = {context}/>);

