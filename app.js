const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');

const port = 3000;
const app = express();

console.log('hello graphql');

app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type RootQuery {
            events: [String!]!
        }

        type RootMutation {
            createEvent(name: String): String
        }

        schema { 
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: { //resolvers as per types
        events: () => {
            return ['Romantic Cooking', 'Dancing', 'Coding'];
        },
        createEvent: (args) => {
            const eventName = args.name;
            return eventName;
        }
    },
    graphiql: true
}))

app.listen(port);