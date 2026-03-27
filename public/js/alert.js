/* eslint-disable */

export const hideAlert = () => {
    const el =document.querySelector('.alert');
    if (el) el.parentElement.removeChild(el);
}

export const showAlert = (type, message) => { 
 hideAlert()
 const markup = `<div class='alert alert--${type}'> ${message}</div>`
 const body = document.querySelector('body');
 body.insertAdjacentHTML('afterbegin', markup);
 
setTimeout(hideAlert, 1500);
};