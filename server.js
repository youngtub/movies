const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const graphqlHTTP = require('express-graphql');
const axios = require('axios');
// const schema = require('./graphql/artistSchema.js');
// const schema = require('./graphql/albumSchema.js');
// const schema = require('./graphql/songSchema.js');
// const schema = require('./graphql/rgSongInfo.js');
const schema = require('./graphql/moviesSchema.js')
const { maskErrors } = require('graphql-errors');
const router = require('./router.js')
// const mongodb = require('./db/mongo.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

app.use(express.static(path.resolve(__dirname, 'client/build')));

maskErrors(schema)
app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

app.use('/api', router)
