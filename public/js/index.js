/* eslint-disable*/
import "@babel/polyfill";

import {signUp} from "./signup";
import { login } from "./login";
import { logout } from "./logout";
import { bookTour } from "./stripe";
import { updateSettings } from "./updateSettings";
 

//Dom
const form = document.querySelector('.form--login')
const logoutButton = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const checkoutButton = document.getElementById("checkout-button");
const formSignUp = document.querySelector(".form--signup");


if (logoutButton) logoutButton.addEventListener("click",  logout);

if (userDataForm)userDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);
    // updateSettings(form, "data");
} 
);


if (userPasswordForm) userPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const oldPassword = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    document.getElementById("save-password").textContent = "Loading..."

    await updateSettings({oldPassword, password, passwordConfirm},"password");

    document.getElementById("password-current").value = ""
    document.getElementById("password").value = ""
    document.getElementById("password-confirm").value = ""
    document.getElementById("save-password").textContent = "Save Password"

})

if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById("password").value;
    login(email, password)
});


if (formSignUp) formSignUp.addEventListener("submit", function(e){
  e.preventDefault();
  const name = document.querySelector(".n_signup").value;
  const email = document.querySelector(".e_signup").value;
  const password = document.querySelector(".p_signup").value;
  const passwordConfirm = document.querySelector(".c_signup").value;
  signUp({
    name,
    email,
    password,
    passwordConfirm
  })
  console.log(name,email,password,passwordConfirm);
})

if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
        const tourId = checkoutButton.dataset.bookingId;
        bookTour(tourId);
    })
}
 