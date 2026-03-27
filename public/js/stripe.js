/* eslint-disable */
import axios from 'axios';

import { showAlert } from "./alert";


export const bookTour = async tourId => {
  try {
    console.log("Frontend working");
    // test card : 4242 4242 4242 4242
  // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + chanre credit card
    window.location.href = session.data.url; // Redirect user to Stripe Checkout
  
  } catch (err) { 
    console.log(err);
    showAlert('error',`${err.response?.status}: ${err.response?.statusText}`);
  }
}; 