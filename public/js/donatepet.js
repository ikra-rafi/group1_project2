$(document).ready(() => {
    // Getting references to our form and inputs
    const donateForm = $("form.donate");
    const amountRequestedInput = $("input#amountRequested");
    const amountRaisedInput = $("input#amountRaised");
    const donationInput = $("input#donation");
    const cardNumberInput = $("input#cardNumber");
    const securityCodeInput = $("input#securityCode");
    const nameOnCardInput = $("input#nameOnCard");
    const expirationDateInput = $("input#expirationDate");
    const cardTypeInput = $("input#cardType");
    const petURLInput = $("img#petURL");
    var petId = localStorage.getItem("PetID");
    var updatingRaised = 0;

    // get the current id of who is logged in
    $.get("/api/user_data", (data) => {})
        .then((data) => {
            // retrieve pet data based upon current pet ID value
            fetch(`/getPetID/${petId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then((response) => response.json())
                .then((results) => {
                    // update the raised amount for the pet
                    updatingRaised = updatingRaised + parseInt(results.raisedAmount);
                    // set requested amount and raised amount to fields on page
                    $(amountRequestedInput).val(results.requestAmount);
                    $(amountRaisedInput).val(results.raisedAmount);
                    $(petURLInput).attr("src", results.picURL);
                    // If there's an error, handle it by throwing error
                })
                .catch(err => {});
        })

    // When the form is submitted, write the donation data to the donate pet table
    donateForm.on("submit", event => {
        event.preventDefault();

        // grab user inputs from page
        const donateData = {
            donation: donationInput.val().trim(),
            cardNumber: cardNumberInput.val().trim(),
            securityCode: securityCodeInput.val().trim(),
            nameOnCard: nameOnCardInput.val().trim(),
            expirationDate: expirationDateInput.val(),
            cardType: cardTypeInput.val().trim()
        };

        // check that there was a donation amount
        if (!donateData.donation) {
            return;
        }
        updatingRaised = updatingRaised + parseInt(donateData.donation);
        // convert date to appropriate SQL DATE type format
        donateData.expirationDate = calcDay(donateData.expirationDate);
        // If we have a donation amount we run the userDonation function and clear the form
        donationInput.val("");
        cardNumberInput.val("");
        securityCodeInput.val("");
        nameOnCardInput.val("");
        expirationDateInput.val("");
        cardTypeInput.val("");
        userDonation(donateData.donation, updatingRaised, donateData.cardNumber, donateData.securityCode, donateData.nameOnCard, donateData.expirationDate, donateData.cardType);

    })

    // convert MM-YYYY to YYYY-MM-DD format for SQL by adding in last day of appropriate month
    function calcDay(expirationDate) {
        var date = expirationDate;
        var tempArray = date.split("-");
        var day = parseInt(tempArray[1]);
        var numToAdd;

        switch (day) {
            case 1:
            case 3:
            case 5:
            case 7:
            case 8:
            case 10:
            case 12:
                numToAdd = 31;
                break;
            case 2:
                numToAdd = 28;
                break;
            case 4:
            case 6:
            case 9:
            case 11:
                numToAdd = 30;
                break;
        }

        date = tempArray[1] + "/" + numToAdd + "/" + tempArray[0];
        return date;
    }

    // userDonation does a post to our "api/donatePet" route and if successful, redirects us the the user landing page
    function userDonation(donation, updatingRaised, cardNumber, securityCode, nameOnCard, expirationDate, cardType) {
        // first get the user who is logged in
        fetch('/api/user_data', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => response.json())
            .then((data) => {
                // store user ID to local storage
                localStorage.setItem("RegistrationId", data.id);
                // write donation amount to Donation table based upon pet ID
                $.post("/api/donatePet", {
                        registrationId: data.id,
                        donationAmount: donation,
                        petId: petId
                    })
                    .then((data) => {
                        // write out the updated raised amount based upon new donation amount
                        $.post("/api/updateRaisedAmount", {
                                registrationId: localStorage.getItem("RegistrationId"),
                                raisedAmount: updatingRaised,
                                petId: petId
                            })
                            .then(() => {
                                // write out credit card info to credit card table
                                $.post("/api/saveCreditCard", {
                                        cardNumber: cardNumber,
                                        securityCode: securityCode,
                                        nameOnCard: nameOnCard,
                                        expirationDate: expirationDate,
                                        cardType: cardType,
                                        RegistrationId: localStorage.getItem("RegistrationId"),
                                    })
                                    .then(() => {})
                                    .catch(err => {
                                        console.log(err);
                                    })
                                window.location.replace("/userLanding");
                            })
                            .catch(err => {
                                console.log(err);
                            })

                        // If there's an error, handle it by throwing up a bootstrap alert
                    })
                    .catch(err => {
                        console.log(err);
                    });
            })
    }
});