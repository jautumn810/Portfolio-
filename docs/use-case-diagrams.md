# TruckLink — Use Case Diagrams

## System Actors

| Actor | Role | Key Capabilities |
|---|---|---|
| **Admin** | Platform administrator | Full access to all resources, accept/reject bids, manage users/trucks |
| **Dispatcher** | Operations coordinator | View all loads/trucks, accept/reject bids, optimize routes |
| **Shipper** | Posts freight loads | Create/edit loads, accept/reject bids on own loads |
| **Carrier** | Fleet operator | Place bids on loads, view fleet, optimize routes |
| **Driver** | Operates trucks | Place bids on loads, view assigned loads, track routes |

---

## UC-01: User Authentication

```mermaid
flowchart TD
    A([User]) -->|Visits /login| B[Login Page]
    B -->|Enters credentials| C{Valid?}
    C -->|Yes| D[JWT issued — 24h expiry]
    C -->|No| E[401 Unauthorized]
    D -->|Stored in localStorage| F[Redirect to /dashboard]
    
    A -->|Visits /register| G[Registration Page]
    G -->|Selects role + fills form| H{Email taken?}
    H -->|Yes| I[409 Conflict]
    H -->|No| J[Password hashed + User created]
    J -->|JWT issued| F
```

---

## UC-02: Load Board & Bidding

```mermaid
flowchart TD
    S([Shipper]) -->|POST /api/loads| A[Create Load]
    A -->|status=posted| B[Load appears on board]
    
    D([Driver/Carrier]) -->|GET /api/loads| C[Browse Load Board]
    C -->|Filter by status, freight type| C
    D -->|POST /api/bids| E{Load open for bidding?}
    E -->|No — assigned/delivered| F[409 Conflict]
    E -->|Yes| G[Bid created status=pending]
    G -->|Load status→bidding| H[Shipper notified via Socket.io]
    
    S -->|GET /api/loads/:id/bids| I[Review Bids]
    S -->|PATCH /api/bids/:id status=accepted| J[Bid accepted]
    J -->|All other bids rejected| K[Load status→assigned]
    K -->|Driver assigned to load| L[Real-time update broadcast]
    
    D -->|DELETE /api/bids/:id| M{Bid accepted?}
    M -->|Yes| N[409 — Cannot withdraw]
    M -->|No| O[Bid withdrawn]
```

---

## UC-03: Fleet Management

```mermaid
flowchart TD
    Admin([Admin/Dispatcher]) -->|GET /api/trucks| A[View Fleet Grid]
    A -->|Filter by status, type| A
    A -->|Click truck card| B[Truck Detail Modal]
    B --> C{Make, model, year\nFuel level, mileage\nLocation, status}
    
    Admin -->|GET /api/trucks/telematics| D[Live GPS Positions]
    D -->|Socket.io trucks:positions| E[Map updates every 5s]
    
    Admin -->|PATCH /api/trucks/:id| F[Update Truck Status]
    F -->|status=maintenance| G[Truck marked unavailable]
    F -->|status=available| H[Truck available for dispatch]
```

---

## UC-04: Route Optimization

```mermaid
flowchart TD
    U([Any Authenticated User]) -->|Visit /routes| A[Route Optimizer Page]
    A -->|Select origin city| B[City Picker Dropdown]
    A -->|Select destination city| C[City Picker Dropdown]
    B & C -->|Click Optimize Route| D[POST /api/routes/optimize]
    D -->|Haversine formula + 1.22 road factor| E[Distance calculated]
    E --> F[Duration at 55 mph avg]
    E --> G[Fuel cost at 6.5 mpg × $4.10/gal]
    E --> H{avoidTolls?}
    H -->|Yes| I[tollCost = $0]
    H -->|No| J[tollCost = distance × $0.08/mi]
    F & G & I & J --> K[5 Waypoints generated]
    K --> L[3 Alternative Routes: Fastest / Scenic / Toll-Free]
    L --> M[Results displayed on page]
```

---

## UC-05: Real-Time Updates (Socket.io)

```mermaid
sequenceDiagram
    participant Server
    participant Socket as Socket.io
    participant Frontend

    Server->>Server: setInterval every 5s
    Server->>Server: Move in_transit trucks by random delta
    Server->>Socket: emit trucks:positions [{id, lat, lng, speed, ...}]
    Socket-->>Frontend: trucks:positions event
    Frontend->>Frontend: Update truck markers on map

    Note over Server,Frontend: On bid placed
    Server->>Socket: emit bid:created {bid data}
    Socket-->>Frontend: bid:created event
    Frontend->>Frontend: Show desktop notification + update bid list

    Note over Server,Frontend: On bid accepted/rejected
    Server->>Socket: emit bid:updated {bid data}
    Socket-->>Frontend: bid:updated event
    Frontend->>Frontend: Update bid status in UI

    Note over Server,Frontend: On load status change
    Server->>Socket: emit load:updated {id}
    Socket-->>Frontend: load:updated event
    Frontend->>Frontend: Invalidate React Query cache for loads
```

---

## UC-06: User Profile Management

```mermaid
flowchart TD
    U([Authenticated User]) -->|GET /api/auth/me| A[View Profile]
    A --> B{Show: name, email, role\ncompany, phone\ntotal loads, rating\nmember since}
    
    U -->|Click Edit Profile| C[Edit Form opens]
    C -->|Modify name / phone / company| D[PATCH /api/users/:id]
    D -->|isOwner check| E{Authorized?}
    E -->|No — different user| F[403 Forbidden]
    E -->|Yes — own profile| G[Profile updated]
    G -->|JWT user data refreshed| H[UI updates immediately]
    
    U -->|GET /api/bids?bidderId=:id| I[Recent Bids section]
    I --> J[Shows last 5 bids with status, route, amount]
```

---

## UC-07: Analytics Dashboard

```mermaid
flowchart TD
    Admin([Admin/Dispatcher]) -->|Visit /dashboard| A[Dashboard Page]
    A -->|GET /api/analytics/dashboard| B[KPI Cards]
    B --> C[Total Trucks count]
    B --> D[Active Loads count]
    B --> E[Total Revenue sum]
    B --> F[Total Drivers count]
    
    A -->|GET /api/analytics/loads| G[Monthly Load Chart]
    G -->|Recharts LineChart| H[12-month load volume trend]
    
    A -->|GET /api/analytics/revenue| I[Revenue Chart]
    I -->|Recharts BarChart| J[12-month revenue trend]
    
    A --> K[Load Status Pie Chart]
    K --> L[posted / bidding / assigned / in_transit / delivered]
```

---

## UC-08: Chatbot Assistant

```mermaid
flowchart TD
    U([Authenticated User]) -->|Click chat bubble ↘| A[Chat Window opens]
    A -->|Type message| B[POST /api/chat/message]
    B -->|Keyword: load/loads| C[Load board info response]
    B -->|Keyword: route| D[Route optimizer info response]
    B -->|Keyword: bid| E[Bidding info response]
    B -->|Keyword: truck/fleet| F[Fleet status info response]
    B -->|Keyword: fuel| G[Fuel cost info response]
    B -->|No keyword match| H[General help response]
    C & D & E & F & G & H --> I[Bot reply displayed in chat]
```
