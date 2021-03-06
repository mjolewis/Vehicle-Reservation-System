/**********************************************************************************************************************
 * Front-end for customers to enter new reservation requests or to check details of an existing reservation. The
 * front-end works with the Java Spring framework to establish and listen to routes for the customer requests.
 *
 * @author Michael Lewis
 *********************************************************************************************************************/

/**
 * Establish a websocket connection and register subscribers.
 */
const socket = new SockJS('/reservationsystem');
const stompClient = Stomp.over(socket);
stompClient.connect({}, function (frame) {
    $("#confirmation").html("");
    console.log('Connected: ' + frame);

    // Listens for a new reservation event
    stompClient.subscribe('/reservation/request', function (response) {
        let newReservationJson = JSON.parse(response.body);
        if (newReservationJson.available) {
            displayReservationConfirmation(newReservationJson);
        } else {
            carWasNotFound();
        }
    });

    // Listens for a lookup reservation event
    stompClient.subscribe('/reservation/lookup', function (response) {
        const existingReservationStart = JSON.parse(response.body).start;
        if (existingReservationStart != null) {
            displayReservationDetails(JSON.parse(response.body));
        } else {
            displayInvalidReservationId();
        }
    })
});

/**
 * Send the customer information to the controller to check if a car is available. The data is transferred using the
 * Data Transfer Object Pattern to avoid making multiple calls to the remote server.
 */
function sendReservationRequest() {
    const city = document.getElementById("city").value;
    const classification = document.getElementById("classification").value;
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;
    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const customerId = document.getElementById("customerId").value;
    const creditCardNumber = document.getElementById("creditCardNumber").value;

    stompClient.send("/app/request", {}, JSON.stringify(
        {
            'city': city,
            'classification': classification,
            'start': start,
            'end': end,
            'firstName': firstName,
            'lastName': lastName,
            'customerId': customerId,
            'creditCardNumber': creditCardNumber
        },));
}

/**
 * Echos response confirmation details to the customer.
 * @param response JSON object containing response details.
 */
function displayReservationConfirmation(response) {
    $("#confirmation")
        .empty()
        .append(`<tr><td>Confirmation Number: ${response.reservationId} <br/>Vehicle address: ${response.streetNumber} 
                ${response.streetName}, ${response.city} ${response.state}, ${response.zipCode}</td></tr>`);
}

/**
 * Echos message letting the customer know that the requested reservation cannot be made.
 */
function carWasNotFound() {
    $("#confirmation")
        .empty()
        .append(`<tr><td>There are no cars available with your requirements. Please search again.</td></tr>`);
}

/**
 * Allows a customer to lookup reservation details for a specified reservationId.
 */
function lookupReservationDetails() {
    const reservationId = document.getElementById("reservationId").value;

    stompClient.send("/app/lookup", {}, JSON.stringify({'reservationId': reservationId}));
}

/**
 * Echos response confirmation details to the customer.
 * @param response JSON object containing response details.
 */
function displayReservationDetails(response) {
    $("#reservationDetails")
        .empty()
        .append(`<tr><td> Reservation Owner: ${response.firstName} ${response.lastName} </br> From: ${response.start} 
            </br>To: ${response.end} </br>Vehicle: ${response.manufacturer} ${response.model} </br>Daily price: 
            $${response.dailyPrice} </br>Vehicle address: ${response.streetNumber} ${response.streetName}, 
            ${response.city} ${response.state}, ${response.zipCode}</td></tr>`);
}

function displayInvalidReservationId() {
    $("#reservationDetails").empty().append(`<tr><td>Invalid reservation number</td></tr>`);
}

$(function () {
    $("form").on('submit', function (e) {
        e.preventDefault();
    });

    // Disable submit button when form loads.
    $("#sendReservationRequest").prop('disabled',true);

    // Enable submit button only after each input field contains data
    let city, classification, start, end, firstName, lastName, customerId, creditCardNumber;
    $("#city").on("keyup", function() {
        city = document.getElementById("city").value;
        if (city.length !== "") {
            city = true;
            enableSubmit();
        }
    });

    $("#classification").on("keyup", function() {
        classification = document.getElementById("classification").value;
        if (classification.length !== "") {
            classification = true;
            enableSubmit();
        }
    });

    $("#start").on("change", function() {
        start = document.getElementById("start").value;
        console.log("Start is " + start);
        if (start.toString() !== "") {
            start = true;
            enableSubmit();
        }
    });

    $("#end").on("change", function() {
        end = document.getElementById("end").value;
        if (end.toString() !== "") {
            end = true;
            enableSubmit();
        }
    });

    $("#firstName").on("keyup", function() {
        firstName = document.getElementById("firstName").value;
        if (firstName.length !== "") {
            firstName = true;
            enableSubmit();
        }
    });

    $("#lastName").on("keyup", function() {
        lastName = document.getElementById("lastName").value;
        if (lastName.length !== "") {
            lastName = true;
            enableSubmit();
        }
    });

    $("#customerId").on("keyup", function() {
        customerId = document.getElementById("customerId").value;
        if (customerId.length !== "") {
            customerId = true;
            enableSubmit();
        }
    });

    $("#creditCardNumber").on("keyup", function() {
        creditCardNumber = document.getElementById("creditCardNumber").value;
        if (creditCardNumber.length !== "") {
            creditCardNumber = true;
            enableSubmit();
        }
    });

    // Enable submit button only after all input fields are populated.
    function enableSubmit() {
        if (city && classification && start && end  && firstName && lastName && customerId && creditCardNumber) {
            $("#sendReservationRequest").prop('disabled',false);
        } else {
            $("#sendReservationRequest").prop('disabled', true);
        }
    }

    // Enforce proper formatting for credit card numbers.
    $('#creditCardNumber').on("keyup", function() {
        let foo = $(this).val().split("-").join(""); // remove hyphens
        if (foo.length > 0) {
            foo = foo.match(new RegExp('.{1,4}', 'g')).join("-");
        }
        $(this).val(foo);
    });

    // All input fields have been filled in, so send reservation request to backend.
    $("#sendReservationRequest").on("click", function () {
        sendReservationRequest();
    });

    $("#lookupReservationDetails").on("click", function () {
        lookupReservationDetails();
    });
});