let allRooms = [];


// =====================================================
// LOAD ROOMS
// =====================================================

async function loadRooms() {

    const container = document.getElementById("roomsContainer");
    const emptyState = document.getElementById("emptyState");

    try {

        const response = await fetch("/api/rooms");

        if (!response.ok) {
            throw new Error("Unable to load rooms");
        }

        allRooms = await response.json();

        document.getElementById("roomCount").textContent =
            allRooms.length;

        displayRooms(allRooms);

    } catch (error) {

        console.error("Room loading error:", error);

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>

                <h3>Unable to load rooms</h3>

                <p>
                    Please make sure the backend server is running.
                </p>
            </div>
        `;

        emptyState.classList.add("hidden");
    }
}


// =====================================================
// DISPLAY ROOMS
// =====================================================

function displayRooms(rooms) {

    const container =
        document.getElementById("roomsContainer");

    const emptyState =
        document.getElementById("emptyState");


    if (rooms.length === 0) {

        container.innerHTML = "";

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    container.innerHTML = rooms.map(room => {

        const status =
            room.current_status || room.status || "Available";

        const isAvailable =
            status.toLowerCase() === "available";


        return `

            <div class="room-card">

                <div class="room-card-top">

                    <div class="room-number">
                        ${escapeHtml(room.room_number)}
                    </div>

                    <div class="room-type-label">
                        ${escapeHtml(room.room_type)} Room
                    </div>


                    <div class="room-status ${isAvailable ? "available" : "booked"}">

                        <span class="status-circle"></span>

                        ${status}

                    </div>

                </div>


                <div class="room-card-body">


                    <div class="room-details">

                        <div class="room-detail">

                            <i class="bi bi-currency-rupee"></i>

                            <div>

                                <span>
                                    PRICE
                                </span>

                                <strong>
                                    ₹${Number(room.price).toLocaleString("en-IN")}
                                </strong>

                            </div>

                        </div>


                        <div class="room-detail">

                            <i class="bi bi-people"></i>

                            <div>

                                <span>
                                    CAPACITY
                                </span>

                                <strong>
                                    ${room.capacity} Guests
                                </strong>

                            </div>

                        </div>

                    </div>


                    <div class="room-price">

                        ₹${Number(room.price).toLocaleString("en-IN")}

                        <small>
                            / night
                        </small>

                    </div>


                    <div class="room-actions">

                        <button
                            class="room-action"
                            onclick="editRoom(${room.id})"
                        >
                            <i class="bi bi-pencil"></i>
                            Edit
                        </button>


                        <button
                            class="room-action delete"
                            onclick="deleteRoom(${room.id})"
                        >
                            <i class="bi bi-trash3"></i>
                            Delete
                        </button>


                        <button
                            class="room-action book"
                            onclick="bookRoom(${room.id})"
                        >
                            <i class="bi bi-calendar-plus"></i>
                            Book
                        </button>

                    </div>

                </div>

            </div>

        `;

    }).join("");
}


// =====================================================
// SEARCH + FILTER
// =====================================================

function filterRooms() {

    const search =
        document
            .getElementById("searchInput")
            .value
            .toLowerCase()
            .trim();


    const type =
        document
            .getElementById("typeFilter")
            .value;


    const filtered =
        allRooms.filter(room => {

            const matchesSearch =
                room.room_number
                    .toLowerCase()
                    .includes(search) ||

                room.room_type
                    .toLowerCase()
                    .includes(search);


            const matchesType =
                type === "all" ||
                room.room_type === type;


            return matchesSearch && matchesType;

        });


    displayRooms(filtered);
}


// =====================================================
// OPEN ADD ROOM MODAL
// =====================================================

function openRoomModal() {

    document.getElementById("modalTitle").textContent =
        "Add New Room";

    document.getElementById("roomForm").reset();

    document.getElementById("roomId").value = "";

    document
        .getElementById("roomModal")
        .classList.remove("hidden");
}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeRoomModal() {

    document
        .getElementById("roomModal")
        .classList.add("hidden");
}


// =====================================================
// ADD / UPDATE ROOM
// =====================================================

document
    .getElementById("roomForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        const roomId =
            document.getElementById("roomId").value;


        const roomData = {

            room_number:
                document.getElementById("roomNumber").value.trim(),

            room_type:
                document.getElementById("roomType").value,

            price:
                Number(document.getElementById("roomPrice").value),

            capacity:
                Number(document.getElementById("roomCapacity").value)

        };


        try {

            let response;


            if (roomId) {

                response = await fetch(
                    `/api/rooms/${roomId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(roomData)
                    }
                );

            } else {

                response = await fetch(
                    "/api/rooms",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify(roomData)
                    }
                );

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message || "Operation failed"
                );

            }


            showToast(
                roomId
                    ? "Room updated successfully"
                    : "Room added successfully"
            );


            closeRoomModal();

            loadRooms();


        } catch (error) {

            alert(error.message);

        }

    });


// =====================================================
// EDIT ROOM
// =====================================================

async function editRoom(id) {

    try {

        const response =
            await fetch(`/api/rooms/${id}`);


        if (!response.ok) {

            throw new Error(
                "Unable to load room details"
            );

        }


        const room =
            await response.json();


        document.getElementById("roomId").value =
            room.id;

        document.getElementById("roomNumber").value =
            room.room_number;

        document.getElementById("roomType").value =
            room.room_type;

        document.getElementById("roomPrice").value =
            room.price;

        document.getElementById("roomCapacity").value =
            room.capacity;


        document.getElementById("modalTitle").textContent =
            "Edit Room";


        document
            .getElementById("roomModal")
            .classList.remove("hidden");


    } catch (error) {

        alert(error.message);

    }
}


// =====================================================
// DELETE ROOM
// =====================================================

async function deleteRoom(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this room?"
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `/api/rooms/${id}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message || "Unable to delete room"
            );

        }


        showToast(
            "Room deleted successfully"
        );


        loadRooms();


    } catch (error) {

        alert(error.message);

    }
}


// =====================================================
// BOOK ROOM
// =====================================================

function bookRoom(id) {

    window.location.href =
        `bookings.html?room=${id}`;

}


// =====================================================
// TOAST
// =====================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");

    const toastText =
        document.getElementById("toastText");


    toastText.textContent =
        message;


    toast.classList.add("show");


    setTimeout(() => {

        toast.classList.remove("show");

    }, 2500);
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
// INITIAL LOAD
// =====================================================

loadRooms();