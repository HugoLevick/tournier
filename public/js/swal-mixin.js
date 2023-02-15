function getSpinnerHtml(width) {
  return `<div class="spinner" style="width: ${width}rem;"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>`;
}

const notificationsHtml = `
  <div class="notification-list">
    ${getSpinnerHtml(2)}
  </div>
`;
const SignUpAlert = Swal.mixin({
  customClass: {
    popup: 'sign-up-popup',
    title: 'h4',
    confirmButton: 'sign-up-confirm',
  },
  willOpen: () => {
    const popUpSignUpBtn = document.querySelector('.sign-up-confirm');
    popUpSignUpBtn.disabled = true;
    addSignUpHtml(user, true);
    //setup before functions
    let typingTimer; //timer identifier
    let doneTypingInterval = 700; //time in ms
    let myInput = document.querySelector('.popup-search-player');

    //on keyup, start the countdown
    myInput.addEventListener('input', () => {
      clearTimeout(typingTimer);
      if (myInput.value) {
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
      }
    });
  },
  showCancelButton: true,
  showConfirmButton: true,
  confirmButtonColor: '#ae7a08',
  showCloseButton: true,
  reverseButtons: true,
  confirmButtonText: 'Sign Up!',
});

const Alert = Swal.mixin({
  customClass: {
    popup: 'alert-popup',
    title: 'h5',
    confirmButton: 'sign-up-confirm',
  },
  reverseButtons: true,
  showConfirmButton: true,
  confirmButtonColor: '#ae7a08',
  showCloseButton: true,
});

function displayCollapsible(element) {
  element.classList.toggle('active');
  let content = element.nextElementSibling;
  if (content.style.maxHeight) {
    content.style.maxHeight = null;
  } else {
    content.style.maxHeight = content.scrollHeight + 'px';
  }
}

async function openNotifications() {
  if (!user) {
    Alert.fire('Whoops!', 'Please log-in to see your notifications', 'error');
    return;
  }

  Alert.fire({
    title: 'NOTIFICATIONS',
    html: notificationsHtml,
    showConfirmButton: false,
  });

  const response = await fetch(`/api/notifications`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + jwt,
    },
  });
  if (!response.ok) {
    Alert.fire('Whoops!', (await response.json()).message, 'error');
    return;
  }

  const notifications = await response.json();
  console.log(notifications);
  const nList = document.querySelector('.notification-list');

  if (
    notifications.warnings.length === 0 &&
    notifications.invites.length === 0
  ) {
    nList.innerHTML = 'No notifications';
  } else {
    nList.innerHTML = '';
  }
  for (const warning of notifications.warnings) {
    nList.innerHTML += getWarningHtml(warning);
  }

  for (const invite of notifications.invites) {
    nList.innerHTML += getInviteHtml(invite);
  }
}

function getInviteHtml(invite) {
  const tourneyTitle =
    invite.fromTeam.tourney.name.length > 30
      ? invite.fromTeam.tourney.name.slice(0, 30) + '...'
      : invite.fromTeam.tourney.name;
  //prettier-ignore
  return `
  <div class='noti-invite' style="font-size: 2rem">
    <div>
      Incoming invite from ${invite.fromTeam.captain.twitchUsername} to <a href='/tournament?term=${invite.fromTeam.tourney.slug}' style='color: var(--primary); text-decoration:underline'>${tourneyTitle}</a>
    </div>
    <div class='collapsible' onclick='displayCollapsible(this)' style='display:flex; justify-content:center'>
        Members &nbsp;&nbsp;<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="fa-icon-sm secondary-icon"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>
    </div>
    <div class='team-collapsible collapsible-content'>
        ${getTeamMembersHtml(invite.fromTeam.members, undefined, 'compact')}
    </div>

    <div class='noti-buttons'>
    <button onclick='respondInvite(${invite.id}, false)'>DENY</button>
    <button onclick='respondInvite(${invite.id}, true)'>ACCEPT</button>
    </div>
  </div>
  `;
}

function getWarningHtml(warning) {
  let message = warning.message.replaceAll(user.twitchUsername + "'s", 'your');
  if (warning.json) {
    const data = JSON.parse(warning.json);

    switch (data.type) {
      case 'deny-invite':
        const tourneyTitle =
          data.tourney.title.length > 30
            ? data.tourney.title.slice(0, 30) + '...'
            : data.tourney.title;
        message = message.replace(
          'a tourney',
          `<a href='/tournament?term=${data.tourney.slug}' style='color: var(--primary); text-decoration:underline'>${tourneyTitle}</a>`,
        );
        return `
          <div class='warning-notif'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="fa-icon-l circle-border"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M96 64c0-17.7-14.3-32-32-32S32 46.3 32 64V320c0 17.7 14.3 32 32 32s32-14.3 32-32V64zM64 480c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40z"/></svg>

            <div>
            ${message}
            </div>

            <span class="closebtn container-center" onclick="acknowledgeNotification(${warning.id}, this)">&times;</span>

          </div>
        `;

      default:
        return `
          <div class='warning-notif'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512" class="fa-icon-l circle-border"><!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M96 64c0-17.7-14.3-32-32-32S32 46.3 32 64V320c0 17.7 14.3 32 32 32s32-14.3 32-32V64zM64 480c22.1 0 40-17.9 40-40s-17.9-40-40-40s-40 17.9-40 40s17.9 40 40 40z"/></svg>

            <div>
            ${message}
            </div>

            <span class="closebtn container-center" onclick="this.parentElement.style.display='none';">&times;</span>

          </div>
        `;
    }
  }
}

async function respondInvite(id, accepted = false) {
  const body = {
    inviteId: id,
    accepted,
  };
  const response = await fetch('/api/tourneys/1/invite', {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + jwt,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if ([401, 403].includes(response.status)) {
    Alert.fire('Whoops!', 'Please login again to accept the invite', 'error');
    return;
  }

  if (!response.ok) {
    console.log(await response.json());
    Alert.fire(
      'Whoops!',
      'Could not accept invite, is the team still active?',
      'error',
    );
    return;
  } else {
    Alert.fire(
      'Done!',
      `Invite ${accepted ? 'accepted' : 'denied'}`,
      'success',
    );
  }
}

async function acknowledgeNotification(id, element) {
  if (element) element.parentElement.style.display = 'none';
  await fetch('/api/notifications/' + id, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + jwt,
    },
  });
}
// Toast.fire({
//   icon: 'info',
//   title: 'You got an invite!',
// });
