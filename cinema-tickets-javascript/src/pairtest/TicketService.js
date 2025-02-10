import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */

  #ticketPaymentService;
  #seatReservationService;

  #MAX_TICKETS = 25;
  #ADULT_TICKET_PRICE = 25
  #CHILD_TICKET_PRICE = 15

  static #TicketTotals = {
    totalTickets: 0,
    totalAdultTickets: 0,
    totalChildTickets: 0,
    totalInfantTickets: 0,
  };

  constructor(
    ticketPaymentService = new TicketPaymentService(),
    seatReservationService = new SeatReservationService()
  ) {
    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    if (ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException("No tickets requested");
    }

    this.#validateAccountId(accountId);
    this.#validateTicketTypeRequests(ticketTypeRequests);
    const totals = this.#calculateTicketTotals(ticketTypeRequests);
    this.#validateTicketTotals(totals);

    const totalAmountToPay = this.#calculateTotalAmount(totals)
    const totalSeatsToReserve = this.#calculateSeatsToReserve(totals)

    this.#ticketPaymentService.makePayment(accountId, totalAmountToPay)
    this.#seatReservationService.reserveSeat(accountId, totalSeatsToReserve)
  }

  #validateAccountId(accountId) {
    if (typeof accountId !== "number" || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}`);
    }
  }

  #validateTicketTypeRequests(ticketTypeRequests) {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException(
        "At least one ticket type request must be provided"
      );
    }

    const allowedTypes = ["ADULT", "CHILD", "INFANT"];

    ticketTypeRequests.forEach((request) => {
      if (!(request instanceof TicketTypeRequest)) {
        throw new InvalidPurchaseException("Invalid ticket type request");
      }

      const ticketType = request.getTicketType();

      if (!allowedTypes.includes(ticketType)) {
        throw new InvalidPurchaseException("Unknown ticket type");
      }
    });
  }

  #validateTicketTotals({
    totalTickets,
    totalAdultTickets,
    totalChildTickets,
    totalInfantTickets,
  }) {
    if (totalTickets === 0) {
      throw new InvalidPurchaseException("No tickets requested");
    }
    if (totalTickets > this.#MAX_TICKETS) {
      throw new InvalidPurchaseException(
        `Cannot purchase more than ${this.#MAX_TICKETS} tickets at a time`
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

  #calculateTotalAmount ({ totalAdultTickets, totalChildTickets }) {
    return (
      totalAdultTickets * this.#ADULT_TICKET_PRICE +
      totalChildTickets * this.#CHILD_TICKET_PRICE
    )
  }

  #calculateSeatsToReserve ({ totalAdultTickets, totalChildTickets }) {
    return totalAdultTickets + totalChildTickets
  }
}
