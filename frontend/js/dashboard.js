async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        if (!response.ok) {
            throw new Error("Unable to load dashboard data");
        }

        const data = await response.json();

        document.getElementById("totalRooms").textContent =
            data.totalRooms;

        document.getElementById("availableRooms").textContent =
            data.availableRooms;

        document.getElementById("totalBookings").textContent =
            data.totalBookings;

        document.getElementById("cancelledBookings").textContent =
            data.cancelledBookings;

    } catch (error) {

        console.error("Dashboard error:", error);

    }
}


function showCurrentDate() {

    const today = new Date();

    const options = {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    };

    document.getElementById("currentDate").textContent =
        today.toLocaleDateString("en-IN", options);
}


loadDashboard();
showCurrentDate();