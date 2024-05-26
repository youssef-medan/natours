const mongoose = require('mongoose');
const Schema = mongoose.Schema

const bookingSchema = new Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'tour is required']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'user is required']
    },
   
    price: {
        type: Number,
        required: [true, 'price is required']
    },
    // status: {
    //     type: String,
    //     default: 'pending',
    //     enum: ['pending', 'approved', 'canceled']
    // },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
})

bookingSchema.pre(/^find/, function (next) {
    this.populate({
        path: 'tour',
        select: 'name'
    })
    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next()
})

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking
