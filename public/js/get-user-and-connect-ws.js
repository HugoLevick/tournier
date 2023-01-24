const loginAnchor = document.getElementById('login-anchor');
let jwt, user;

async function getUserByJwt() {
  jwt = localStorage.getItem('JWT');
  console.log(jwt);
  if (jwt && jwt != 'undefined') {
    connectToAlertsWs(jwt);
    const userResponse = await fetch('/api/auth/validate', {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + jwt,
      },
    });

    if (!userResponse.ok) {
      localStorage.removeItem('JWT');
    } else {
      user = await userResponse.json();
    }

    if (loginAnchor && user) {
      delete loginAnchor.href;
      loginAnchor.style.display = 'flex';
      loginAnchor.style.alignItems = 'center';
      loginAnchor.style.justifyContent = 'center';
      loginAnchor.style.gap = '1rem';
      loginAnchor.innerHTML = `Heya, ${user.twitchUsername}!
      <a href='/auth/logout.html'>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" class="fa-icon-m"><path d="M534.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L434.7 224 224 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128zM192 96c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-53 0-96 43-96 96l0 256c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z"/></svg>
      </a>`;
    }
  }

  if (!user) {
    loginAnchor.href = `https://id.twitch.tv/oauth2/authorize?client_id=cygujur0ps52ov7fguxb8tix06wa7z&redirect_uri=${location.origin}/auth/twitch-oauth.html&response_type=code&scope=user:read:email`;
    loginAnchor.innerHTML = 'Login with Twitch';
    signUpButton.innerHTML = 'Log In';
    signUpButton.setAttribute('onclick', '');
    signUpButton.disabled = true;
  }

  console.log({ user });
}

async function connectToAlertsWs(jwt) {
  const socket = io('/alerts', {
    extraHeaders: {
      authentication: jwt,
    },
  });

  socket.on('connect', () => {
    console.log('connected');
  });

  socket.on('disconnect', () => {
    console.log('disconnected');
  });
}

getUserByJwt();
