import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import { orderConstraints, ticketCost } from "../config/ticketConfig.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  // Private fields for payment and reservation services
  #ticketPaymentService;
  #seatReservationService;

  // Static object to hold ticket totals
  static #TicketTotals = {
    totalTickets: 0,
    totalAdultTickets: 0,
    totalChildTickets: 0,
    totalInfantTickets: 0,
  };

  // Constructor to initialize payment and reservation services
  // Might consider using dependency injection for these services
  constructor(
    ticketPaymentService = new TicketPaymentService(),
    seatReservationService = new SeatReservationService()
  ) {
    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;
  }

  // Public method to purchase tickets
  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Validate that at least one ticket is requested
    if (ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException("No tickets requested");
    }

    // Validate account ID and ticket type requests
    this.#validateAccountId(accountId);
    this.#validateTicketTypeRequests(ticketTypeRequests);

    // Calculate ticket totals and validate them
    const totals = this.#calculateTicketTotals(ticketTypeRequests);
    this.#validateTicketTotals(totals);

    // Calculate total amount to pay and total seats to reserve
    const totalAmountToPay = this.#calculateTotalAmount(totals);
    const totalSeatsToReserve = this.#calculateSeatsToReserve(totals);

    // Make payment and reserve seats
    this.#ticketPaymentService.makePayment(accountId, totalAmountToPay);
    this.#seatReservationService.reserveSeat(accountId, totalSeatsToReserve);
  }

  // Private method to validate account ID
  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}`);
    }
  }

  // Private method to validate ticket type requests
  #validateTicketTypeRequests(ticketTypeRequests) {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException(
        "At least one ticket type request must be provided"
      );
    }

    ticketTypeRequests.forEach((request) => {
      if (!(request instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException("Invalid ticket type request");
      }
    });
  }

  // Private method to validate ticket totals
  #validateTicketTotals({
    totalTickets,
    totalAdultTickets,
    totalChildTickets,
    totalInfantTickets,
  }) {
    if (totalTickets === 0) {
      throw new InvalidPurchaseException("No tickets requested");
    }
    if (totalTickets > orderConstraints.MAX_TICKETS) {
      throw new InvalidPurchaseException(
        `Cannot purchase more than ${orderConstraints.MAX_TICKETS} tickets at a time`
      );
    }
    if (
      totalAdultTickets === 0 &&
      (totalChildTickets > 0 || totalInfantTickets > 0)
    ) {
      throw new InvalidPurchaseException(
        "Child or Infant tickets cannot be purchased without at least one Adult ticket"
      );
    }
    if (totalInfantTickets > totalAdultTickets) {
      throw new InvalidPurchaseException(
        "Each infant must be accompanied by an adult. Too many infants."
      );
    }
  }

  // Private method to calculate ticket totals
  #calculateTicketTotals(ticketTypeRequests) {
    const ticketTypeMap = {
      ADULT: "totalAdultTickets",
      CHILD: "totalChildTickets",
      INFANT: "totalInfantTickets",
    };

    const totals = ticketTypeRequests.reduce(
      (acc, request) => {
        const count = request.getNoOfTickets();
        acc.totalTickets += count;

        const ticketType = request.getTicketType();
        acc[ticketTypeMap[ticketType]] += count;

        return acc;
      },
      { ...TicketService.#TicketTotals }
    );

    return totals;
  }

  // Private method to calculate total amount to pay
  #calculateTotalAmount({ totalAdultTickets, totalChildTickets }) {
    return (
      totalAdultTickets * ticketCost.ADULT +
      totalChildTickets * ticketCost.CHILD
    );
  }

  // Private method to calculate total seats to reserve
  #calculateSeatsToReserve({ totalAdultTickets, totalChildTickets }) {
    return totalAdultTickets + totalChildTickets;
  }
}
