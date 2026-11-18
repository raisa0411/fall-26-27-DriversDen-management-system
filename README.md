![Driver দেন — Hire a driver, not a car.](./driverden-banner.gif)
# Driver দেন — Driver Hiring Management System

> **Hire a driver, not a car.**

**CSC 3215 · Web Technologies**  
American International University–Bangladesh · Fall 2026–27

## About Driver দেন

**Driver দেন** comes from the Bangla phrase **ড্রাইভার দেন** — “Give me a driver.” The name describes the project directly: customers come here to find and hire a person to drive, not to rent a vehicle.

DriverDen is a coursework prototype that brings the driver-hiring process into one place. A customer can find drivers by the service they need, compare what each driver offers, submit a hiring request, and leave a review after a completed hire.

## Why we built it

Two drivers can list different prices for what looks like the same job. One price might cover an hour, another might cover a booking, and the included working time can differ even when the rates look similar. DriverDen presents the **rate, billing unit, and included scope together** so customers can see what they are comparing before they send a request.

The project also separates the steps that happen after a customer chooses a driver. Submitting a request does not mean the driver has accepted it. Cancelling a request does not erase its history. And deleting a review does not delete the completed hire.

## Customer features

| Feature | What it does |
| --- | --- |
| **Customer Dashboard** | Shows totals for drivers, hiring requests, pending requests, and reviews. |
| **Find Drivers** | Filters driver profiles by location, minimum experience, service, and maximum rate. Profiles show service offerings and demo verification status. |
| **Compare Drivers** | Compares two drivers side by side, including experience, vehicle types, verification status, service rates, and included scope. The lower rate is highlighted only when both drivers offer the selected service with the same billing unit. |
| **Hire a Driver** | Lets the customer choose a driver, service, start date, and booking quantity, then see the estimated base amount before submitting. |
| **My Requests** | Lists hiring requests and their current statuses. Cancelling an eligible request updates its status while keeping the record visible. |
| **My Reviews** | Lets customers create, view, edit, and delete reviews linked to completed hires. Deletion requires confirmation and leaves the hiring request intact. |

## A walkthrough of the customer demo

1. **Open Find Drivers.** Select a service to see which drivers offer it and what each listed rate includes.
2. **Compare two drivers.** Choose the same service for both. For example, select two drivers who offer **Full-time (Monthly Contract)** to compare monthly rates. If one driver does not offer the selected service, the page shows **Not offered** rather than treating the missing rate as zero.
3. **Open Hire a Driver.** Choose a driver and service, enter the start date and quantity, and check the estimated base amount. The estimate is the listed rate multiplied by the selected quantity; it does not include separately agreed charges.
4. **Check My Requests.** View the request and its status. Cancel an eligible request to see how the status changes without removing the row.
5. **Open My Reviews.** Select a completed hire. If it already has a review, the form loads the saved rating and comment for editing. To remove a review, select **Delete**, then **Confirm Delete**.

## How the project is organised

The broader system design separates four roles. The customer workflow above describes the frontend demo; the other roles below describe responsibilities in the project design, not a claim that every workflow is implemented.

| Role | Responsibility in the system design |
| --- | --- |
| **Customer** | Find and compare drivers, request a hire, track requests, and review completed work. |
| **Driver** | Maintain a service profile and manage availability and work commitments. |
| **Agency** | Coordinate affiliated drivers and act on their behalf where authorised. |
| **Admin** | Oversee platform records and handle verification or administrative reviews. |

## Customer CRUD

The reviews module is the clearest example of all four operations on a single record type.

| Operation | Example in My Reviews |
| --- | --- |
| **Create** | Save a rating and written review for a completed hire. |
| **Read** | View saved reviews in the table or load one into the form. |
| **Update** | Change the rating or comment and save the existing review. |
| **Delete** | Confirm removal of a saved review from browser storage. |

Hiring requests follow a different rule: **Cancel** is an update to the request status, not a delete operation.

## Technical overview

| Layer | Role in the project |
| --- | --- |
| **HTML** | Structures the customer pages, forms, navigation, and results tables. |
| **CSS** | Uses shared styles and customer-specific rules to keep the plum, pink, and magenta design consistent across pages. |
| **Vanilla JavaScript** | Handles filtering, comparisons, validation, calculations, and updates to the page. |
| **Browser storage** | Persists demo hiring requests and reviews between page reloads in the same browser. |
| **Relational database design** | Separately models driver profiles, agency authorisations, bookings, work sessions, attendance, and notifications. |

## Current scope

- **Coursework prototype:** The demo uses sample data and does not send requests to real drivers.
- **Local persistence:** Request and review changes are stored in the current browser, not synced across accounts or devices.
- **Separate database design:** The frontend demo described here is not presented as connected to the relational database.

## Clone the repository

```bash
gh repo clone raisa0411/fall-26-27-DriversDen-management-system
```

---

*Driver দেন · A driver-hiring management prototype for CSC 3215 Web Technologies.*
