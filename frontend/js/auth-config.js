window.LearnByShortsAuthConfig = Object.freeze({
    region: 'us-east-1',
    userPoolId: 'us-east-1_a6XkchTUa',
    clientId: '2bvm2h0pcvs015mctgv92uhbdm',
    domain: 'https://learnbyshorts-v3-464994449735.auth.us-east-1.amazoncognito.com',
    redirectUri: `${window.location.origin}/auth/callback.html`,
    logoutUri: `${window.location.origin}/`,
    apiBaseUrl: 'https://iheztk69z7.execute-api.us-east-1.amazonaws.com',
    scopes: Object.freeze(['openid', 'email', 'profile']),
    // Keep this list aligned with Cognito's SupportedIdentityProviders.
    // Never show a social sign-in button until its provider is configured.
    identityProviders: Object.freeze(['COGNITO'])
});
