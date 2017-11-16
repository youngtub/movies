import React from 'react';
import {Col, Row, Grid} from 'react-bootstrap';
import {ListGroup, ListGroupItem} from 'react-bootstrap';
import {Tag} from 'antd';

const InfoPanel = (props) => {

  const calculateLinks = () => {
    var relevantLinks = props.links.reduce((acc, curr) => {
      if (curr.source.name === props.selectedArtist.name && curr.value > 0) {
        acc[`${curr.target.name}`] = curr.value;
      }
      if (curr.target.name === props.selectedArtist.name && curr.value > 0) {
        acc[`${curr.source.name}`] = curr.value;
      }
      return acc;
    }, {})
    var outputArr = [];
    for (var key in relevantLinks) {
      let tempObj = {
        'name':key,
        'count': relevantLinks[key]
      }
      outputArr.push(tempObj)
    }
    outputArr.sort((a,b)=>b.count-a.count);
    return outputArr
  }

  return (
    <div id='infoPanel'>

    {props.display === 'welcome' ? (
      <Grid fluid={true}>


      <Row>

        <Col sm={12} md={12} style={centered}>

          <Row>
            <br/>
            <h4>Welcome! to begin, search a movie</h4>
          </Row>
        </Col>

      </Row>

    </Grid>
  ) : ''}

    {props.display === 'viz' ? (
      <Grid fluid={true}>
          <Row className="show-grid">
            <br/>
            <h4 style={{textAlign: 'center'}}>{props.selectedMovie.title}</h4>
          </Row>
          <br/>
          <hr/>
          <br/>
          <Row>
            <Col md={6}>
              <img src={props.selectedMovie.poster} alt=''/>
            </Col>
            <Col md={6}>
              <div style={overviewStyle}>{props.selectedMovie.overview}</div>
            </Col>
          </Row>
          <br/>
          <Row>
            <p style={{textAlign: "center"}}><i>{props.selectedMovie.tagline ? `"${props.selectedMovie.tagline}"` : null}</i></p>
          </Row>
          <br/>
          <hr/>
          <br/>
          <Row className="show-grid">
            <Col md={3}>
              Runtime: {props.selectedMovie.runtime}
            </Col>
            <Col md={3}>
              Budget: {props.selectedMovie.budget}
            </Col>
            <Col md={3}>
              Revenue: {props.selectedMovie.revenue}
            </Col>
            <Col md={3}>
              Rating: {props.selectedMovie.voteAverage}
            </Col>
          </Row>
          <br/>
          <hr/>
          <br/>
          <Row>
            <Col md={1}></Col>
            <Col md={10}>
              <div style={keywordsStyle}>
            {props.selectedMovie.keywords ? (
              props.selectedMovie.keywords.map((keyw, i) => (
              <Tag key={i} className='keyword'>{keyw.word}</Tag>
            ))
          ) : null}
          </div>
            </Col>
            <Col md={1}></Col>
          </Row>

      </Grid>

    ) : ''}

    {props.display === '' ? (
      <Col md={12}>
        <img src='https://drive.google.com/uc?id=1bEsmi0UXdfDE0awAY5O0u6U1bB3v0lZK' height={230} width={300}></img>
        <br/><br/><br/>
        <p>Click on an Artist or Link to learn more</p>
      </Col>
    ) : ''}

    </div>
  )
};

const overviewStyle = {
  height: '32vh',
  overflow: 'scroll'
}

const keywordsStyle = {
  height: '7vh',
  overflow: 'scroll'
}

const centered = {
  textAlign: "center",
  align: "center"
}

const offset = {
  // marginLeft: '7%'
}

export default InfoPanel;
