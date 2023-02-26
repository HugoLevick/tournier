const tournamentGrid = document.querySelector('.tournament-grid');
async function displayIndexTourneys() {
  const tourneys = await fetch('/api/tourneys').then(async (response) => {
    if (response.status === 200) return await response.json();
    else return null;
  });

  for (const tourney of tourneys) {
    const tournamentElement = document.createElement('a');
    tournamentElement.classList.add('tournament');
    tournamentElement.href = `tournament/?term=${tourney.slug}`;

    const tournamentImg = document.createElement('div');
    tournamentImg.classList.add('tournament__image');
    tournamentImg.style.backgroundImage =
      "url('https://m.media-amazon.com/images/M/MV5BMDA5ZDIzNzctYzY0OC00MDY1LWI4NGItODBkNDMxNWZhNTA0XkEyXkFqcGdeQXVyMTk5NDI0MA@@._V1_FMjpg_UX1000_.jpg')";
    tournamentElement.appendChild(tournamentImg);

    const tournamentTitle = document.createElement('div');
    tournamentTitle.classList.add('tournament__title');
    tournamentTitle.innerHTML = tourney.name;
    tournamentElement.appendChild(tournamentTitle);

    const tournamentPeople = document.createElement('div');
    tournamentPeople.classList.add('tournament__people');
    const peopleString = `${
      tourney.peoplePerTeam === 1
        ? '1 person'
        : `${tourney.peoplePerTeam} people needed`
    } for signup`;
    tournamentPeople.innerHTML = peopleString;
    tournamentElement.appendChild(tournamentPeople);

    const startDate = new Date(tourney.startTime);
    const tournamentStartsAt = document.createElement('div');
    tournamentStartsAt.classList.add('tournament__starts-at');
    tournamentStartsAt.innerHTML = startDate
      .toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replaceAll(',', '');
    tournamentElement.appendChild(tournamentStartsAt);

    const tournamentPrize = document.createElement('div');
    tournamentPrize.classList.add('tournament__prize');
    tournamentPrize.innerHTML = 'Prize: $' + tourney.prize;
    tournamentElement.appendChild(tournamentPrize);

    const tournamentHost = document.createElement('div');
    tournamentHost.classList.add('tournament__hosted-by');
    tournamentHost.innerHTML = 'Host: ' + tourney.creator.username;
    tournamentElement.appendChild(tournamentHost);

    const tournamentSignUp = document.createElement('div');
    tournamentSignUp.classList.add('tournament__sign-up');
    tournamentSignUp.innerHTML = 'Sign Up';
    tournamentElement.appendChild(tournamentSignUp);

    tournamentGrid.appendChild(tournamentElement);
  }
}
displayIndexTourneys();
