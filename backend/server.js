const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend later
app.use(express.static(path.join(__dirname, "../frontend")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// =====================================================
// HOME
// =====================================================

app.get("/api", (req, res) => {
    res.json({
        message: "Hotel Room Booking API is running successfully!"
    });
});

// =====================================================
// ROOM APIs
// =====================================================

// Get all rooms
app.get("/api/rooms", (req, res) => {

    const query = `
        SELECT 
            r.*,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM bookings b
                    WHERE b.room_id = r.id
                    AND b.status = 'Confirmed'
                    AND date(b.check_in) <= date('now')
                    AND date(b.check_out) > date('now')
                )
                THEN 'Booked'
                ELSE r.status
            END AS current_status
        FROM rooms r
        ORDER BY r.room_number
    `;

    db.all(query, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});


// Get single room



// Add new room
app.post("/api/rooms", (req, res) => {

    const {
        room_number,
        room_type,
        price,
        capacity
    } = req.body;

    if (!room_number || !room_type || !price || !capacity) {
        return res.status(400).json({
            message: "All room fields are required"
        });
    }

    const query = `
        INSERT INTO rooms
        (room_number, room_type, price, capacity)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        query,
        [room_number, room_type, price, capacity],
        function (err) {

            if (err) {

                if (err.message.includes("UNIQUE")) {
                    return res.status(400).json({
                        message: "Room number already exists"
                    });
                }

                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Room added successfully",
                roomId: this.lastID
            });
        }
    );
});


// Update room
app.put("/api/rooms/:id", (req, res) => {

    const { id } = req.params;

    const {
        room_number,
        room_type,
        price,
        capacity,
        status
    } = req.body;

    const query = `
        UPDATE rooms
        SET
            room_number = ?,
            room_type = ?,
            price = ?,
            capacity = ?,
            status = ?
        WHERE id = ?
    `;

    db.run(
        query,
        [
            room_number,
            room_type,
            price,
            capacity,
            status || "Available",
            id
        ],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            res.json({
                message: "Room updated successfully"
            });
        }
    );
});


// Delete room
app.delete("/api/rooms/:id", (req, res) => {

    const { id } = req.params;

    db.get(
        "SELECT * FROM bookings WHERE room_id = ? AND status = 'Confirmed'",
        [id],
        (err, booking) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (booking) {
                return res.status(400).json({
                    message: "Cannot delete a room with an active booking"
                });
            }

            db.run(
                "DELETE FROM rooms WHERE id = ?",
                [id],
                function (err) {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (this.changes === 0) {
                        return res.status(404).json({
                            message: "Room not found"
                        });
                    }

                    res.json({
                        message: "Room deleted successfully"
                    });
                }
            );
        }
    );
});


// =====================================================
// SEARCH AVAILABLE ROOMS
// =====================================================

app.get("/api/rooms/available", (req, res) => {

    const {
        checkIn,
        checkOut,
        type
    } = req.query;

    if (!checkIn || !checkOut) {
        return res.status(400).json({
            message: "Check-in and check-out dates are required"
        });
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
        return res.status(400).json({
            message: "Check-out date must be after check-in date"
        });
    }

    let query = `
        SELECT r.*
        FROM rooms r
        WHERE r.status = 'Available'
        AND NOT EXISTS (
            SELECT 1
            FROM bookings b
            WHERE b.room_id = r.id
            AND b.status = 'Confirmed'
            AND date(b.check_in) < date(?)
            AND date(b.check_out) > date(?)
        )
    `;

    const params = [checkOut, checkIn];

    if (type) {
        query += " AND r.room_type = ?";
        params.push(type);
    }

    query += " ORDER BY r.room_number";

    db.all(query, params, (err, rooms) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rooms);
    });
});
// Get single room
app.get("/api/rooms/:id", (req, res) => {

    const { id } = req.params;

    db.get(
        "SELECT * FROM rooms WHERE id = ?",
        [id],
        (err, room) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!room) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            res.json(room);
        }
    );
});


// =====================================================
// BOOKING APIs
// =====================================================

// Get all bookings
app.get("/api/bookings", (req, res) => {

    const query = `
        SELECT
            b.*,
            r.room_number,
            r.room_type,
            r.price
        FROM bookings b
        JOIN rooms r ON b.room_id = r.id
        ORDER BY b.created_at DESC
    `;

    db.all(query, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(rows);
    });
});


// Create booking
app.post("/api/bookings", (req, res) => {

    const {
        room_id,
        guest_name,
        guest_email,
        guest_phone,
        check_in,
        check_out
    } = req.body;

    // Basic validation
    if (
        !room_id ||
        !guest_name ||
        !guest_email ||
        !guest_phone ||
        !check_in ||
        !check_out
    ) {
        return res.status(400).json({
            message: "All booking fields are required"
        });
    }

    // Date validation
    if (new Date(check_out) <= new Date(check_in)) {
        return res.status(400).json({
            message: "Check-out date must be after check-in date"
        });
    }

    // Check room exists
    db.get(
        "SELECT * FROM rooms WHERE id = ?",
        [room_id],
        (err, room) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (!room) {
                return res.status(404).json({
                    message: "Room not found"
                });
            }

            if (room.status !== "Available") {
                return res.status(400).json({
                    message: "This room is currently unavailable"
                });
            }

            // Check overlapping booking
            const overlapQuery = `
                SELECT *
                FROM bookings
                WHERE room_id = ?
                AND status = 'Confirmed'
                AND date(check_in) < date(?)
                AND date(check_out) > date(?)
            `;

            db.get(
                overlapQuery,
                [room_id, check_out, check_in],
                (err, existingBooking) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    if (existingBooking) {
                        return res.status(400).json({
                            message:
                                "Room is already booked for the selected dates"
                        });
                    }

                    // Create booking
                    const insertQuery = `
                        INSERT INTO bookings
                        (
                            room_id,
                            guest_name,
                            guest_email,
                            guest_phone,
                            check_in,
                            check_out
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;

                    db.run(
                        insertQuery,
                        [
                            room_id,
                            guest_name,
                            guest_email,
                            guest_phone,
                            check_in,
                            check_out
                        ],
                        function (err) {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }

                            res.status(201).json({
                                message: "Booking confirmed successfully",
                                bookingId: this.lastID
                            });
                        }
                    );
                }
            );
        }
    );
});


// =====================================================
// CANCEL BOOKING
// =====================================================

app.delete("/api/bookings/:id", (req, res) => {

    const { id } = req.params;

    db.run(
        `
        UPDATE bookings
        SET status = 'Cancelled'
        WHERE id = ? AND status = 'Confirmed'
        `,
        [id],
        function (err) {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (this.changes === 0) {
                return res.status(404).json({
                    message: "Booking not found or already cancelled"
                });
            }

            res.json({
                message: "Booking cancelled successfully"
            });
        }
    );
});


// =====================================================
// DASHBOARD STATISTICS
// =====================================================

app.get("/api/dashboard", (req, res) => {

    const queries = {

        totalRooms:
            "SELECT COUNT(*) AS count FROM rooms",

        availableRooms:
            "SELECT COUNT(*) AS count FROM rooms WHERE status = 'Available'",

        totalBookings:
            "SELECT COUNT(*) AS count FROM bookings WHERE status = 'Confirmed'",

        cancelledBookings:
            "SELECT COUNT(*) AS count FROM bookings WHERE status = 'Cancelled'"
    };

    db.get(queries.totalRooms, [], (err, totalRooms) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        db.get(queries.availableRooms, [], (err, availableRooms) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            db.get(queries.totalBookings, [], (err, totalBookings) => {

                if (err) {
                    return res.status(500).json({
                        error: err.message
                    });
                }

                db.get(
                    queries.cancelledBookings,
                    [],
                    (err, cancelledBookings) => {

                        if (err) {
                            return res.status(500).json({
                                error: err.message
                            });
                        }

                        res.json({
                            totalRooms: totalRooms.count,
                            availableRooms: availableRooms.count,
                            totalBookings: totalBookings.count,
                            cancelledBookings: cancelledBookings.count
                        });
                    }
                );
            });
        });
    });
});


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {

    console.log(`
╔════════════════════════════════════════════╗
║       HOTEL BOOKING SYSTEM                 ║
║                                            ║
║       Server running on port ${PORT}          ║
║       http://localhost:${PORT}              ║
╚════════════════════════════════════════════╝
    `);
});