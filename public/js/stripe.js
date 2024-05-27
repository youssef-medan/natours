import axios from 'axios'
import { showAlert } from './alerts'
// const stripe = Stripe('pk_test_51PIravF9RouLQBRY1FXWELV5eJugJBlMOj2w9KRNPRBXcbhnQGw5bC6m9Rv5SU5bv7B133hDy4tbKTodeJcXAWm700Cja034QF')


export const bookTour = async tourId =>{
    try {
        
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)
        console.log(session) 
        location.assign(session.data.session.url)
    } catch (error) {
        showAlert('error', error)
    }
}