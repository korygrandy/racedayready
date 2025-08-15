// This file contains mock data for seeding the database for testing and demonstration purposes.

export const MOCK_TRACKS = [
    {
        name: "Laguna Seca",
        location: "Monterey, CA",
        type: "Circuit",
        photoURL: "https://storage.googleapis.com/raceday-ready-assets/laguna-seca.jpg",
        layout_photoURL: "https://storage.googleapis.com/raceday-ready-assets/laguna-seca-layout.png",
        google_url: "https://maps.app.goo.gl/Pz4gV8jY9b7X6Z2t5"
    },
    {
        name: "Sonoma Raceway",
        location: "Sonoma, CA",
        type: "Circuit",
        photoURL: "https://storage.googleapis.com/raceday-ready-assets/sonoma-raceway.jpg",
        layout_photoURL: "https://storage.googleapis.com/raceday-ready-assets/sonoma-layout.png",
        google_url: "https://maps.app.goo.gl/fK8a9Z7J6c5X4E3t6"
    },
    {
        name: "Thunderhill Raceway Park",
        location: "Willows, CA",
        type: "Circuit",
        photoURL: "https://storage.googleapis.com/raceday-ready-assets/thunderhill.jpg",
        layout_photoURL: "https://storage.googleapis.com/raceday-ready-assets/thunderhill-layout.png",
        google_url: "https://maps.app.goo.gl/sY2m3N6wX9Z5R1A27"
    }
];

export const MOCK_USERS = [
    {
        profile: {
            username: "SpeedRacer",
            helmetColor: "#FF0000",
            theme: "dark",
            pinEnabled: true,
            pin: "1234"
        },
        garages: [
            { name: "Main Garage" },
            { name: "Project Cars", shared: true, garageDoorCode: "4321" }
        ],
        vehicles: [
            { year: "2023", make: "Porsche", model: "911 GT3 RS", garageIndex: 0, photoURL: "https://storage.googleapis.com/raceday-ready-assets/gt3rs.jpg" },
            { year: "2021", make: "BMW", model: "M3 Competition", garageIndex: 0, photoURL: "https://storage.googleapis.com/raceday-ready-assets/bmw-m3.jpg" },
            { year: "1995", make: "Mazda", model: "Miata", garageIndex: 1, photoURL: "https://storage.googleapis.com/raceday-ready-assets/miata.jpg" }
        ],
        checklists: [
            {
                name: "Standard Track Day",
                pre_race_tasks: ["Check tire pressures", "Torque lug nuts", "Fill gas tank"],
                mid_day_tasks: ["Review tire wear", "Check oil level"],
                post_race_tasks: ["Load car onto trailer", "Pack up tools"]
            }
        ],
        events: [
            {
                name: "Laguna Seca Track Day",
                trackIndex: 0,
                isRaceday: true,
                vehicleIndices: [0],
                checklistIndices: [0]
            },
            {
                name: "Thunderhill Test & Tune",
                trackIndex: 2,
                isRaceday: false,
                vehicleIndices: [1, 2],
                checklistIndices: [0]
            }
        ],
        lap_times: [
            { eventName: "Laguna Seca Track Day", lapTime: "01:28.554" }
        ]
    },
    {
        profile: {
            username: "DriftKing",
            helmetColor: "#00FF00",
            theme: "light",
            pinEnabled: false,
            pin: ""
        },
        garages: [
            { name: "Drift Hangar" }
        ],
        vehicles: [
            { year: "1998", make: "Nissan", model: "240SX (S14)", garageIndex: 0, photoURL: "https://storage.googleapis.com/raceday-ready-assets/s14.jpg" },
            { year: "2003", make: "Nissan", model: "350Z", garageIndex: 0, photoURL: "https://storage.googleapis.com/raceday-ready-assets/350z.jpg" }
        ],
        checklists: [],
        events: [
            {
                name: "Sonoma Drift Event",
                trackIndex: 1,
                isRaceday: true,
                vehicleIndices: [0],
                checklistIndices: []
            },
            {
                name: "Thunderhill Drift Practice",
                trackIndex: 2,
                isRaceday: false,
                vehicleIndices: [0, 1],
                checklistIndices: []
            }
        ]
    },
    {
        profile: {
            username: "NewbieDriver",
            helmetColor: "#0000FF",
            theme: "dark",
            pinEnabled: false,
            pin: ""
        },
        garages: [
            { name: "My First Garage" }
        ],
        vehicles: [
            { year: "2022", make: "Honda", model: "Civic Si", garageIndex: 0, photoURL: "https://storage.googleapis.com/raceday-ready-assets/civic-si.jpg" }
        ],
        checklists: [],
        events: [
            {
                name: "First Track Day!",
                trackIndex: 2,
                isRaceday: true,
                vehicleIndices: [0],
                checklistIndices: []
            }
        ]
    },
    {
        profile: {
            username: "AdminRacer",
            helmetColor: "#FFA500",
            theme: "dark",
            pinEnabled: true,
            pin: "3511"
        },
        garages: [
            { name: "Admin Fleet" }
        ],
        vehicles: [
            { year: "2024", make: "Chevrolet", model: "Corvette Z06", garageIndex: 0, photoURL: "https://storage.googleapis.com/raceday-ready-assets/z06.jpg" }
        ],
        checklists: [
            {
                name: "Full Race Weekend",
                pre_race_tasks: ["Tech Inspection", "Register", "Set tire pressures"],
                mid_day_tasks: ["Review data", "Adjust suspension"],
                post_race_tasks: ["Review results", "Clean car"]
            }
        ],
        events: [
            {
                name: "Admin Raceday at Sonoma",
                trackIndex: 1,
                isRaceday: true,
                vehicleIndices: [0],
                checklistIndices: [0]
            }
        ],
        lap_times: [
            { eventName: "Admin Raceday at Sonoma", lapTime: "01:42.123" }
        ]
    }
];

export const MOCK_VEHICLES = [
    { id: 'mock-v1', year: "2023", make: "Porsche", model: "911 GT3 RS", garageName: "Main Garage", photoURL: "https://storage.googleapis.com/raceday-ready-assets/gt3rs.jpg" },
    { id: 'mock-v2', year: "2021", make: "BMW", model: "M3 Competition", garageName: "Main Garage", photoURL: "https://storage.googleapis.com/raceday-ready-assets/bmw-m3.jpg" },
    { id: 'mock-v3', year: "1995", make: "Mazda", model: "Miata", garageName: "Project Cars", photoURL: "https://storage.googleapis.com/raceday-ready-assets/miata.jpg" },
    { id: 'mock-v4', year: "1998", make: "Nissan", model: "240SX (S14)", garageName: "Drift Hangar", photoURL: "https://storage.googleapis.com/raceday-ready-assets/s14.jpg" },
    { id: 'mock-v5', year: "2003", make: "Nissan", model: "350Z", garageName: "Drift Hangar", photoURL: "https://storage.googleapis.com/raceday-ready-assets/350z.jpg" },
    { id: 'mock-v6', year: "2022", make: "Honda", model: "Civic Si", garageName: "My First Garage", photoURL: "https://storage.googleapis.com/raceday-ready-assets/civic-si.jpg" },
    { id: 'mock-v7', year: "2024", make: "Chevrolet", model: "Corvette Z06", garageName: "Admin Fleet", photoURL: "https://storage.googleapis.com/raceday-ready-assets/z06.jpg" }
];
