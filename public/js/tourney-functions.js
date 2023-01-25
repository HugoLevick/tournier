let params = new URL(document.location).searchParams;
let tourney;
const term = params.get('term').toLowerCase();
if (!term) window.location = '/';
let signUpTeam = [];

const titleLbl = document.querySelector('.general__title');
const hostGameLbl = document.querySelector('.general__host-game');
const prizeLbl = document.getElementById('prize-square');
const tiersLbl = document.getElementById('tiers-square');
const startsAt = document.getElementById('time-square');
const signUpButton = document.querySelector('.sign-up-button');
const peopleTable = document.querySelector('.player-table');
const spinnerHtml =
  '<div class="lds-grid square-spinner""><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>';
const playerTablePH = `
          <div
            id="player-table-placeholder"
            class="container-center"
            style="opacity: 60%"
          >
            Looks like no one is here... yet 👀
          </div>`;

const signUpTeamHtml = `
  <div class="container-center sign-up-main">
    <div class="sign-up-members">
      <div>Members</div>
    </div>
    <div class="sign-up-select">
      <input type="text" class="popup-search-player" placeholder="Search players...">
      <div class="player-list"></div>
    </div>
  </div>
`;

function addSignUpHtml(player, captain = false) {
  const members = document.querySelector('.sign-up-members');
  //prettier-ignore
  members.innerHTML += getSignUpMemberHtml(player, true, captain);
}

function addSignUpMember(username, pfp) {
  if (signUpTeam.length === tourney.peoplePerTeam - 1) {
    SignUpAlert.showValidationMessage('Maxmimum number of players reached');
    setTimeout(() => {
      try {
        SignUpAlert.resetValidationMessage();
      } catch (e) {}
    }, 3000);
    return;
  }
  const player = {
    twitchUsername: username,
    twitchProfileImageUrl: pfp,
  };
  if (!signUpTeam.find((p) => p === username)) {
    const input = document.querySelector('.popup-search-player');
    input.value = '';
    input.focus();
    signUpTeam.push(username);
  }
  if (signUpTeam.length === tourney.peoplePerTeam - 1) {
    const popUpSignUpBtn = document.querySelector('.sign-up-confirm');
    popUpSignUpBtn.disabled = false;
  }
  addSignUpHtml(player);
  doneTyping();
}

function removeSignUpMember(username) {
  const playerHtml = document.getElementById(`su-${username}`);
  signUpTeam = signUpTeam.filter((u) => u !== username);
  if (playerHtml) playerHtml.remove();
  const popUpSignUpBtn = document.querySelector('.sign-up-confirm');
  popUpSignUpBtn.disabled = true;
  doneTyping();
}

function getTeamHtml(team) {
  if (team.members.length === 1) {
    const player = team.captain;
    return `
      <div class="player-trow" id="${team.id}">
        <div class="container-center">
          <div
            class="player-table-pfp"
            style="background-image: url('${player.twitchProfileImageUrl.replaceAll(
              '300',
              '50',
            )}');"
          >
          </div>
          ${player.twitchUsername}
        </div>
        <div class="container-center">${
          tourney.tiered ? team.tier : 'N/A'
        }</div>
        <div class="container-center">Coming soon</div>
      </div>
    `;
  } else {
    const player = team.captain;
    return `
      <div class="player-trow" id="${team.id}">
        <div class="container-center">
          <div
            class="player-table-pfp"
            style="background-image: url('${player.twitchProfileImageUrl.replaceAll(
              '300',
              '50',
            )}');"
          >
          </div>
          ${player.twitchUsername}'s team (${team.members.map(
      (u) => u.twitchUsername,
    )})
        </div>
        <div class="container-center">${
          tourney.tiered ? team.tier : 'N/A'
        }</div>
        <div class="container-center">Coming soon</div>
      </div>
    `;
  }
}

async function signUp() {
  let response;
  if (tourney?.peoplePerTeam === 1) {
    response = await fetch(`/api/tourneys/${tourney.id}/signup`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + jwt,
      },
    });
  } else {
    const popUpResult = await SignUpAlert.fire(
      'PICK YOUR TEAM',
      signUpTeamHtml,
    );

    if (!popUpResult.isConfirmed) {
      signUpTeam = [];
    }
    if (signUpTeam.length !== tourney.peoplePerTeam - 1) return;

    const teamMembers = JSON.stringify({ members: signUpTeam });
    response = await fetch(`/api/tourneys/${tourney.id}/signup`, {
      method: 'POST',
      body: teamMembers,
      headers: {
        Authorization: 'Bearer ' + jwt,
        'Content-Type': 'application/json',
      },
    });
  }
  if (response.ok) {
    Alert.fire('You joined the tourney!', '', 'success');
  } else {
    const json = await response.json();
    switch (response.status) {
      case 401:
      case 403:
        Alert.fire('Whoops!', 'Please log-in to join', 'error');
        break;
      default:
        Alert.fire('Whoops!', json.message, 'error');
    }
  }
}

async function signOut() {
  let response = await fetch(`/api/tourneys/${tourney.id}/signout`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + jwt,
    },
  });

  if (response.ok) {
    Alert.fire('You left the tourney!', '', 'success');
  } else {
    const json = await response.json();
    switch (response.status) {
      case 401:
      case 403:
        Alert.fire('Whoops!', 'Please log-in to join', 'error');
        break;
      default:
        Alert.fire('Whoops!', json.message, 'error');
    }
  }
}

async function doneTyping() {
  const search = document.querySelector('.popup-search-player').value;
  const list = document.querySelector('.player-list');
  list.innerHTML = spinnerHtml;
  let users;
  if (!search) users = [];
  else {
    users = await fetch('/api/auth/search/' + search).then((res) => res.json());
  }
  list.innerHTML = '';
  if (users.length === 0) {
    list.innerHTML = 'No players...';
    return;
  }
  for (const player of users) {
    if (
      player.twitchUsername !== user.twitchUsername &&
      !signUpTeam.includes(player.twitchUsername)
    )
      list.innerHTML += getSignUpMemberHtml(player);
  }
}

function addNewTeam(team) {
  const placeholder = document.getElementById('player-table-placeholder');
  if (
    team.captain.id === user?.id ||
    (team.verifiedInvites && isInTeamMembers(user?.id, team))
  )
    setSignOutButton();

  if (placeholder) placeholder.remove();
  peopleTable.innerHTML += getTeamHtml(team);
}

function removeTeam(team) {
  if (
    team.captain.id === user?.id ||
    (team.verifiedInvites && isInTeamMembers(user?.id, team))
  )
    setSignUpButton();
  const teamHtml = teamInDocument(team.id);
  teamHtml?.remove();
}

function getSignUpMemberHtml(player, removeButton = false, captain = false) {
  //prettier-ignore
  return `
    <div class="sign-up-player" id="su-${player.twitchUsername}" ${!removeButton ? `onclick="addSignUpMember('${player.twitchUsername}', '${player.twitchProfileImageUrl}')" style="cursor:pointer;"`: ''}>
      <div class="su-player-pfp" style="background-image: url('${player.twitchProfileImageUrl}')"></div>
      <div class="su-player-username">
        ${player.twitchUsername}
      </div>

    ${removeButton
      ? `
      <div class="su-player-action">
        <button onclick="removeSignUpMember('${player.twitchUsername}')" ${captain? 'disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="fa-icon-sm"><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg></button>
      </div>`
      :`
      <div class="su-player-action">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="fa-icon-sm"><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>
      </div>
      `}

    </div>
  `
}

function setSignOutButton() {
  signUpButton.innerHTML = 'Sign Out';
  signUpButton.setAttribute('onclick', 'signOut()');
}

function setSignUpButton() {
  signUpButton.innerHTML = 'Sign Up';
  signUpButton.setAttribute('onclick', 'signUp()');
}

function isInTeamMembers(userId, team) {
  for (const member of team.members) {
    if (member.id === userId) return true;
  }
  return false;
}

function teamInDocument(teamId) {
  return document.getElementById(teamId);
}
