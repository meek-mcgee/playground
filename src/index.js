import { render } from "@testing-library/react";
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
    const oscillator = null;
  }
  init(){
    //init audioContext
    this.forceUpdate(()=> this.setState({context: new window.AudioContext}));
  }
  play() {
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
  updateFreq(newFreq){
    this.setState({freq: newFreq}, () => {
      if(this.oscillator != null) this.oscillator.frequency.setValueAtTime(this.state.freq, 2);
    })
  }
  stop(){
    if(this.state.playing == true) {
      this.setState({playing: false}, () => this.oscillator.stop());
    }
  }
  render(){
    return (
      <div>
        <button className="key" onClick={ () => {
        if(this.state.context == null) this.init()
        if(this.state.context != null) this.play()
       } }>Play</button>
       <button className="key" onClick={ () => {
         if(this.state.playing == true) this.stop()
       }}>Stop</button>
        <div className="freq_slider">
          <input type ="range" min="1" max="1000" defaultValue ="440" className="slider" id="freq-slider" onChange={() =>{
            this.updateFreq(document.getElementById('freq-slider').value);
          }}></input>
        </div>
      </div>
    );
  }
}
class Slider extends React.Component {
  render(oscProps){
    return(
      <div className="freq_slider">
          <input type ="range" min="1" max="1000" defaultValue ="440" className="slider" id="freq-slider" onChange={() =>{
            oscProps.updateFreq(document.getElementById('freq-slider').value);
          }}></input>
      </div>
    );
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Osc />);

