const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/events');
const User = require('./models/user');

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
        type User {
            _id: ID!
            email: String!
            password: String
        }
        
        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }
        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
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
                date: new Date(args.eventInput.date),
                creator: '5e051f50ef2f5039e432105c'
            })
            let createdEvent;
            return event
                .save()
                .then(result => {
                    createdEvent = { ...result._doc }
                    return User.findById('5e051f50ef2f5039e432105c')
                })
                .then((user) => {
                    if (!user) {
                        throw new Error('Users does not exist!')
                    }
                    user.createdEvents.push(event);
                    return user.save()
                })
                .then(() => {
                    return createdEvent;
                })
                .catch(err => {
                    console.log('error saving event to db', err);
                    throw err;
                })
            return event
        },
        createUser: (args) => {
            return User.findOne({ email: args.userInput.email })
                .then((user) => {
                    if (user) {
                        throw new Error('User exists already.')
                    }
                    return bcrypt
                        .hash(args.userInput.password, 12)
                })
                .then((hashedPassword) => {
                    const user = new User({
                        email: args.userInput.email,
                        password: hashedPassword
                    });
                    return user.save()
                        .then(result => {
                            return { ...result._doc, password: null }
                        })
                        .catch(err => {
                            console.log('error while saving the user', err);
                        })
                })
                .catch(err => {
                    console.log('error encrypting password', err);
                    throw err;
                })

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
