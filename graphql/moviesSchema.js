const axios = require('axios');

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLFloat
} = require('graphql');

const MovieDetailedType = new GraphQLObjectType({
  name: 'detailed',
  description: '...',
  fields: () => ({
    runtime: {
      type: GraphQLInt,
      resolve: res => res.runtime
    },
    website: {
      type: GraphQLString,
      resolve: res => res.homepage
    },
    budget: {
      type: GraphQLInt,
      resolve: res => res.budget
    },
    revenue: {
      type: GraphQLInt,
      resolve: res => res.revenue
    },
    tagline: {
      type: GraphQLString,
      resolve: res => res.tagline
    }
  })
})

const KeywordsType = new GraphQLObjectType({
  name: 'keywords',
  description: '...',
  fields: () => ({
    id: {
      type: GraphQLInt,
      resolve: res => res.id
    },
    word: {
      type: GraphQLString,
      resolve: res => res.name
    }
  })
})

const MovieType = new GraphQLObjectType({
  name: 'movie',
  description: '...',
  fields: () => ({
    title: {
      type: GraphQLString,
      resolve: res => res.title
    },
    id: {
      type: GraphQLInt,
      resolve: res => res.id
    },
    overview: {
      type: GraphQLString,
      resolve: res => res.overview
    },
    voteAverage: {
      type: GraphQLFloat,
      resolve: res => res.vote_average
    },
    poster: {
      type: GraphQLString,
      resolve: res => 'http://image.tmdb.org/t/p/w185/' + res.poster_path
    },
    details: {
      type: MovieDetailedType,
      resolve: res => axios.get(`https://api.themoviedb.org/3/movie/${res.id}?api_key=434b72bb47d94ac5edfb7fdce66e4a40&language=en-US`)
                      .then(res => res.data)
    },
    similar: {
      type: new GraphQLList(MovieType),
      resolve: res => axios.get(`https://api.themoviedb.org/3/movie/${res.id}/similar?api_key=434b72bb47d94ac5edfb7fdce66e4a40&language=en-US`)
                      .then(res => res.data.results)
    },
    recommendations: {
      type: new GraphQLList(MovieType),
      resolve: res => axios.get(`https://api.themoviedb.org/3/movie/${res.id}/recommendations?api_key=434b72bb47d94ac5edfb7fdce66e4a40&language=en-US`)
                      .then(res => res.data.results)
    },
    keywords: {
      type: new GraphQLList(KeywordsType),
      resolve: res => axios.get(`https://api.themoviedb.org/3/movie/${res.id}/keywords?api_key=434b72bb47d94ac5edfb7fdce66e4a40&language=en-US`)
                      .then(res => res.data.keywords)
    }
  })
})

module.exports = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Movie',
    description: 'tmdb',
    fields: () => ({
      movie: {
        type: MovieType,
        args: {
          title: {type: GraphQLString}
        },
        resolve: (root, args) => {
          var movieName = args.title.replace(/ /g, '+');
          return axios.get(`https://api.themoviedb.org/3/search/movie?api_key=434b72bb47d94ac5edfb7fdce66e4a40&language=en-US&page=1&include_adult=false&query=${movieName}`)
          .then((res) => {
            return res.data.results[0]
          })
          .catch((err) => console.log('ERROR', err))
        }
      }
    })
  })
});
