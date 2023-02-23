let params = new URL(document.location).searchParams;
let tourney;
const term = params.get('term')?.toLowerCase();
if (!term) window.location = '/';
let signUpTeam = [];

async function getOneTourney(term) {
  if (jwt && !user) {
    console.log('waiting');
    setTimeout(() => {
      getOneTourney(term);
    }, 100);
    return;
  }
  const response = await fetch('/api/tourneys/' + term, {
    method: 'GET',
  });

  if (!response.ok) {
    alert('Tournament not found');
    window.location = '/';
  }

  tourney = await response.json();
  connectToTourneyWs();

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

  if (tourney.allowCheckIns) showCheckInButton();
  await showPeople();

  if (user) signUpButton.disabled = false;
}

function connectToTourneyWs() {
  const socket = io('/tourneys');

  socket.on('signUp-update-t-' + tourney.id, (updatedTeam) => {
    console.log(updatedTeam);
    const index = tourney.signUps.findIndex((t) => t.id === updatedTeam.id);
    tourney.signUps[index] = updatedTeam;
    updateSignUpHtml(updatedTeam);
  });

  socket.on('sign-up-t-' + tourney.id, (team) => {
    tourney.signUps.push(team);
    addNewSignup(team);
  });

  socket.on('sign-out-t-' + tourney.id, (team) => {
    removeSignUp(team);

    const index = tourney.signUps.findIndex((t) => t.id === team.id);

    if (typeof index === 'number' && !isNaN(index))
      tourney.signUps.splice(index, 1);
  });

  socket.on('random-t-' + tourney.id, (randomTeams) => {
    tourney.teams = randomTeams;
    if (document.querySelector('.teams-table')) showTeams();
    Toastify({
      text: 'Teams have been updated!',
      duration: 3000,
      gravity: 'top', // `top` or `bottom`
      position: 'center', // `left`, `center` or `right`
      stopOnFocus: false, // Prevents dismissing of toast on hover
      style: {
        background: 'var(--darker-background)',
        boxShadow: 'unset',
        border: '1px var(--secondary) solid',
      },
      onClick: showTeams, // Callback after click
    }).showToast();
  });

  socket.on('toggle-check-t-' + tourney.id, (allowCheckIns) => {
    Toastify({
      text: `Check-Ins are ${allowCheckIns ? 'enabled' : 'disabled'}!`,
      duration: 3000,
      close: true,
      gravity: 'top', // `top` or `bottom`
      position: 'center', // `left`, `center` or `right`
      stopOnFocus: false, // Prevents dismissing of toast on hover
      style: {
        background: 'var(--darker-background)',
        boxShadow: 'unset',
        border: '1px var(--secondary) solid',
      },
    }).showToast();

    tourney.allowCheckIns = allowCheckIns;

    if (allowCheckIns) showCheckInButton();
    else hideCheckInButton();
  });
}

getOneTourney(term);
