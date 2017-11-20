import React from 'react';
import * as d3 from 'd3';
import InfoPanel from './InfoPanel';
import Surch from '../Surch/Surch';
import InitialSurch from './InitialSurch';
import {Grid, Row, Col} from 'react-bootstrap';
import $ from 'jquery';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';

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
      history: [],
      initial: true,
      initSurch: ''
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
    this.setState({
      allMovies: initialSuggestions.nodes
    }, this.generateCharts)
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
        type: type,
        surchCount: this.state.surchCount,
        children: [],
        parent: {}
      }
      var movieNum = this.props.settings.movieNumber || 4;

      var newSim = resp.data.data.movie.similar.slice(0, movieNum).map(movie => {
        movie['search'] = mov;
        movie['rel'] = 'sim';
        movie['type'] = 'conn';
        movie['surchCount'] = this.state.surchCount;
        movie['parent'] = mov;
        movie['children'] = [];
        return movie
      });

      var newRec = resp.data.data.movie.recommendations.slice(0, movieNum).map(movie => {
        movie['search'] = mov;
        movie['rel'] = 'rec';
        movie['type'] = 'conn'
        movie['surchCount'] = this.state.surchCount
        movie['parent'] = mov;
        movie['children'] = [];
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
      // console.log('INCOMING P&C', primaryAndConnections)

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

        mov['parent'] = null;
        mov['children'] = primaryAndConnections.slice(1)

        let historyObj = {
          "main": mov,
          "nodes": primaryAndConnections
        }

        this.setState({
          selectedMovie: mov,
          allMovies: primaryAndConnections,
          blinks: firstTimeLinks,
          display: 'viz',
          surchCount: this.state.surchCount+1,
          history: [historyObj]
        }, () => {
          console.log('state set', this.state)
          this.generateCharts();
        })

      } else if (this.state.allMovies.length > 0 && type === 'secondary') {
        //get first half of movies from last level of history
        var historyCopy = this.state.history.slice(-2);
        // console.log('history copy', historyCopy)
        var tempTitles = [];
        var originalNodes = [];
        historyCopy.forEach(search => {
          // console.log('SEARCH', search)
          var uniqueNodes = search.nodes.filter(movie => !tempTitles.includes(movie.title));
          originalNodes = originalNodes.concat(uniqueNodes.slice(0, 4));
          let tempTitlesUpdate = originalNodes.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);
          tempTitles = tempTitlesUpdate;
        })

        // remove secondary node from initial allMovies

        // var originalNodesTitles = originalNodes.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);
        var originalNodesTitles = tempTitles;
        var indexOfNodeToRemove = originalNodesTitles.indexOf(mov.title);
        var removedNode = originalNodes.splice(indexOfNodeToRemove, 1);
        originalNodesTitles.splice(indexOfNodeToRemove, 1);

        //compare existing connections and new commections for matches
        var newConnections = primaryAndConnections.slice(1);
        newConnections.forEach((mov, i) => {
          if (originalNodesTitles.includes(mov.title)) {
            let indOfCommonInEdited = originalNodesTitles.indexOf(mov.title);
            let nodeToRemove = originalNodes[indOfCommonInEdited]
            // console.log('NODE TO REMOVE', nodeToRemove)
            if (nodeToRemove && nodeToRemove.type !== 'primary' && nodeToRemove.type !== 'secondary') {
              var removed = originalNodes.splice(indOfCommonInEdited, 1);
              // console.log('REMOVED FOR COMMON', removed)
              mov["common"] = {
                "count": 1,
                "movies": [this.state.selectedMovie, mov]
              }
              this.toggleNotification(mov)
            } else {
              if(nodeToRemove) primaryAndConnections.splice(i+1, 1)
            }
          }
        });

        primaryAndConnections[0]['parent'] = historyCopy[historyCopy.length-1].main
        primaryAndConnections[0]['children'] = primaryAndConnections.slice(1);

        // console.log('NEW CHILDREN', primaryAndConnections[0]['children'])

        // add new primary and connections to nodes list
        var nodes = originalNodes.concat(primaryAndConnections);
        var nodesNames = nodes.reduce((acc, curr) => {acc.push(curr.title); return acc;}, []);

        var links = [];

        var calculateLinks = (node) => {
          if (node.children.length === 0) {
            return;
          } else {
            for (let i = 0; i < node.children.length; i++) {
              let child = node.children[i];
              let tempLinkObj = { source: node, target: child, value: 1 }
              links.push(tempLinkObj)
              if (child.children.length > 0) calculateLinks(child)
            }
          }
        }

        nodes.forEach(calculateLinks);

        // console.log('TREE LINKS', links)

        links = links.filter(link => nodesNames.includes(link.source.title) && nodesNames.includes(link.target.title))

        let historyObj = {
          "main": mov,
          "nodes": primaryAndConnections
        }

        var newHistoryArr = this.state.history.slice();
        newHistoryArr.push(historyObj)

        this.setState({
          selectedMovie: mov,
          allMovies: nodes,
          blinks: links,
          display: 'viz',
          surchCount: this.state.surchCount+1,
          history: newHistoryArr
        }, () => {
          console.log('state set after secondary', this.state)
          this.generateCharts();
        })

      } else if (this.state.allMovies.length > 0 && type === 'primary') {
        console.log('in surch case', q)
        var originalNodes = this.state.allMovies;
        var originalNodesTitles = originalNodes.reduce((acc, curr) => {acc.push(curr.title); return acc}, []);
        mov['parent'] = null;
        //compare for connections
        var newConnections = primaryAndConnections.slice(1);
        newConnections.forEach(mov => {
          if (originalNodesTitles.includes(mov.title)) {
            let indOfCommonInEdited = originalNodesTitles.indexOf(mov.title);
            let nodeToRemove = originalNodes[indOfCommonInEdited]
            if (nodeToRemove && nodeToRemove.type !== 'primary' && nodeToRemove.type !== 'secondary') {
              var removed = originalNodes.splice(indOfCommonInEdited, 1);
              // console.log('REMOVED FOR COMMON', removed)
              mov["common"] = {
                "count": 1,
                "movies": [this.state.selectedMovie, mov]
              }
              this.toggleNotification(mov)
            }
          }
        });

        // add new primary and connections to nodes list
        var newNodes = originalNodes.concat(primaryAndConnections);
        var newNodesTitles = newNodes.reduce((acc, curr) => {acc.push(curr.title); return acc;}, []);
        var indexOfNewPrimary = newNodesTitles.indexOf(mov.title);
        var prevSelected = this.state.history[this.state.surchCount-1].main || null
        var indexOfPrimary = newNodesTitles.indexOf(prevSelected.title)

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

        let newHistoryObj = {
          "main": mov,
          "nodes": primaryAndConnections
        }
        var newHistoryArr = this.state.history.slice();
        newHistoryArr.push(newHistoryObj)

        this.setState({
          selectedMovie: mov,
          allMovies: newNodes,
          blinks: newLinks,
          display: 'viz',
          surchCount: this.state.surchCount+1,
          history: newHistoryArr
        }, () => {
          console.log('state set', this.state)
          this.generateCharts();
        })

      }
    })
   }
  }

  generateCharts() {
    // console.log('starting generate charts')
    var that = this;
    d3.select('#canvas').selectAll('svg').remove();

    var width = 800,
        height = 700

    var svg = d3.select("#canvas").append("svg")
        .attr("width", width)
        .attr("height", height);

    var linkDistance = this.props.settings.linkDistance || 220;
    var circleSize = this.props.settings.circleSize || 22;
    var label = this.props.settings.label || 'image';
    var center = this.state.initial ? [480, 350] : [400, 350]

    var sim = d3.forceSimulation(this.state.allMovies)

    .force("link", d3.forceLink(this.state.blinks)
      .distance((d) => {
        return d.value > 0 ? linkDistance/(d.value) : linkDistance;
      })
      // .strength((d) => {
      //   return d.value > 0 ? d.value*2 : 1;
      // })
      )
    .force("charge", d3.forceManyBody().strength(-130))
    .force("center", d3.forceCenter(center[0], center[1]))
    .force("gravity", d3.forceManyBody().strength(50))

    // .force("distance", d3.forceManyBody(100))

    .force('collision', d3.forceCollide().radius((d) => {
      return this.getNodeSize(d)+55
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

      d3.forceCenter([400, 350]);

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

var colors = {
  0: '#424874',
  1: '#6D435A',
  2: '#84BCDA',
  3: '#0C6291',
  4: '#5C6672',
  5: '#3A435E',
  6: '#5D5179',
  7: '#75B9BE',
  8: '#FBFEF9',
  9: '#B5CBB7',
  10: '#A18276'
}

if (label === 'image') {

  node.append("circle")
      .attr("r", (d) => this.getNodeSize(d))
      .attr("fill", (d) => d.common ? '#a32837' : colors[d.surchCount])
      .attr("class", (d) => `${d.title.replace(/\W+/g, " ")} node`)
      .style("stroke", (d) => d.search ? this.getFillColor(d.search.type) : null)
      .style("stroke-width", 3)

if (!this.state.initial) {
  node.append("svg:image")
  .attr('x', d => -this.getNodeSize(d)/2 - 7)
  .attr('y', d => -this.getNodeSize(d)/2)
  .attr('width', d => this.getNodeSize(d)*1.3)
  .attr('height', d => this.getNodeSize(d)*1.3)
  .attr("border-radius", '50%')
  .attr("xlink:href", (d) => `${d.poster}`)
}

      node.append("text")
          .attr("dx", -20).attr("dy", -37)
          .text(function(d) { return d.title })
          .style("font-size", "12px")
          .style("fill", (d) => d.type === 'primary' ? "#e8eaed" : "#262728")
          .attr("class", (d) => `${d.title.replace(/\W+/g, " ")}`)

} else {

  node.append("circle")
      .attr("r", (d) => this.getNodeSize(d))
      .attr("fill", (d) => d.common ? '#a32837' : colors[d.surchCount])
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

      if (this.state.initial) {
        console.log('in initial node on click', d)
        this.setState({
          allMovies: [],
          initial: false,
          initSurch: d.title
        }, () => {
          this.sendRequestForMovies(d.title, 'primary')
        })
      } else {
        let movie = d.title;
        var relatedLinks = this.state.blinks.filter(link => {
          return link.source.name === movie || link.target.name === movie;
        })

        $('.link').css('display', 'none')
        $(`.${movie.replace(/\W+/g, " ")}.link`).toggle();

        this.setState({
          selectedMovie: d
        }, () => {
          this.sendRequestForMovies(d.title, 'secondary');
        })
      }
    });

    node.on('mouseover', d => {
      this.setState({
        selectedMovie: d
      })
    })

      sim.on("tick", function() {

        link.attr("x1", d =>  d.source.x > width / 2 ? Math.min(d.source.x-30, width-(circleSize+30)) : Math.max(circleSize+25, d.source.x+25))
            .attr("y1", d =>  d.source.y > height / 2 ? Math.min(d.source.y-30, height-(circleSize+30)) : Math.max(circleSize+30, d.source.y+30))
            .attr("x2", d =>  d.target.x > width / 2 ? Math.min(d.target.x-30, width-(circleSize+30)) : Math.max(circleSize+25, d.target.x+25))
            .attr("y2", d => d.target.y > height / 2 ? Math.min(d.target.y-30, height-(circleSize+30)) : Math.max(circleSize+30, d.target.y+30))

        node.attr("transform", function(d) {
          var xcoord = d.x > width / 2 ? Math.min(d.x-30, width-(circleSize+30)) : Math.max(circleSize+25, d.x+25);
          var ycoord = d.y > height / 2 ? Math.min(d.y-30, height-(circleSize+30)) : Math.max(circleSize+30, d.y+30);
          return "translate(" + xcoord + "," + ycoord + ")"; });
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

  getNodeSize(d) {
    let circleSize = this.props.settings.circleSize || 22;
    if (d.common) return circleSize*2.2
    var sizes = {
      "primary": circleSize*2.5,
      "secondary": circleSize*2,
      "conn": circleSize*1.5
    }
    return sizes[d.type];
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

  toggleNotification = (mov) => {
    toast(`Nice one! You found a mutually related movie, ${mov.title || ''}`, {className: 'commonNotif'})
  }

  initialSurch = (val) => {
    console.log('INITIAL', val)
    this.setState({
      initial: false,
      initSurch: val
    }, () => {
      this.sendRequestForMovies(val, 'primary');
    })
  }

  render() {
    return (
        <Grid fluid={true}>

          <Row>


            <Col md={8} className="show-grid">
              <div id='canvas' style={border}>
                {this.state.initial ? <InitialSurch initialSurch={this.initialSurch} /> : ''}
              </div>
            </Col>

            <Col md={4} style={border}>

              <Row className="show-grid">
                  {this.state.initial ? '' : <InfoPanel selectedMovie={this.state.selectedMovie} selectedLink={this.state.selectedLink}
                    display={this.state.display} movies={this.state.movies}
                    links={this.state.links}
                    infoPanelCallback={this.infoPanelCallback}
                    />}
              </Row>

              <Row className="show-grid">
                  {this.state.initial ? '' : <Surch allArtists={this.state.artistsLibrary} applySurchCb={this.applySurchCb} reset={this.resetSurchCb} history={this.state.history} initSurch={this.state.initSurch}/>}
              </Row>

            </Col>

          </Row>
          <ToastContainer
            position="top-right"
            autoClose={10000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
        />
        </Grid>
    )
  }

};

const border = {
  // border: 'solid black 1px'
}

const initialSuggestions = {
  "nodes": [
    {"title": "The Godfather", type: 'conn', surchCount: 1},
    {"title": "Rango", type: 'conn', surchCount: 1},
    {"title": "Ant man", type: 'conn', surchCount: 1},
    {"title": "The Other Guys", type: 'conn', surchCount: 1},
    {"title": "The Hobbit", type: 'conn', surchCount: 1}
  ]
}

export default VizPanel;
