const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-right',
  iconColor: 'white',
  customClass: {
    popup: 'colored-toast',
  },
  showConfirmButton: false,
  showCloseButton: true,
  timer: 2000,
});

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
  showConfirmButton: true,
  confirmButtonColor: '#ae7a08',
  showCloseButton: true,
});

// Toast.fire({
//   icon: 'info',
//   title: 'You got an invite!',
// });
