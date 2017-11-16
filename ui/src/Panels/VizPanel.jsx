import React from 'react';
import * as d3 from 'd3';
import InfoPanel from './InfoPanel';
import Surch from '../Surch/Surch';
import {Grid, Row, Col} from 'react-bootstrap';
import $ from 'jquery';
import axios from 'axios';

class VizPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      blinks: [],
      selectedMovie: {},
      selectedLink: {},
      display: 'welcome',
      allMovies: [],
      surchCount: 0,
      prevSelected: {}
    }
    this.generateCharts = this.generateCharts.bind(this);
    this.applySurchCb = this.applySurchCb.bind(this);
    this.resetSurchCb = this.resetSurchCb.bind(this);
    this.sendRequestForMovies = this.sendRequestForMovies.bind(this);
    this.getFillColor = this.getFillColor.bind(this);
    this.getNodeSize = this.getNodeSize.bind(this);
    this.isMovieAlreadySearched = this.isMovieAlreadySearched.bind(this);
  }

  componentDidMount() {
    axios.get('/test')
    .then((response) => console.log(response.data))
  };

  componentWillReceiveProps() {
    // console.log('PROPS IN VIZPANEL', this.props.settings)
    setTimeout(() => this.generateCharts(), 100)
  }

  isMovieAlreadySearched(q) {
    if (this.state.allMovies.length === 0) return false;

    return this.state.allMovies.reduce((acc, curr) => {
      if (curr.title === q && (curr.type === 'primary' || curr.type === 'secondary')) acc = true;
      return acc;
    }, false)
  }
  sendRequestForMovies(q, type) {
    if (!this.isMovieAlreadySearched(q)) {
    var movieName = encodeURIComponent(q);
    var qry = `query%20%7B%0A%20%20movie(title%3A%20%22${movieName}%22)%20%7B%0A%20%20%20%20title%0A%20%20%20%20id%0A%20%20%20%20overview%0A%20%20%20%20voteAverage%0A%20%20%20%20poster%0A%20%20%20%20details%20%7B%0A%20%20%20%20%20%20runtime%0A%20%20%20%20%20%20website%0A%20%20%20%20%20%20budget%0A%20%20%20%20%20%20revenue%0A%20%20%20%20%20%20tagline%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20similar%20%7B%0A%20%20%20%20%09title%0A%20%20%20%20%09id%0A%20%20%20%20%09overview%0A%20%20%20%20%09voteAverage%0A%20%20%20%20%20%20poster%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20recommendations%20%7B%0A%20%20%20%20%20%20title%0A%20%20%20%20%09id%0A%20%20%20%20%09overview%0A%20%20%20%20%09voteAverage%0A%20%20%20%20%20%20poster%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%20%20keywords%20%7B%0A%20%20%20%20%20%20id%0A%20%20%20%20%20%20word%0A%20%20%20%20%7D%0A%20%20%20%20%0A%20%20%7D%0A%7D%0A`


    axios.get(`/graphql?query=${qry}`)
    .then((resp) => {
      console.log('details', resp.data)
      var mov = {
        title: resp.data.data.movie.title,
        overview: resp.data.data.movie.overview,
        tmdbid: resp.data.data.movie.id,
        voteAverage: resp.data.data.movie.voteAverage,
        poster: resp.data.data.movie.poster,
        budget: resp.data.data.movie.details.budget,
        revenue: resp.data.data.movie.details.revenue,
        runtime: resp.data.data.movie.details.runtime,
        tagline: resp.data.data.movie.details.tagline,
        keywords: resp.data.data.movie.keywords,
        type: type
      }
      var movieNum = this.props.settings.movieNumber || 3;

      var newSim = resp.data.data.movie.similar.slice(0, movieNum).map(movie => {
        movie['search'] = mov;
        movie['rel'] = 'sim';
        movie['type'] = 'conn';
        return movie
      });

      var newRec = resp.data.data.movie.recommendations.slice(0, movieNum).map(movie => {
        movie['search'] = mov;
        movie['rel'] = 'rec';
        movie['type'] = 'conn'
        return movie
      });

      //filter connections
      var titlesInSim = newSim.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);
      var titlesOfAllMovies = this.state.allMovies.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);
      var uniqueConnections = newSim;

      for (let i = 0; i < newRec.length; i++) {
        if (!titlesInSim.includes(newRec[i].title)) {
          uniqueConnections.push(newRec[i]);
        }
      }

      var primaryAndConnections = [mov].concat(uniqueConnections);

      //Movies

      if (this.state.allMovies.length === 0) {
        var firstTimeLinks = primaryAndConnections.reduce((acc, curr, i) => {
          if (i === 0) {}
          else {
            let tempLinkObj = {
              "source": 0, "target": i, value: 1
            }
            acc.push(tempLinkObj);
          }
          return acc;
        }, [])

        this.setState({
          selectedMovie: mov,
          allMovies: primaryAndConnections,
          blinks: firstTimeLinks,
          display: 'viz',
          surchCount: this.state.surchCount+1,
          prevSelected: mov
        }, () => {
          console.log('state set', this.state)
          this.generateCharts();
        })

      } else if (this.state.allMovies.length > 0 && type === 'secondary') {
        // remove secondary node from initial allMovies
        var originalNodes = this.state.allMovies;
        var originalNodesTitles = originalNodes.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);
        var indexOfNodeToRemove = originalNodesTitles.indexOf(mov.title);
        var removedNode = originalNodes.splice(indexOfNodeToRemove, 1);
        originalNodesTitles.splice(indexOfNodeToRemove, 1);
        // remove link between original movie and secondary node
        var originalLinks = this.state.blinks;
        var originalLinksTargetsTitles = originalLinks.reduce((acc, curr) => {acc.push(curr.target.title); return acc}, []);
        var originalLinksSourceTitles = originalLinks.reduce((acc, curr) => {acc.push(curr.source.title); return acc}, []);
        var indexOfLinkTargetToRemove = originalLinksTargetsTitles.indexOf(mov.title);
        var indexOfLinkSourceToRemove = originalLinksSourceTitles.indexOf(mov.title);
        var removedLinkTarget = originalLinks.splice(indexOfLinkTargetToRemove, 1);
        // var removedLinkSource = originalLinks.splice(indexOfLinkSourceToRemove, 1);

        //compare existing connections and new commections for matches
        var newConnections = primaryAndConnections.slice(1);
        newConnections.forEach(mov => {
          if (originalNodesTitles.includes(mov.title)) {
            let indOfCommonInEdited = originalNodesTitles.indexOf(mov.title);
            let nodeToRemove = originalNodes[indOfCommonInEdited]
            if (nodeToRemove.type !== 'primary' && nodeToRemove.type !== 'secondary') {
              var removed = originalNodes.splice(indOfCommonInEdited, 1);
              console.log('REMOVED FOR COMMON', removed)
              mov["common"] = {
                "count": 1,
                "movies": [this.state.selectedMovie, mov]
              }
            }
          }
        });

        // add new primary and connections to nodes list
        var newNodes = originalNodes.concat(primaryAndConnections);
        var newNodesTitles = newNodes.reduce((acc, curr) => {acc.push(curr.title); return acc;}, []);
        var indexOfSecondary = newNodesTitles.indexOf(mov.title);
        var indexOfPrimary = newNodesTitles.indexOf(this.state.prevSelected.title)
        // add link from M1P to M2S
        let bridgeLinkObj = { "source": indexOfPrimary, "target": indexOfSecondary, value: 3}

        // add links from M2S to all m2c's
        var linksToAdd = newNodes.reduce((acc, curr, i) => {
          if (i <= indexOfSecondary) {}
          else {
            // special links for common connections
            if (curr.common) {
              let commonLinkObjs = [
                { "source": indexOfPrimary, "target": i, value: 1+curr.common.count},
                {"source": indexOfSecondary, "target": i, value: 1+curr.common.count}
              ]
              acc = acc.concat(commonLinkObjs)
            } else {
              let tempLinkObj = {
                "source": indexOfSecondary, "target": i, value: 1
              }
              acc.push(tempLinkObj);
            }

          }
          return acc;
        }, []);

        var newLinks = originalLinks.concat(linksToAdd)
        newLinks.push(bridgeLinkObj);
        console.log('NEW LINKS', newLinks);

        this.setState({
          selectedMovie: mov,
          allMovies: newNodes,
          blinks: newLinks,
          display: 'viz'
        }, () => {
          console.log('state set', this.state)
          this.generateCharts();
        })

      } else if (this.state.allMovies.length > 0 && type === 'primary') {
        console.log('in surch case', q)
        var originalNodes = this.state.allMovies;
        var originalNodesTitles = originalNodes.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);

        //compare for connections
        var newConnections = primaryAndConnections.slice(1);
        newConnections.forEach(mov => {
          if (originalNodesTitles.includes(mov.title)) {
            let indOfCommonInEdited = originalNodesTitles.indexOf(mov.title);
            let nodeToRemove = originalNodes[indOfCommonInEdited]
            if (nodeToRemove.type !== 'primary' && nodeToRemove.type !== 'secondary') {
              var removed = originalNodes.splice(indOfCommonInEdited, 1);
              console.log('REMOVED FOR COMMON', removed)
              mov["common"] = {
                "count": 1,
                "movies": [this.state.selectedMovie, mov]
              }
            }
          }
        });

        // add new primary and connections to nodes list
        var newNodes = originalNodes.concat(primaryAndConnections);
        var newNodesTitles = newNodes.reduce((acc, curr) => {acc.push(curr.title); return acc;}, []);
        var indexOfNewPrimary = newNodesTitles.indexOf(mov.title);
        var indexOfPrimary = newNodesTitles.indexOf(this.state.prevSelected.title)

        // add links from M2S to all m2c's
        var linksToAdd = newNodes.reduce((acc, curr, i) => {
          if (i <= indexOfNewPrimary) {}
          else {
            // special links for common connections
            if (curr.common) {
              let commonLinkObjs = [
                { "source": indexOfPrimary, "target": i, value: 1+curr.common.count},
                {"source": indexOfNewPrimary, "target": i, value: 1+curr.common.count}
              ]
              acc = acc.concat(commonLinkObjs)
            } else {
              let tempLinkObj = {
                "source": indexOfNewPrimary, "target": i, value: 1
              }
              acc.push(tempLinkObj);
            }

          }
          return acc;
        }, []);

        var originalLinks = this.state.blinks;
        var newLinks = originalLinks.concat(linksToAdd)

        this.setState({
          selectedMovie: mov,
          allMovies: newNodes,
          blinks: newLinks,
          display: 'viz',
          surchCount: this.state.surchCount+1
        }, () => {
          console.log('state set', this.state)
          this.generateCharts();
        })

      }
    })
   }
  }

  generateCharts() {
    console.log('starting generate charts')
    d3.select('#canvas').selectAll('svg').remove();

    var width = 960,
        height = 700

    var svg = d3.select("#canvas").append("svg")
        .attr("width", width)
        .attr("height", height);

    var linkDistance = this.props.settings.linkDistance || 200;
    var circleSize = this.props.settings.circleSize || 22;
    var label = this.props.settings.label || 'image';

    var sim = d3.forceSimulation(this.state.allMovies)

    .force("link", d3.forceLink(this.state.blinks)
      .distance((d) => {
        return d.value > 1 ? linkDistance/(d.value-1) : linkDistance;
      })
      // .strength((d) => {
      //   return d.value > 0 ? d.value*2 : 1;
      // })
      )
    .force("charge", d3.forceManyBody().strength(-150))
    .force("center", d3.forceCenter(400, 300))
    .force("gravity", d3.forceManyBody())

    // .force("distance", d3.forceManyBody(100))

    .force('collision', d3.forceCollide().radius((d) => {
      return (this.props.settings.circleSize || 30) + 7
    }))
    .force("size", d3.forceManyBody([width, height]));

    var link = svg.selectAll(".link").data(this.state.blinks).enter()
        .append("line")
        .attr("class", (d) => `link ${d.source.title.replace(/\W+/g, " ")} ${d.target.title.replace(/\W+/g, " ")} ${d.target.type}`)
        .attr("stroke-width", (d) => d.value*3);

          $('.link').toggle();
          $('.secondary').css('display', 'inline');
    link.on("click", (d) => {
        console.log('selected link', d);

      });

var node = svg.selectAll(".node").data(this.state.allMovies).enter()
    .append("g").attr("class", "node")
    .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended)
    );

function dragstarted() {
  if (!d3.event.active) sim.alphaTarget(0.5).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}

function dragged() {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}

function dragended() {
  if (!d3.event.active) sim.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

if (label === 'image') {

  node.append("circle")
      .attr("r", (d) => this.getNodeSize(d.type))
      .attr("fill", (d) => d.common ? '#a32837' : this.getFillColor(d.type))
      .attr("class", (d) => `${d.title.replace(/\W+/g, " ")} node`)
      .style("stroke", (d) => d.search ? this.getFillColor(d.search.type) : null)
      .style("stroke-width", 3)

  node.append("svg:image")
      .attr('x', -circleSize/2 - 7)
      .attr('y', -circleSize/2)
      .attr('width', circleSize*1.7)
      .attr('height', circleSize*1.7)
      .attr("border-radius", '50%')
      .attr("xlink:href", (d) => `${d.poster}`)

      node.append("text")
          .attr("dx", -20).attr("dy", -37)
          .text(function(d) { return d.title })
          .style("font-size", "12px")
          .style("fill", (d) => d.type === 'primary' ? "#e8eaed" : "#262728")
          .attr("class", (d) => `${d.title.replace(/\W+/g, " ")}`)

} else {

  node.append("circle")
      .attr("r", (d) => this.getNodeSize(d.type))
      .attr("fill", (d) => d.common ? '#a32837' : this.getFillColor(d.type))
      .attr("class", (d) => `${d.title.replace(/\W+/g, " ")} node`)
      .style("stroke", (d) => d.search ? this.getFillColor(d.search.type) : null)
      .style("stroke-width", 3)

  node.append("text")
      .attr("dx", -20).attr("dy", -37)
      .text(function(d) { return d.title })
      .style("font-size", "12px")
      .style("fill", (d) => d.type === 'primary' ? "#e8eaed" : "#262728")
      .attr("class", (d) => `${d.title.replace(/\W+/g, " ")}`)
}

    node.on('click', d => {
      console.log('SELECTED', d)
      let movie = d.title;
      var relatedLinks = this.state.blinks.filter(link => {
        return link.source.name === movie || link.target.name === movie;
      })

      $('.link').css('display', 'none')
      $(`.${movie.replace(/\W+/g, " ")}.link`).toggle();

      this.sendRequestForMovies(d.title, 'secondary');
      this.setState({
        selectedMovie: d
      })

    });

    node.on('mouseover', d => {
      this.setState({
        selectedMovie: d
      })
    })

      sim.on("tick", function() {
        link.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) {
          var xcoord = d.x > width / 2 ? Math.min(d.x, width-circleSize) : Math.max(circleSize, d.x);
          var ycoord = d.y > height / 2 ? Math.min(d.y, height-(circleSize+10)) : Math.max(circleSize, d.y);
          return "translate(" + xcoord + "," + ycoord + ")"; });
        // svg.selectAll("g").attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });

  };

  getFillColor(type) {
    var colors = {
      primary: "#140872",
      secondary: "#674a99",
      conn: "#367d9b"
    }
    return colors[type];
  }

  getNodeSize(type) {
    let circleSize = this.props.settings.circleSize || 22;
    var sizes = {
      "primary": circleSize*2.5,
      "secondary": circleSize*1.7,
      "conn": circleSize*1.5
    }
    return sizes[type];
  }

  applySurchCb(surchArr) {
    console.log('SURCH ARR', surchArr)
    this.sendRequestForMovies(surchArr[0], 'primary')
  };

  resetSurchCb() {
    this.setState({
      artists: this.state.artistsLibrary,
      links: this.state.linksLibrary
    }, () => {
      this.generateCharts();
    })
  }

  render() {
    return (
        <Grid fluid={true}>

          <Row>

            <Col md={8} className="show-grid">
              <div id='canvas' style={border}></div>
            </Col>

            <Col md={4} style={border}>

              <Row className="show-grid">
                  <InfoPanel selectedMovie={this.state.selectedMovie} selectedLink={this.state.selectedLink}
                    display={this.state.display} movies={this.state.movies}
                    links={this.state.links}
                    infoPanelCallback={this.infoPanelCallback}
                    />
              </Row>

              <Row className="show-grid">
                  <Surch allArtists={this.state.artistsLibrary} applySurchCb={this.applySurchCb} reset={this.resetSurchCb}/>
              </Row>

            </Col>

          </Row>

        </Grid>
    )
  }

};

const border = {
  // border: 'solid black 1px'
}

export default VizPanel;
