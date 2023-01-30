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

  await showPeople();

  if (user) signUpButton.disabled = false;
}

function connectToTourneyWs() {
  const socket = io('/tourneys');

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

  socket.on('inv-update-t-' + tourney.id, (invite) => {
    changeStatus(invite.toUser.twitchUsername);
  });
}

getOneTourney(term);
