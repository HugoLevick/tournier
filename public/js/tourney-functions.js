let params = new URL(document.location).searchParams;
let tourney;
const term = params.get('term').toLowerCase();
if (!term) window.location = '/';

const titleLbl = document.querySelector('.general__title');
const hostGameLbl = document.querySelector('.general__host-game');
const prizeLbl = document.getElementById('prize-square');
const tiersLbl = document.getElementById('tiers-square');
const startsAt = document.getElementById('time-square');
const signUpButton = document.querySelector('.sign-up-button');
const peopleTable = document.querySelector('.player-table');
const playerTablePH = `
          <div
            id="player-table-placeholder"
            class="container-center"
            style="opacity: 60%"
          >
            Looks like no one is here... yet 👀
          </div>`;

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
  }
}

async function signUp() {
  let response = await fetch(`/api/tourneys/${tourney.id}/signup`, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + jwt,
    },
  });

  if (response.ok) {
    swal.fire('You joined the tourney!', '', 'success');
  } else {
    const json = await response.json();
    switch (response.status) {
      case 401:
      case 403:
        swal.fire('Whoops!', 'Please log-in to join', 'error');
        break;
      default:
        swal.fire('Whoops!', json.message, 'error');
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
    swal.fire('You left the tourney!', '', 'success');
  } else {
    const json = await response.json();
    switch (response.status) {
      case 401:
      case 403:
        swal.fire('Whoops!', 'Please log-in to join', 'error');
        break;
      default:
        swal.fire('Whoops!', json.message, 'error');
    }
  }
}

function addNewTeam(team) {
  if (
    team.captain.id === user?.id ||
    (team.verifiedInvites && isInTeamMembers(user?.id, team))
  )
    setSignOutButton();
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
