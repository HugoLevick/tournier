async function displayIndexTourneys() {
  const tourneys = await fetch('/api/tourneys').then(async (response) => {
    if (response.status === 200) return await response.json();
    else return null;
  });

  console.log(tourneys);
}
displayIndexTourneys();
