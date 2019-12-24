const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');

const Event = require('./models/events');

const port = 3000;
const app = express();

console.log('hello graphql');

app.use(bodyParser.json());

app.use('/graphql', graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
        }

        schema { 
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: { //resolvers: naming as per types
        events: () => {
            return Event
                .find()
                .then((events) => {
                    return events.map(event => {
                        return { ...event._doc }
                    });
                })
                .catch(err => {
                    console.log('error fetching events ', err);
                    throw err;

                })
        },
        createEvent: (args) => {
            const event = new Event({
                title: args.eventInput.title,
                description: args.eventInput.description,
                price: +args.eventInput.price,
                date: new Date(args.eventInput.date)
            })
            return event
                .save()
                .then(result => {
                    console.log('event saved: ', result);
                    return { ...result._doc };
                })
                .catch(err => {
                    console.log('error saving event to db', err);
                    throw err;
                })
            return event
        }
    },
    graphiql: true
}))

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-jh17i.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('connected to db');
        app.listen(port);
    }).catch((error) => {
        console.log('db connection failed: ', error);
    })
