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

    const totals = this.#calculateTicketTotals(ticketTypeRequests);

  }

  #validateAccountId(accountId) {
    if (typeof accountId !== "number" || accountId <= 0) {
      throw new InvalidPurchaseException(`Invalid account ID: ${accountId}`);
    }
  }

  #calculateTicketTotals(ticketTypeRequests) {

    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException(
        "At least one ticket type request must be provided"
      );
    }

    const ticketTypeMap = {
      "ADULT": "totalAdultTickets",
      "CHILD": "totalChildTickets",
      "INFANT": "totalInfantTickets"
    };

    const totals = ticketTypeRequests.reduce(
      (acc, request) => {
        if (!(request instanceof TicketTypeRequest)) {
          throw new InvalidPurchaseException("Invalid ticket type request");
        }

        const count = request.getNoOfTickets();
        acc.totalTickets += count;

        const ticketType = request.getTicketType();
        if (!ticketTypeMap[ticketType]) {
          throw new InvalidPurchaseException("Unknown ticket type");
        }

        acc[ticketTypeMap[ticketType]] += count;

        return acc;
      },
      { ...TicketService.#TicketTotals }
    );

    return totals;
  }
}
