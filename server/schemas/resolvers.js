const { AuthenticationError } = require('apollo-server-express');
const { User, Thought } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
              const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('thoughts')
                .populate('friends');
      
              return userData;
            }
      
            throw new AuthenticationError('Not logged in');
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
        thoughts: async (parent, { username }) => {
            const params = username ? { username } : {};
            return Thought.find(params).sort({ createdAt: -1 });
        },
        thought: async (parent, { _id }) => {
            return Thought.findOne({ _id });
        }  
    },
    
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
      
            if (!user) {
              throw new AuthenticationError('Incorrect credentials');
            }
      
            const correctPw = await user.isCorrectPassword(password);
      
            if (!correctPw) {
              throw new AuthenticationError('Incorrect credentials');
            }
      
            const token = signToken(user);
            return { token, user };
        },
        addThought: async (parent, args, context) => {
            if (context.user) {
              const thought = await Thought.create({ ...args, username: context.user.username });
      
              await User.findByIdAndUpdate(
                { _id: context.user._id },
                { $push: { thoughts: thought._id } },
                { new: true }
              );
      
              return thought;
            }
      
            throw new AuthenticationError('You need to be logged in!');
        },
        addReaction: async (parent, { thoughtId, reactionBody }, context) => {
            if (context.user) {
              const updatedThought = await Thought.findOneAndUpdate(
                { _id: thoughtId },
                { $push: { reactions: { reactionBody, username: context.user.username } } },
                { new: true, runValidators: true }
              );
      
              return updatedThought;
            }
      
            throw new AuthenticationError('You need to be logged in!');
        },
        addFriend: async (parent, { friendId }, context) => {
            if (context.user) {
              const updatedUser = await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { friends: friendId } },
                { new: true }
              ).populate('friends');
      
              return updatedUser;
            }
      
            throw new AuthenticationError('You need to be logged in!');
        }
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