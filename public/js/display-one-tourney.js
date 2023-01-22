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

async function getOneTourney(term) {
  const response = await fetch('/api/tourneys/' + term, {
    method: 'GET',
  });

  if (!response.ok) {
    alert('Tournament not found');
    window.location = '/';
  }

  tourney = await response.json();
  const host = tourney.creator.twitchUsername;
  console.log(tourney);
  titleLbl.innerHTML = tourney.name;
  const linkToTwitchHost = document.createElement('a');
  linkToTwitchHost.href = 'https://twitch.tv/' + host;
  linkToTwitchHost.target = '_blank';
  linkToTwitchHost.innerHTML = host;
  hostGameLbl.innerHTML = `Hosted by: ${linkToTwitchHost.outerHTML} | Rogue Company`;

  prizeLbl.innerHTML = '$' + tourney.prize.toLocaleString('en-US');
  tiersLbl.innerHTML = tourney.tiered ? 'YES' : 'NO';
  startsAt.innerHTML = new Date(tourney.startTime).toLocaleDateString(
    undefined,
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
  );

  for (const team of tourney.signUps) {
    for (const player of team.members) {
      const playerHtml = `
      <div class="player-trow" id="${player.id}">
        <div class="container-center">${player.twitchUsername}</div>
        <div class="container-center">${
          tourney.tiered ? team.tier : 'N/A'
        }</div>
        <div class="container-center">Coming soon</div>
      </div>
    `;
      peopleTable.innerHTML += playerHtml;
    }
  }

  if (tourney.signUps.length === 0) peopleTable.innerHTML += playerTablePH;
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
    response = await response.json();
    swal.fire('Whoops!', response.message, 'error');
  }
}

getOneTourney(term);
