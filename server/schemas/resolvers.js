const { User, Thought } = require('../models');

const resolvers = {
    Query: {
        thoughts: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Thought.find(params).sort({ createdAt: -1 });
        },
        thought: async (parent, { _id }) => {
            return Thought.findOne({ _id });
        },
        // get all users
        users: async () => {
            return User.find()
            .select('-__v -password')
            .populate('friends')
            .populate('thoughts');
        },
        // get a user by username
        user: async (parent, { username }) => {
            return User.findOne({ username })
            .select('-__v -password')
            .populate('friends')
            .populate('thoughts');
        },
    }
};

module.exports = resolvers;

// this is what goes into the GraphQL Playground:
// query {
//     query {
//       # get all users
//       users {
//         username
//         email
//       }
    
//       # get a single user by username (use a username from your database)
//       user(username: "Eliezer.VonRueden") {
//         username
//         email
//         friendCount
//         thoughts {
//           thoughtText
//         }
//         friends {
//           username
//         }
//       }
    
//       # query all thoughts
//       thoughts {
//         _id
//         username
//         thoughtText
//         reactions {
//           _id
//           createdAt
//           username
//           reactionBody
//         }
//       }
    
//       # query a single thought (use an _id from a thought in your database)
//       thought(_id: "6064ae8cd0d879168478b4b3") {
//         _id
//         username
//         thoughtText
//         createdAt
//         reactions {
//           username
//           reactionBody
//         }
//       }
//     }