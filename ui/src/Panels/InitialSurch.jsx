import React from 'react';
import {Input, Button} from 'antd';

class InitialSurch extends React.Component {
  constructor(props) {
    super(props);
      this.state = {
        search: ''
      }
    }

  handleChange = (e) => {
    this.setState({
      search: e.target.value
    })
  }

  submit = () => {
    this.props.initialSurch(this.state.search)
    this.setState({
      val: ''
    })
  }

  render() {
    return (
      <div style={initialSurchStyle}>
        <Input style={inputStyle} placeholder='enter movie title' value={this.state.search} onChange={this.handleChange} />
        <Button type='primary' icon='right' onClick={this.submit}>Go</Button>
      </div>
      )
  }

}

const inputStyle = {
  width: '70%',
  // textAlign: 'center',
  marginTop: '44%'
}

const initialSurchStyle = {
  backgroundColor: '#033860',
  border: 'solid black 1px',
  borderRadius: '1000px',
  height: '25vh',
  width: '13vw',
  marginTop: '25%',
  marginLeft: '30%',
  textAlign: 'center'
}

export default InitialSurch;
