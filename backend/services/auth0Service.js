async function getManagementToken() {
  throw new Error('Auth0 is completely disabled in this environment.');
}

async function fetchAuth0User(auth0Id) {
  throw new Error('Auth0 is completely disabled in this environment.');
}

module.exports = {
  getManagementToken,
  fetchAuth0User
};
