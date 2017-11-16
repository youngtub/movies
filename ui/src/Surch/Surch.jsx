import React from 'react';
import Autosuggest from './Autosuggest';
import {Tag, Button, Input} from 'antd';
import 'antd/dist/antd.css';
import {Row, Col} from 'react-bootstrap';

class Surch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      surchedMovies: []
    }
    this.surchMovies = this.surchMovies.bind(this);
    this.removeMovie = this.removeMovie.bind(this);
    this.resetSurch = this.resetSurch.bind(this);
    this.demoSurch = this.demoSurch.bind(this);
  }

  componentWillMount() {
    // console.log('all artists', this.props.allArtists)
  }

  surchMovies(name) {
    var newArray = this.state.surchedMovies.slice().unshift(name);
    console.log('NEW ARRAY', newArray)
    this.setState({
      surchedMovies: newArray
    }, () => {
      // console.log('artists in Surch state', this.state.surchedArtists);
      this.props.applySurchCb(this.state.surchedMovies)
    })
  }

  removeMovie(name) {
    console.log('NAME IN SURCH', name)
    var filteredMoviesArray = this.state.surchedMovies.filter(artist => artist !== name);
    this.setState({
      surchedMovies: filteredMoviesArray
    }, () => {
      console.log('artists after delete state', this.state.surchedMovies);
      this.props.applySurchCb(this.state.surchedMovies)
    })
  }

  resetSurch() {
    this.setState({
      surchedMovies: []
    }, this.props.reset)
  };

  demoSurch() {
    this.setState({
      surchedMovies: ['The Godfather']
    }, () => {
      // this.props.applySurchCb(this.state.surchedArtists)
    })
  }

  handleChange = (e) => {
    this.setState({
      value: e.target.value
    })
  };

  handleSubmit = () => {
    var newMovies = this.state.surchedMovies;
    var formattedVal = this.state.value.slice();
    var final = formattedVal.split(' ').map(word => word.slice(0,1).toUpperCase()+word.slice(1)).join(' ');

    newMovies.unshift(final);
    this.setState({
      surchedMovies: newMovies,
      value: ''
    }, () => {
      this.props.applySurchCb(this.state.surchedMovies);
    })

  }

  render() {
    return (
      <div id='surchContainer'>
        <div id='autosuggest' style={surchStyle}>
          <Row>
            <Col md={8}>
              <Input value={this.state.value} onChange={this.handleChange} placeholder='Enter movie title' />
              <Button type='primary' onClick={this.handleSubmit}>Submit</Button>
              {/*<Autosuggest allArtists={this.props.allArtists} SurchCb={this.surchArtists} style={autosuggestStyle}/>*/}
            </Col>
            <Col md={4} style={surchButtons}>
              <Button onClick={this.demoSurch}>Demo</Button>
              <Button onClick={this.resetSurch}> Reset</Button>
            </Col>
          </Row>
        </div>
        <br/>
        <Row>
        <Col md={4}>
          {
            this.state.surchedMovies.slice(0, 5).map((artist, i) => (
              <div style={surchStyle} key={i}>
                <Tag key={i} closable={true}
                  afterClose={() => this.removeArtist(artist)} style={tagStyle}>
                  {artist}
                </Tag><br/><br/>
              </div>
            ))
          }
        </Col>

        <Col md={4} style={surchStyle}>
          {
            this.state.surchedMovies.slice(5, 10).map((artist, i) => (
              <div style={surchStyle} key={i}>
                <Tag key={i} closable={true}
                  afterClose={() => this.removeArtist(artist)} style={tagStyle}>
                  {artist}
                </Tag><br/><br/>
              </div>
            ))
          }
        </Col>

        <Col md={4}></Col>
        </Row>
        <br/>
      </div>
    )
  }

};

const surchButtons = {
  // marginLeft: '3%'
}

const autosuggestStyle = {
  width: '70%'
}

const surchStyle = {
  // padding: '10px',
  marginLeft: '2%',
  marginTop: '2%'
}

const tagStyle = {
  // height: '5vh',
  // width: '7vw',
  // fontSize: '12px'
  marginLeft: '4%'
}

export default Surch;
