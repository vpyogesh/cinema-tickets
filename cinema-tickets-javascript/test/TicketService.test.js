/* eslint-disable no-undef */
import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";

const mockTicketPaymentService = {
  makePayment: jest.fn(),
};

const mockSeatReservationService = {
  reserveSeat: jest.fn(),
};

describe("TicketService", () => {
  let ticketService;

  beforeEach(() => {
    jest.clearAllMocks();
    ticketService = new TicketService(
      mockTicketPaymentService,
      mockSeatReservationService
    );
  });

  test("processes valid purchase (2 ADULT, 1 CHILD, 1 INFANT) correctly", () => {
    const requests = [
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 1),
    ];

    ticketService.purchaseTickets(1, ...requests);

    // Payment = (2 * 25) + (1 * 15) = 50 + 15 = 65
    // Seats to reserve = adult + child = 2 + 1 = 3
    expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 65);
    expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3);
  });

  test("should throw an error if no tickets are requested", () => {
    expect(() => {
      ticketService.purchaseTickets(1);
    }).toThrow(InvalidPurchaseException);
  });

  test("throws error when no tickets requested", () => {
    expect(() => ticketService.purchaseTickets(1)).toThrow(
      InvalidPurchaseException
    );
  });

  test("throws error for invalid account ID", () => {
    const requests = [new TicketTypeRequest("ADULT", 1)];

    expect(() => ticketService.purchaseTickets(0, ...requests)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(-1, ...requests)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets("TEST", ...requests)).toThrow(
      InvalidPurchaseException
    );
  });

  test("throws error when ticket totals exceed max tickets", () => {

    const requests = [new TicketTypeRequest("ADULT", 26)];

    expect(() => ticketService.purchaseTickets(1, ...requests)).toThrow(
      InvalidPurchaseException
    );
  });

  test("should throw an error if unknown ticket type is requested", () => {
    expect(() => {
      ticketService.purchaseTickets(1, new TicketTypeRequest("HUMAN", 1));
    }).toThrow(TypeError);
  });

  test("throws error when child or infant tickets are requested without an adult", () => {
    const childOnly = [new TicketTypeRequest("CHILD", 1)];
    const infantOnly = [new TicketTypeRequest("INFANT", 1)];

    expect(() => ticketService.purchaseTickets(1, ...childOnly)).toThrow(
      InvalidPurchaseException
    );
    expect(() => ticketService.purchaseTickets(1, ...infantOnly)).toThrow(
      InvalidPurchaseException
    );
  });

  test("should throw an error if ticket type request is invalid", () => {
    expect(() => {
      ticketService.purchaseTickets(1, { type: "ADULT", noOfTickets: 1 });
    }).toThrow(InvalidPurchaseException);
  });

  test("throws error when there are more infants than adults", () => {
    const requests = [
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("INFANT", 2),
    ];

    expect(() => ticketService.purchaseTickets(1, ...requests)).toThrow(
      InvalidPurchaseException
    );
  });

  test("processes valid purchase with only adult tickets", () => {
    const requests = [new TicketTypeRequest("ADULT", 3)];

    ticketService.purchaseTickets(1, ...requests);

    // Payment = 3 * 25 = 75, Seats = 3 (only adult tickets)
    expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 75);
    expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3);
  });

  test("processes valid purchase with adult and child tickets only", () => {
    const requests = [
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 2),
    ];

    ticketService.purchaseTickets(1, ...requests);

    // Payment = (1 * 25) + (2 * 15) = 25 + 30 = 55
    // Seats = 1 + 2 = 3
    expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 55);
    expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3);
  });

  test("processes valid purchase with adult and child tickets and infant tickets", () => {
    const requests = [
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 2),
      new TicketTypeRequest("INFANT",1),
    ];

    ticketService.purchaseTickets(1, ...requests);

    // Payment = (1 * 25) + (2 * 15) = 25 + 30 = 55
    // Seats = 1 + 2 = 3
    expect(mockTicketPaymentService.makePayment).toHaveBeenCalledWith(1, 55);
    expect(mockSeatReservationService.reserveSeat).toHaveBeenCalledWith(1, 3);
  });
});
