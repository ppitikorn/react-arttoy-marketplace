const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const { JWT_SECRET } = require('./jwt');
const User = require('../models/User');

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: JWT_SECRET
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback",
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // First check if user exists by Google ID
      let user = await User.findOne({
        'oauthProviders.providerId': profile.id,
        'oauthProviders.providerName': 'google'
      });

      if (user) {
        return done(null, user);
      }

      // If not found by Google ID, check if email exists
      const email = profile.emails[0].value;
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
      user = await User.findOne({ email });

      if (user) {      // If user exists with this email, add Google as a provider
        user = await User.findByIdAndUpdate(
          user._id,
          {
            $push: {
              avatar: avatar,
              oauthProviders: {
                providerName: 'google',
                providerId: profile.id,
                accessToken: accessToken,
                refreshToken: refreshToken || ''
              }
            },
            emailVerified: true // Mark email as verified since it's from Google
          },
          { new: true }
        );
        return done(null, user);
      }      // If user doesn't exist at all, create new user
      user = await User.create({
        email: email,
        name: profile.displayName,
        avatar: avatar,
        username: email.split('@')[0], // Generate initial username from email
        emailVerified: true, // Email is verified since it's from Google
        oauthProviders: [{
          providerName: 'google',
          providerId: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken || ''
        }]
      });

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));