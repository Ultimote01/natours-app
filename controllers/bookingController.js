const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handleFactory');
const AppError = require('../utils/appError');


exports.checkTourAvailability = catchAsync( async (req, res, next) =>{
    const { tour:tourId, dateId, user } = req.body;

    const tour = await Tour.findById(tourId);

    if (!tour) {
      return next( new AppError("Tour not found", 404));
    }

    const dateInstance = tour.startDates.id(dateId);

    if (!dateInstance) {
      return next( new AppError("Startdate not found for  this tour", 404));
    }

    // 3. Check availability
    if (dateInstance.soldOut){
        return next( new AppError("This tour date is sold out", 400));
    }

      

    if (dateInstance.participants >= tour.maxGroupSize){
      return next("No more slots available for this date" , 400)
    }

    // 4. Increase participants
    req.tourDateInstance={tour,dateInstance};

  
  return next();

} )


const createBookingCheckout = async session => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_details.email }))?.id;
  const price = session.amount_total / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log(err);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });

};

exports.getCheckoutSession = catchAsync( async (req,res, next)=> {
  const tour = await Tour.findById(req.params.tourId);
  const cancel_url = `${req.protocol}://${req.get('host')}/tour/${tour.slug}`;
  const success_url= `${req.protocol}://${req.get('host')}/my-tours?alert=booking`;

 const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
              ],
            },
            unit_amount: tour.price * 100, // amount in cents ($20.00)
          },
          quantity: 1,
        },
      ],
      client_reference_id: req.params.tourId,
      success_url: success_url, 
      cancel_url: cancel_url,
    });

    res.json({ url: session.url }); // send the Stripe payment page URL
})



exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);