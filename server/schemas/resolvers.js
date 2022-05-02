const { User } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({
          _id: context.user._id
        }).select(
          '-__v -password'
        );

        return userData;
      }

      throw new AuthenticationError('You must first log in.');
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      const newUser = await User.create(args);
      const token = signToken(newUser);

      return {
        token,
        newUser
      };
    },
    login: async (parent, {
      email,
      password
    }) => {
      const user = await User.findOne({
        email
      });

      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const correctPass = await user.isCorrectPassword(password);

      if (!correctPass) {
        throw new AuthenticationError('Invalid credentials');
      }

      const token = signToken(user);
      return {
        token,
        user
      };
    },
    saveBook: async (parent, {
      input
    }, context) => {
      if (context.user) {
        const userToUpdate = await User.findByIdAndUpdate({
          _id: context.user._id
        }, {
          $addToSet: {
            savedBooks: input
          }
        }, { new: true });
        return userToUpdate;
      }
      throw new AuthenticationError('You must first log in.');
    },
    removeBook: async (parent, args, context) => {
      if (context.user) {
        const userToUpdate = await User.findOneAndUpdate({
          _id: context.user._id
        }, {
          $pull: {
            savedBooks: {
              bookId: args.bookId
            }
          }
        }, { new: true });
        return userToUpdate;
      }
      throw new AuthenticationError('You must first log in.');
    }
  }
};

module.exports = resolvers;
