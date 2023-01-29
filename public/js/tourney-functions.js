const titleLbl = document.querySelector('.general__title');
const hostGameLbl = document.querySelector('.general__host-game');
const prizeLbl = document.getElementById('prize-square');
const tiersLbl = document.getElementById('tiers-square');
const startsAt = document.getElementById('time-square');
const signUpButton = document.querySelector('.sign-up-button');
const peopleTable = document.querySelector('.player-table');
const clockIcon =
  '<path d="M232 120C232 106.7 242.7 96 256 96C269.3 96 280 106.7 280 120V243.2L365.3 300C376.3 307.4 379.3 322.3 371.1 333.3C364.6 344.3 349.7 347.3 338.7 339.1L242.7 275.1C236 271.5 232 264 232 255.1L232 120zM256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0zM48 256C48 370.9 141.1 464 256 464C370.9 464 464 370.9 464 256C464 141.1 370.9 48 256 48C141.1 48 48 141.1 48 256z"/>';
const checkIcon =
  '<path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>';
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
    <div id="${team.id}">
      <div class="player-trow collapsible" onclick="displayCollapsible(this)">
        <div class="container-center">
          <div
            class="player-table-pfp"
            style="background-image: url('${player.twitchProfileImageUrl.replaceAll(
              '300',
              '50',
            )}');"
          >
          </div>
          ${
            player.twitchUsername
          }'s team &nbsp;&nbsp;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm secondary-icon"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
        </div>
        <div class="container-center">${
          tourney.tiered ? team.tier : 'N/A'
        }</div>
        <div class="container-center">Coming soon</div>
      </div>

      <div class="team-collapsible collapsible-content">
        ${getTeamMembersHtml(team.members, team.invited)}
    </div
    `;
  }
}

function getTeamMembersHtml(members = [], invites = [], size) {
  html = '';
  for (const m of members) {
    const mInv = invites.find(
      (i) => i.toUser.twitchUsername === m.twitchUsername,
    );
    let invHtml = '';
    if (mInv) {
      invHtml = mInv.accepted
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class='fa-icon-sm green-icon' id='${m.twitchUsername}-status'><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->${checkIcon}</svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class='fa-icon-sm secondary-icon' id='${m.twitchUsername}-status'><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->${clockIcon}</svg>`;
    }
    html += `
      <div class="table-team">
        <div class="container-center">
          <div
            class="player-table-pfp"
            style="background-image: url('${m.twitchProfileImageUrl.replaceAll(
              '300',
              '50',
            )}');"
          ></div>
          <div style="display:flex; gap: 1rem;">${
            m.twitchUsername
          } ${invHtml}</div>
        </div>

        ${size === 'compact' ? '' : '<div>Gamertag</div>'}
      </div>
    `;
  }

  return html;
}

async function signUp() {
  signUpButton.disabled = true;
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
      signUpButton.disabled = false;
    }

    if (signUpTeam.length !== tourney.peoplePerTeam - 1) return;

    signUpButton.innerHTML = getSpinnerHtml(2);
    const teamMembers = JSON.stringify({ members: signUpTeam });
    response = await fetch(`/api/tourneys/${tourney.id}/signup`, {
      method: 'POST',
      body: teamMembers,
      headers: {
        Authorization: 'Bearer ' + jwt,
        'Content-Type': 'application/json',
      },
    });

    signUpTeam = [];
  }

  if (response.ok) {
    Alert.fire('You joined the tourney!', '', 'success');
  } else {
    const json = await response.json();
    switch (response.status) {
      case 401:
      case 403:
        Alert.fire('Whoops!', 'Please log-in to join', 'error');
        signUpButton.innerHTML = 'Sign Up';
        break;
      default:
        Alert.fire('Whoops!', json.message, 'error');
        signUpButton.innerHTML = 'Sign Up';
    }
  }
  signUpButton.disabled = false;
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
  list.innerHTML = getSpinnerHtml(2);
  let users;
  if (!search) users = [];
  else {
    users = await fetch('/api/auth/search/' + search.trim().toLowerCase()).then(
      (res) => res.json(),
    );
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

async function addNewTeam(team) {
  const placeholder = document.getElementById('player-table-placeholder');
  const acceptedInvite = team.invited.filter((inv) => {
    return inv.accepted && inv.toUser.twitchUsername === user.twitchUsername;
  });

  console.log(acceptedInvite);

  if (
    team.captain.id === user?.id ||
    acceptedInvite.length > 0 ||
    (team.verifiedInvites && isInTeamMembers(user?.id, team))
  ) {
    setSignOutButton();
  }

  if (placeholder) placeholder.remove();
  peopleTable.innerHTML += getTeamHtml(team);
}

function removeTeam(team) {
  if (team.captain?.id === user?.id || isInTeamMembers(user?.id, team))
    setSignUpButton();
  const teamElement = teamInDocument(team.id);
  teamElement?.remove();
}

function changeStatus(username) {
  if (username === user?.twitchUsername) setSignOutButton();
  const icon = document.getElementById(username + '-status');
  icon.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class='fa-icon-sm green-icon' id='${username}-status'><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->${checkIcon}</svg>`;
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
        <button onclick="removeSignUpMember('${player.twitchUsername}')" ${captain? 'disabled' : ''}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="fa-icon-sm"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg></button>
      </div>`
      :`
      <div class="su-player-action">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="fa-icon-sm"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"/></svg>
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
