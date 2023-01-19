let params = new URL(document.location).searchParams;
const term = params.get('term').toLowerCase();
if (!term) window.location = '/';

const titleLbl = document.querySelector('.general__title');
const hostGameLbl = document.querySelector('.general__host-game');
const prizeLbl = document.getElementById('prize-square');
const tiersLbl = document.getElementById('tiers-square');
const startsAt = document.getElementById('time-square');
const signUpButton = document.querySelector('.sign-up-button');

async function getOneTourney(term) {
  const response = await fetch('/api/tourneys/' + term, {
    method: 'GET',
  });

  if (!response.ok) {
    alert('Tournament not found');
    window.location = '/';
  }

  const tourney = await response.json();
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

  if (!user) {
    signUpButton.disabled = true;
    signUpButton.innerHTML = 'Log in';
  }
}
getOneTourney(term);
