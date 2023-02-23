const titleLbl = document.querySelector('.general__title');
const hostGameLbl = document.querySelector('.general__host-game');
const prizeLbl = document.getElementById('prize-square');
const tiersLbl = document.getElementById('tiers-square');
const startsAt = document.getElementById('time-square');
const signUpButton = document.querySelector('.sign-up-button');
const mainGrid = document.querySelector('.main-content');
const peopleLabel = document.getElementById('people-label');
const teamsLabel = document.getElementById('teams-label');
const infoLabel = document.getElementById('info-label');
let peopleTable,
  teamsTable,
  peoplePerTeamInput = 1;
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

const checkInButtonHtml = `
  <button class="btn green-btn check-in-btn" onclick="checkIn()">
    Check In
  </button>
`;

function isPrivileged() {
  return (
    tourney.creator.id === user?.id || ['OWNER', 'ADMIN'].includes(user?.role)
  );
}

async function showPeople(filterResults = false) {
  let displayTeams;
  if (filterResults === false) {
    peopleLabel.classList.add('active');
    teamsLabel.classList.remove('active');
    infoLabel.classList.remove('active');
    if (tourney.peoplePerTeam === 1) {
      mainGrid.innerHTML = `
      <input class="player-search-bar" placeholder="Search..." oninput="showPeople(true)" id="username-filter"/>
      <div class="player-thead">
        <div class="player-trow h5">
          <div class="container-center">Username</div>
          <div class="container-center">
            Tier&nbsp;  
            <input class="secondary-border" id="tier-filter" type="text" inputmode="numeric" value=0 style="width: 3rem" oninput="showPeople(true)">
          </div>
          <div class="container-center">Actions</div>
        </div>
      </div>
      <div class="player-tbody"></div>`;
    } else {
      mainGrid.innerHTML = `
      <input class="player-search-bar" placeholder="Search..." oninput="showPeople(true)" id="username-filter"/>
      <div class="player-thead">
        <div class="player-trow h5">
          <div class="container-center">Username</div>
          <div class="container-center">
            Tier&nbsp;
            <input class="secondary-border" id="tier-filter" type="text" inputmode="numeric" value=0 style="width: 3rem" oninput="showPeople(true)">
          </div>
        </div>
      </div>
      <div class="player-tbody"></div>`;
    }
    peopleTable = document.querySelector('.player-tbody');
    if (tourney.signUps.length === 0) peopleTable.innerHTML += playerTablePH;
    displayTeams = tourney.signUps;
  } else {
    const usernameFilter = document
      .getElementById('username-filter')
      .value.replaceAll(/[\*\.\{\}]/g, '');
    const tierFilter = parseInt(document.getElementById('tier-filter').value);

    displayTeams = tourney.signUps.filter((team) => {
      let passedUFilter, passedTFilter;
      const filterRegExp = new RegExp(`.*${usernameFilter}.*`);

      if (team.tier == (tierFilter || team.tier)) passedTFilter = true;

      for (member of team.members) {
        if (member.twitchUsername.match(filterRegExp)) passedUFilter = true;
      }

      return passedTFilter && passedUFilter;
    });

    resetPlayerTable();
  }

  if (displayTeams.length === 0) peopleTable.innerHTML += playerTablePH;
  for (const team of displayTeams) {
    addNewSignup(team);
  }
}

function resetPlayerTable() {
  peopleTable.innerHTML = '';
}

function showTeams(filter) {
  if (!filter) {
    peopleLabel.classList.remove('active');
    teamsLabel.classList.add('active');
    infoLabel.classList.remove('active');
    mainGrid.innerHTML = `
    <input class="player-search-bar" placeholder="Search..." />
    <div class="teams-table">
      <div class="player-trow h5">
        <div class="container-center">Teams</div>
        ${
          tourney.creator.twitchUsername === user?.twitchUsername ||
          ['OWNER', 'ADMIN'].includes(user?.role)
            ? `<div class="container-center ppt-group">Fuse teams: <input type="text" inputmode="numeric" value=${peoplePerTeamInput} id="ppt-inp" onkeydown="if(event.keyCode == 13) document.querySelector('.rnd-teams-btn').click()" ></div><button class="btn rnd-teams-btn" onclick="randomizeTeams(this)">Randomize</button>`
            : ''
        }
      </div>
    </div>`;
    teamsTable = document.querySelector('.teams-table');
  }

  for (const team of tourney.teams) {
    teamsTable.innerHTML += getRandomTeamHtml(team);
  }
}

async function randomizeTeams(button) {
  const input = document.getElementById('ppt-inp');
  if (!input) return;
  const peoplePerTeam = parseInt(input.value);
  if (isNaN(peoplePerTeam)) return;

  if (peoplePerTeam > tourney.signUps.length) {
    Alert.fire({
      title: 'Not enough sign ups',
      icon: 'error',
      allowEnterKey: false,
    });
    return;
  }

  if (tourney.signUps.length % peoplePerTeam !== 0) {
    const alertResponse = await Alert.fire({
      title: 'A team will not be full, continue?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      allowEnterKey: false,
    });

    if (!alertResponse.isConfirmed) return;
  }
  peoplePerTeamInput = peoplePerTeam;
  button.disabled = true;
  button.innerHTML = getSpinnerHtml(2.4);

  const body = {
    toFuseQuant: peoplePerTeam,
  };

  response = await fetch(`/api/tourneys/${tourney.id}/randomize`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const json = await response.json();
    Alert.fire('Whoops!', 'Something unexpected happened', 'error');
    console.log(json);
  } else {
  }

  button.disabled = false;
  button.innerHTML = 'Randomize';
}

function showInfo() {
  peopleLabel.classList.remove('active');
  teamsLabel.classList.remove('active');
  infoLabel.classList.add('active');
  if (tourney.creator.id === user.id)
    mainGrid.innerHTML = `
    <button class="btn primary-btn" onclick="toggleCheckIns()">Toggle Check-Ins</button>
    `;
  else mainGrid.innerHTML = 'uwu';
}

async function toggleCheckIns() {
  response = await fetch(`/api/tourneys/${tourney.id}/togglecheckins`, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const json = await response.json();
    Alert.fire('Whoops!', 'Something unexpected happened', 'error');
    console.log(json);
    return;
  }

  const allowCheckIns = await response.json();
  tourney.allowCheckIns = allowCheckIns;
  showPeople();
}

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
      <div class="player-trow" id="su-${team.id}">
        <div class="container-center">
          <div class="main-content-player">
            <div
              class="player-table-pfp"
              style="background-image: url('${player.twitchProfileImageUrl.replaceAll(
                '300',
                '50',
              )}');"
            >
            </div>
            <div class="container-center">
            ${
              team.isCheckedIn
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm green-icon" style="margin-right: 0.5rem"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`
                : ''
            }
            ${player.twitchUsername}
            </div>
          </div>
        </div>
        <div class="container-center tier-control">
        ${
          tourney.tiered
            ? isPrivileged()
              ? getTierHtml(team.tier, team.id)
              : team.tier
            : 'N/A'
        }
        </div>
        <div class="container-center actions">
          ${isPrivileged() ? getActionsHtml(team) : 'Coming Soon'}
        </div>
      </div>
    `;
  } else {
    const player = team.captain;
    //prettier-ignore
    return `
    <div id="su-${team.id}">
      <div class="player-trow">
        <div class="main-content-player collapsible" onclick="displayCollapsible(this.parentElement)">

          <div
            class="player-table-pfp"
            style="background-image: url('${player.twitchProfileImageUrl.replaceAll(
              '300',
              '50',
            )}');"
          >
          </div>

          <div class="container-center" style="gap: 1rem;">
          <span class="container-center">
            ${
              team.isCheckedIn
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm green-icon" style="margin-right: 0.5rem"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>`
                : !team.verifiedInvites
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm white-icon" style="margin-right: 0.5rem">${clockIcon}</svg>`
                : ''
            }
            ${player.twitchUsername}'s team
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm secondary-icon"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
          </div>

        </div>

        <div class="container-center tier-control">${
          tourney.tiered
            ? isPrivileged()
              ? getTierHtml(team.tier, team.id)
              : team.tier
            : 'N/A'
        }</div>

        <div class="container-center actions">${
          isPrivileged() ? getActionsHtml(team) : 'Coming Soon'
        }</div>
      </div>

      <div class="team-collapsible collapsible-content">
        ${getTeamMembersHtml(team.members, team.invited)}
    </div
    `;
  }
}

function getTierHtml(tier, id) {
  return `${tier} <button onclick="updateTier(${id}, 1)" class="no-style"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="fa-icon-m"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M182.6 137.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8H288c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"/></svg></button>
  
  <button onclick="updateTier(${id}, -1)" class="no-style"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="fa-icon-m"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/></svg></button>`;
}

function getActionsHtml(team) {
  return `
    <!-- Check button -->
    <button class="btn" onclick="checkIn(${team.id})">
      ${
        team.isCheckedIn
          ? //Check In icon
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" class="fa-icon-sm red-icon"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M376.6 84.5c11.3-13.6 9.5-33.8-4.1-45.1s-33.8-9.5-45.1 4.1L192 206 56.6 43.5C45.3 29.9 25.1 28.1 11.5 39.4S-3.9 70.9 7.4 84.5L150.3 256 7.4 427.5c-11.3 13.6-9.5 33.8 4.1 45.1s33.8 9.5 45.1-4.1L192 306 327.4 468.5c11.3 13.6 31.5 15.4 45.1 4.1s15.4-31.5 4.1-45.1L233.7 256 376.6 84.5z"/></svg>'
          : //Check Out icon
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm green-icon" style="height: auto"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M470.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L192 338.7 425.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>'
      }
    </button>
    
    <!-- Kick button -->
    <button class="btn" onclick="kick('${team.captain.twitchUsername}')">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="fa-icon-sm white-icon" style="height: auto"><!--! Font Awesome Pro 6.3.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM472 200H616c13.3 0 24 10.7 24 24s-10.7 24-24 24H472c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/></svg>
    </button>
    `;
}

async function updateTier(teamId, value) {
  const signUpHtml = document.querySelector(`#su-${teamId} .tier-control`);
  const spinner = document.querySelector(
    `#su-${teamId} .tier-control .spinner`,
  );

  const team = tourney.signUps.find((t) => t.id === teamId);

  if (!team) return;
  if (!spinner) signUpHtml.innerHTML += getSpinnerHtml(2);

  team.tier = +team.tier;
  const newTier = team.tier + value < 0 ? 0 : team.tier + value;

  const body = {
    tier: newTier,
  };

  const response = await fetch(`/api/signups/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
    },
  });

  signUpHtml.removeChild(signUpHtml.lastChild);
}

function updateSignUpHtml(newSignUp) {
  const html = document.getElementById(`su-${newSignUp.id}`);
  if (html) {
    const newHtml = getTeamHtml(newSignUp);

    html.outerHTML = newHtml;
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
        <div class="main-content-player">
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

        ${
          size === 'compact'
            ? ''
            : '<div class="container-center">Gamertag</div>'
        }
      </div>
    `;
  }

  return html;
}

function getRandomTeamHtml(team) {
  const player = team.captain;
  //prettier-ignore
  return `
    <div id="${team.id}">
      <div class="player-trow collapsible" onclick="displayCollapsible(this)">
        <div class="main-content-player">

          <div
            class="player-table-pfp"
            style="background-image: url('${player.twitchProfileImageUrl.replaceAll(
              '300',
              '50',
            )}');"
          >
          </div>

          <div class="container-center" style="gap: 1rem;">
            <span>${
              player.twitchUsername
            }'s team</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm secondary-icon"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
          </div>

        </div>
      </div>

      <div class="team-collapsible collapsible-content" style="max-height: 100rem">
        ${getTeamMembersHtml(team.members, team.invited)}
    </div
    `;
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
  if (tourney.allowCheckIns) showCheckInButton();
}

async function signOut() {
  signUpButton.disabled = true;
  hideCheckInButton();
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

  signUpButton.disabled = false;
}

async function checkIn(teamId) {
  const signUpToCheck = getTourneySignUp();
  if (!signUpToCheck && !teamId) throw new Error('SignUp not found');

  response = await fetch(
    `/api/signups/${teamId ? teamId : signUpToCheck.id}/checkin`,
    {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer ' + jwt,
      },
    },
  );

  if (response.ok) {
    Alert.fire('Success!', 'You checked in!', 'success');
    hideCheckInButton();
  } else {
    response = await response.json();
    Alert.fire('Whoops!', response.message, 'error');
  }
}

async function kick(twitchUsername) {
  const body = {
    twitchUsername,
  };
  response = await fetch(`/api/tourneys/${tourney.id}/signout-admin`, {
    method: 'DELETE',
    body: JSON.stringify(body),
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    Alert.fire('Success!', `${twitchUsername} was kicked!`, 'success');
  } else {
    response = await response.json();
    Alert.fire('Whoops!', response.message, 'error');
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

async function addNewSignup(team) {
  const placeholder = document.getElementById('player-table-placeholder');
  console.log(team);
  const acceptedInvite = team.invited.filter((inv) => {
    return inv.accepted && inv.toUser.twitchUsername === user.twitchUsername;
  });

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

function removeSignUp(team) {
  if (team.captain?.id === user?.id || isInTeamMembers(user?.id, team)) {
    hideCheckInButton();
    setSignUpButton();
  }
  const teamElement = teamInDocument(team.id);
  teamElement?.remove();
}

//! TODO:Change status ya no sirve, combinar con updateSIgnUp
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

function showCheckInButton() {
  const signCheckDiv = document.getElementById('sign-check-div');
  const divPlaceHolder = document.createElement('div');
  divPlaceHolder.innerHTML = checkInButtonHtml;
  const checkInBtn = divPlaceHolder.lastElementChild;
  if (!user) {
    checkInBtn.disabled = true;
    return;
  }

  let isTeamCaptainCheckedOut = false;
  for (team of tourney.signUps) {
    if (
      !team.isCheckedIn &&
      team.captain.twitchUsername === user?.twitchUsername
    )
      isTeamCaptainCheckedOut = true;
  }
  if (isTeamCaptainCheckedOut) signCheckDiv.prepend(checkInBtn);
}

function hideCheckInButton() {
  const checkInButton = document.querySelector('.check-in-btn');
  if (checkInButton) checkInButton.remove();
}

function getTourneySignUp() {
  const team = tourney.signUps.find(
    (t) => t.captain.twitchUsername === user?.twitchUsername,
  );
  return team;
}

function isInTeamMembers(userId, team) {
  for (const member of team.members) {
    if (member.id === userId) return true;
  }
  return false;
}

function teamInDocument(teamId) {
  return document.getElementById(`su-${teamId}`);
}
