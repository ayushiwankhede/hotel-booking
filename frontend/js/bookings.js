let availableRooms = [];


// =====================================================
// SET MINIMUM DATES
// =====================================================

function setDateMinimums() {

    const today = new Date();

    const yyyy = today.getFullYear();

    const mm = String(today.getMonth() + 1).padStart(2, "0");

    const dd = String(today.getDate()).padStart(2, "0");

    const todayString = `${yyyy}-${mm}-${dd}`;


    document.getElementById("checkIn").min =
        todayString;

    document.getElementById("checkOut").min =
        todayString;

    document.getElementById("bookingCheckIn").min =
        todayString;

    document.getElementById("bookingCheckOut").min =
        todayString;
}


// =====================================================
// KEEP CHECKOUT AFTER CHECKIN
// =====================================================

document.getElementById("checkIn").addEventListener(
    "change",
    function () {

        const checkIn =
            this.value;

        document.getElementById("checkOut").min =
            checkIn;

    }
);


document.getElementById("bookingCheckIn").addEventListener(
    "change",
    function () {

        const checkIn =
            this.value;

        document.getElementById("bookingCheckOut").min =
            checkIn;

    }
);


// =====================================================
// CHECK ROOM AVAILABILITY
// =====================================================

async function checkAvailability() {

    const checkIn =
        document.getElementById("checkIn").value;

    const checkOut =
        document.getElementById("checkOut").value;

    const type =
        document.getElementById("availabilityType").value;


    if (!checkIn || !checkOut) {

        alert(
            "Please select both check-in and check-out dates."
        );

        return;
    }


    if (new Date(checkOut) <= new Date(checkIn)) {

        alert(
            "Check-out date must be after check-in date."
        );

        return;
    }


    try {

        let url =
            `/api/rooms/available?checkIn=${checkIn}&checkOut=${checkOut}`;


        if (type) {

            url += `&type=${encodeURIComponent(type)}`;

        }


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Unable to check availability"
            );

        }


        availableRooms = data;


        displayAvailableRooms(data);


    } catch (error) {

        alert(error.message);

    }
}


// =====================================================
// DISPLAY AVAILABLE ROOMS
// =====================================================

function displayAvailableRooms(rooms) {

    const container =
        document.getElementById("availableRooms");


    const count =
        document.getElementById("availabilityCount");


    count.textContent =
        `${rooms.length} room${rooms.length !== 1 ? "s" : ""} available`;


    if (rooms.length === 0) {

        container.innerHTML = `

            <div class="availability-placeholder">

                <div class="placeholder-icon">
                    <i class="bi bi-door-closed"></i>
                </div>

                <h3>
                    No rooms available
                </h3>

                <p>
                    Try different dates or another room type.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        rooms.map(room => `

            <div class="available-room-card">

                <div class="available-room-top">

                    <div>

                        <div class="available-room-number">
                            ${escapeHtml(room.room_number)}
                        </div>

                        <div class="available-room-type">
                            ${escapeHtml(room.room_type)} Room
                        </div>

                    </div>

                    <span class="available-badge">
                        Available
                    </span>

                </div>


                <div class="available-room-info">

                    <div class="available-room-price">

                        ₹${Number(room.price).toLocaleString("en-IN")}

                        <small>/ night</small>

                    </div>


                    <div class="available-room-capacity">

                        <i class="bi bi-people"></i>

                        ${room.capacity} Guests

                    </div>

                </div>


                <button
                    class="select-room-button"
                    onclick="selectRoom(${room.id})"
                >
                    Select Room
                    <i class="bi bi-arrow-right"></i>
                </button>

            </div>

        `).join("");
}


// =====================================================
// SELECT ROOM
// =====================================================

function selectRoom(roomId) {

    const room =
        availableRooms.find(
            r => r.id === roomId
        );


    if (!room) {

        alert("Room information not found.");

        return;
    }


    document.getElementById("selectedRoomId").value =
        room.id;


    document.getElementById("selectedRoomText").textContent =
        `Room ${room.room_number} • ${room.room_type} • ₹${Number(room.price).toLocaleString("en-IN")}/night`;


    document.getElementById("bookingCheckIn").value =
        document.getElementById("checkIn").value;


    document.getElementById("bookingCheckOut").value =
        document.getElementById("checkOut").value;


    document.getElementById("bookingModal")
        .classList.remove("hidden");
}


// =====================================================
// OPEN NEW BOOKING FORM
// =====================================================

function openBookingForm() {

    document.getElementById("bookingForm").reset();

    document.getElementById("selectedRoomId").value = "";

    document.getElementById("selectedRoomText").textContent =
        "Select a room from availability results";


    document.getElementById("bookingModal")
        .classList.remove("hidden");
}


// =====================================================
// CLOSE BOOKING FORM
// =====================================================

function closeBookingForm() {

    document.getElementById("bookingModal")
        .classList.add("hidden");
}


// =====================================================
// CREATE BOOKING
// =====================================================

document.getElementById("bookingForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const roomId =
                document.getElementById("selectedRoomId").value;


            const guestName =
                document.getElementById("guestName").value.trim();


            const guestEmail =
                document.getElementById("guestEmail").value.trim();


            const guestPhone =
                document.getElementById("guestPhone").value.trim();


            const checkIn =
                document.getElementById("bookingCheckIn").value;


            const checkOut =
                document.getElementById("bookingCheckOut").value;


            if (!roomId) {

                alert(
                    "Please select an available room first."
                );

                return;
            }


            if (new Date(checkOut) <= new Date(checkIn)) {

                alert(
                    "Check-out date must be after check-in date."
                );

                return;
            }


            if (!/^[0-9]{10}$/.test(guestPhone)) {

                alert(
                    "Please enter a valid 10-digit phone number."
                );

                return;
            }


            const bookingData = {

                room_id: Number(roomId),

                guest_name: guestName,

                guest_email: guestEmail,

                guest_phone: guestPhone,

                check_in: checkIn,

                check_out: checkOut

            };


            try {

                const response =
                    await fetch(
                        "/api/bookings",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify(bookingData)
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Booking could not be completed."
                    );

                }


                showBookingToast(
                    "Booking confirmed successfully!"
                );


                closeBookingForm();


                loadBookings();


                /*
                 * Refresh availability after booking.
                 */
                if (
                    document.getElementById("checkIn").value &&
                    document.getElementById("checkOut").value
                ) {

                    checkAvailability();

                }


            } catch (error) {

                alert(error.message);

            }

        }
    );


// =====================================================
// LOAD BOOKINGS
// =====================================================

async function loadBookings() {

    const tbody =
        document.getElementById("bookingsTableBody");

    const empty =
        document.getElementById("bookingEmpty");


    try {

        const response =
            await fetch("/api/bookings");


        if (!response.ok) {

            throw new Error(
                "Unable to load bookings."
            );

        }


        const bookings =
            await response.json();


        if (bookings.length === 0) {

            tbody.innerHTML = "";

            empty.style.display = "block";

            return;
        }


        empty.style.display = "none";


        tbody.innerHTML =
            bookings.map(booking => {

                const isConfirmed =
                    booking.status === "Confirmed";


                return `

                    <tr>

                        <td>

                            <span class="guest-name">
                                ${escapeHtml(booking.guest_name)}
                            </span>

                        </td>


                        <td>

                            <span class="room-chip">
                                Room ${escapeHtml(booking.room_number)}
                            </span>

                        </td>


                        <td>
                            ${formatDate(booking.check_in)}
                        </td>


                        <td>
                            ${formatDate(booking.check_out)}
                        </td>


                        <td>

                            <span class="${
                                isConfirmed
                                    ? "confirmed-badge"
                                    : "cancelled-badge"
                            }">

                                ${escapeHtml(booking.status)}

                            </span>

                        </td>


                        <td>

                            ${
                                isConfirmed
                                    ? `
                                        <button
                                            class="cancel-booking-button"
                                            onclick="cancelBooking(${booking.id})"
                                        >
                                            Cancel
                                        </button>
                                      `
                                    : "—"
                            }

                        </td>

                    </tr>

                `;

            }).join("");


    } catch (error) {

        console.error(
            "Booking loading error:",
            error
        );

    }
}


// =====================================================
// CANCEL BOOKING
// =====================================================

async function cancelBooking(id) {

    const confirmed =
        confirm(
            "Are you sure you want to cancel this booking?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/bookings/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to cancel booking."
            );

        }


        showBookingToast(
            "Booking cancelled successfully."
        );


        loadBookings();


        if (
            document.getElementById("checkIn").value &&
            document.getElementById("checkOut").value
        ) {

            checkAvailability();

        }


    } catch (error) {

        alert(error.message);

    }
}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {

    const date =
        new Date(dateString + "T00:00:00");


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


// =====================================================
// TOAST
// =====================================================

function showBookingToast(message) {

    const toast =
        document.getElementById("bookingToast");


    document.getElementById("bookingToastText")
        .textContent = message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2800);
}


// =====================================================
// HTML SAFETY
// =====================================================

function escapeHtml(value) {

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");
}


// =====================================================
// URL ROOM PARAMETER
// =====================================================

function checkRoomParameter() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const roomId =
        params.get("room");


    if (!roomId) {
        return;
    }


    /*
     * If the user clicked "Book" from the Rooms page,
     * automatically open the booking workflow.
     */

    fetch(`/api/rooms/${roomId}`)
        .then(response => response.json())
        .then(room => {

            document.getElementById("selectedRoomId").value =
                room.id;

            document.getElementById("selectedRoomText").textContent =
                `Room ${room.room_number} • ${room.room_type} • ₹${Number(room.price).toLocaleString("en-IN")}`;

            openBookingForm();

        })
        .catch(error => {

            console.error(
                "Unable to load selected room:",
                error
            );

        });
}


// =====================================================
// INITIALIZE
// =====================================================

setDateMinimums();

loadBookings();

checkRoomParameter();