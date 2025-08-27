// services/preferencesService.js
const User = require('../models/User');

async function updateUserPreferences(userId, patch) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  await user.updatePreferences(patch); // <- helper ที่เราใส่ใน model
  return user.preferences;
}

module.exports = { updateUserPreferences };
