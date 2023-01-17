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

  console.log({ user });
}

getUserByJwt();
