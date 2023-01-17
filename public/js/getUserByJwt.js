const loginAnchor = document.getElementById('login-anchor');
let jwt, user;

async function getUserByJwt() {
  jwt = localStorage.getItem('JWT');

  if (jwt) {
    user = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + jwt,
      },
    }).then(async (response) => {
      if (response.status === 200) return await response.json();
    });

    if (loginAnchor && user) {
      loginAnchor.href = '/auth/logout.html';
      loginAnchor.innerHTML = `Heya, ${user.twitchUsername}!`;
    }
  }

  if (!user) {
    loginAnchor.href = `https://id.twitch.tv/oauth2/authorize?client_id=cygujur0ps52ov7fguxb8tix06wa7z&redirect_uri=${location.origin}/auth/twitch-oauth.html&response_type=code&scope=user:read:email`;
  }

  console.log({ user });
}

getUserByJwt();
