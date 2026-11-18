![Driver দেন — an animated driver profile shows experience, a service rate, and a hiring request.](./driverden-banner.gif)

# Driver দেন
### Driver Hiring Management System

> **Hire a driver, not a car.**

**CSC 3215 · Web Technologies**  
American International University–Bangladesh · Fall 2026–27

[Overview](#project-overview) · [User roles](#user-roles) · [Booking lifecycle](#booking-lifecycle) · [Technology](#technology) · [Database](#database-design) · [Demo walkthrough](#demo-walkthrough)

---

## Project overview

**Driver দেন** comes from **ড্রাইভার দেন** — “Give me a driver.” The project connects people who need someone to drive with drivers who offer services. A vehicle type on a driver profile tells the customer what that driver can operate; it is not a vehicle listing or a rental offer.

A customer can search for a driver, compare two drivers for the same service, calculate an estimated base amount, submit a hiring request, and review a completed hire. The broader system design covers what happens behind that customer journey: drivers set their availability, agencies act on behalf of affiliated drivers when authorised, and administrators oversee verification and disputed records.

The project has two parts:

| Part | What it covers |
| --- | --- |
| **Frontend coursework prototype** | The pages and browser-side interactions, including the customer workflow described below. |
| **Relational database design** | The records, relationships, rules, and audit history needed to support the wider four-role system. |

The browser demo is not presented as a live service or as connected to the database.

## User roles

Driver দেন is designed around **four user roles**. Each has a different responsibility and should see or change only the records relevant to that role.

| Role | Main responsibility | Typical actions |
| --- | --- | --- |
| **Customer** | Find and hire a driver | Search, compare, submit requests, track or cancel eligible requests, and manage reviews. |
| **Driver** | Offer driving services and manage work | Maintain profile and service information, set working hours, block unavailable times, and manage assigned work. |
| **Agency** | Coordinate affiliated drivers | Manage branches and staff, handle driver affiliations, and act on attributed bookings when the driver has granted the required permission. |
| **Admin** | Oversee verification and exceptions | Assess verification evidence, review operational issues, and handle escalated attendance decisions or appeals in the system design. |

### Customer — finding and hiring a driver

The Customer module is the walkthrough-ready part of the frontend coursework.

| Page | How it works |
| --- | --- |
| **Dashboard** | JavaScript counts the current driver profiles, requests, pending requests, and reviews, then displays those totals in the dashboard. |
| **Find Drivers** | The search checks each driver’s location and experience, then checks their services against the selected service and maximum rate. The rate filter is tied to the selected service so the customer is not filtering hourly and monthly prices as if they were the same. |
| **Compare Drivers** | The customer selects two different driver IDs and one service. The page displays their locations, experience, vehicle types, verification status, rates, and included scope. If both drivers offer the service with the same billing unit, the lower rate is highlighted. A missing service shows “Not offered,” not a zero price. |
| **Hire a Driver** | Choosing a driver determines which services are available. The booking summary shows the listed rate, billing unit, included scope, and minimum quantity. The estimated base amount is the listed rate multiplied by the quantity. Submitting a request is not the same as receiving acceptance. |
| **My Requests** | The table displays the request ID, driver, service or contract, start date, amount, and status. Cancelling an eligible request changes its status to `Cancelled`; the row remains visible. |
| **My Reviews** | Only completed hires are offered in the review form. Selecting a hire with an existing review loads its rating and comment for editing. Deleting a review requires confirmation and does not remove the completed hire. |

The supplied customer demo starts with **five sample driver profiles, four sample hiring requests, and one fictional sample review** before any saved browser data is loaded. The sample profiles include two drivers with the same display name; their distinct driver IDs keep selections and comparisons unambiguous.

### Driver — profile, services, and availability

The driver-side design separates three things that customers need to know: **who the driver is, what work they offer, and when they can work**.

- **Profile and qualifications:** Driver records can be associated with personal details, licences, supporting documents, languages, service areas, and vehicle types.
- **Services and rates:** A driver can offer more than one service. Rates should be read with their billing unit and included scope, rather than treated as one universal salary or fee.
- **Recurring working hours:** Weekly rules describe when a driver normally accepts work, with local times and effective dates.
- **Personal time blocks:** A driver can block a specific interval for leave, rest, or another reason. A busy interval can be shared where authorised without exposing the private note behind it.
- **Work commitments:** An accepted booking can contain one or more dated work sessions. Those sessions represent agreed work; changing a preference does not silently cancel them.
- **Schedule changes:** A proposal keeps the original session in place until an authorised approval applies a new time. Pending proposals can expire.

### Agency — affiliation and delegated booking actions

An agency is not the same thing as a driver account. It has its own organisation records, branches, staff, documents, and verification history.

- **Staff and branches:** The design records who belongs to an agency and can associate staff with specific branches.
- **Driver affiliation:** A driver can be invited by an agency or request to join it. Membership and membership history are separate from those invitations and requests.
- **Driver consent:** Being affiliated does not automatically allow the agency to act for a driver. The design distinguishes permission to view busy intervals, propose bookings, accept bookings, and cancel bookings.
- **Booking attribution:** An agency-related request is linked to the relevant agency and driver membership. Direct and agency bookings still use the same driver schedule.
- **Action history:** A delegated acceptance or cancellation can record the staff member, the driver authorisation used, and the resulting booking status change.

### Admin — verification, review, and oversight

The admin and platform-staff design handles cases that should not be decided by a customer or agency alone.

- **Verification:** Agency documents and verification reviews are separate records, so the system can distinguish evidence submitted from the decision reached.
- **Attendance oversight:** Check-in and check-out reports are claims. An authorised reviewer can assess those claims before an accepted work time is applied.
- **Disputes and appeals:** An original attendance decision is preserved. If an appeal succeeds, a separate correction can supersede that decision, and a separate audit record can capture any resulting change to the session’s actual work times.
- **Operational follow-up:** Database views can surface unresolved attendance, pending or overdue schedule proposals, active appeals, and consistency issues.

These Driver, Agency, and Admin sections describe the wider system design, not a claim that every screen or permission check is already live.

## Booking lifecycle

```text
Find a driver → Compare a service → Submit a hiring request
                                          │
                               Driver acceptance pending
                                          │
                              Accepted booking and sessions
                                          │
                               Work performed and completed
                                          │
                                   Customer review
```

1. **Choose a service.** The customer checks the rate, billing unit, and included scope. For example, a BDT 300 hourly service with a two-hour minimum has a BDT 600 estimated base amount for the minimum booking.
2. **Submit a request.** The request records what the customer asked for. It is not proof that the driver accepted or that time has been reserved.
3. **Check availability before acceptance.** In the system design, accepted work must respect the driver’s working hours, personal blocks, and existing commitments. Direct and agency work share the same calendar.
4. **Record individual sessions.** The booking is the agreement; sessions are the actual dated work intervals. A monthly agreement does not mean the driver is booked for every hour of that month.
5. **Process changes explicitly.** A schedule proposal can be approved, rejected, withdrawn, invalidated, or expired. The original interval remains in place until an approved change is applied.
6. **Keep reported and accepted times separate.** An attendance report does not automatically change the session. A decision can accept or reject the claim, and a later correction can change the effective outcome without erasing the original.
7. **Review completed work.** The customer can leave a rating and comment after completion. The review can be managed independently of the hiring record.

## Technology

| Technology | What we use it for |
| --- | --- |
| **HTML** | Page structure, navigation, forms, labels, and results tables. |
| **CSS** | The shared Driver দেন design and role-specific styles. The stylesheet plan is one shared file (`common.css`) and one per role (`customer.css`, `driver.css`, `agency.css`, `admin.css`). |
| **Vanilla JavaScript** | Filtering demo records, building dropdowns and tables, validating forms, calculating estimates, and updating the page without a full reload. |
| **Browser local storage** | Saving demo hiring requests and reviews in the current browser. Existing saved data is loaded before display; failed saves produce a message instead of being reported as successful. |
| **Relational SQL design** | Separately defines tables, keys, constraints, views, and stored procedures for the broader system. |
| **Git and GitHub** | Version control, team collaboration, and project documentation. |

### How the customer code is organised

| File | Responsibility |
| --- | --- |
| `customer.js` | Shared demo data and helpers, dashboard totals, driver search, side-by-side comparison, and request rendering and cancellation. |
| `hire.js` | The service-based hiring page’s entry points: initialise the form, update the available services and estimate, and handle submission. |
| `reviews.js` | Load and save reviews, populate completed hires, render the review table, validate and save reviews, and handle confirmed deletion. |

The frontend stores hiring requests under `driverDenHiringRequests` and reviews under `driverDenReviews`. The two lists are stored separately. For example, deleting the last review saves an empty review list rather than removing the storage key, so the fictional sample review does not return on refresh.

### Create, Read, Update, and Delete

The reviews module demonstrates all four operations on the same kind of record:

| Operation | Review example |
| --- | --- |
| **Create** | Save a rating and written review for a completed hire. |
| **Read** | Display saved reviews and load an existing review into the form. |
| **Update** | Change the rating or comment for a hire that already has a review. |
| **Delete** | Confirm removal of the selected review and save the remaining reviews. |

Request cancellation is intentionally different: it is an **Update** to the request status, not a **Delete**. These operations run against browser data in the demo, not live server records.

## Database design

The database design groups records by responsibility instead of storing the entire process in one booking table.

| Area | What it models |
| --- | --- |
| **Accounts and driver profiles** | Users, driver profiles, personal and identity details, licences, documents, addresses, and emergency contacts. |
| **Services and reference data** | Driver rates, work preferences, languages, vehicle types, work types, and service areas. |
| **Agency operations** | Agencies, branches, staff, invitations, verification documents, and reviews. |
| **Affiliation and consent** | Driver–agency memberships, membership history, authorisations, and consent events. |
| **Hiring and scheduling** | Parent requests, agency attribution, status history, dated work sessions, recurring working hours, and personal time blocks. |
| **Schedule proposals** | Original and proposed intervals, decision deadlines, outcomes, and history. |
| **Attendance and appeals** | Check-in and check-out reports, reviews, original decisions, appeal outcomes, and corrections to effective decisions or session times. |
| **Notifications** | In-app notices, unread counts, and optional category preferences. |

### What the database rules protect

- **Record ownership:** A foreign key links related records. Composite links can also check that the IDs belong together—for example, that a delegated booking action points to the correct agency, driver membership, and request.
- **Valid dates and values:** Row-level checks can reject intervals whose end is not after the start, or require the right fields when a record moves to a resolved state.
- **Booking consistency:** Preventing double-booking is not just a date check on one row. The booking workflow must check competing sessions and coordinate concurrent changes before accepting new work.
- **History:** Current state and historical evidence are stored separately. Cancelling a request, moving a session, or correcting an attendance decision should not erase the original record.
- **Read models:** Views bring together effective attendance decisions, operational queues, audit timelines, and notification counts without editing the underlying records.
- **Routine operations:** Stored procedures were designed for expiring schedule proposals and marking notices as read. A procedure that expires proposals still needs to be called; its existence does not mean an automatic scheduler is running.

## Demo walkthrough

1. Open **Find Drivers** and select a service or filter by location.
2. Open **Compare Drivers** and choose `DRV001` and `DRV002` with **Full-time (Monthly Contract)**. The sample monthly rates are BDT 22,000 and BDT 32,000, so the first is highlighted as the lower rate. The second still has more listed experience; the page does not turn those two facts into a single “best driver” score.
3. Open **Hire a Driver** and choose a service. Change the booking quantity to see the estimated base amount update.
4. Open **My Requests**. Cancel an eligible sample request and verify that it is still listed with the `Cancelled` status.
5. Open **My Reviews** and select the completed sample hire `REQ003`. Try editing the review, cancelling a deletion with **Keep Review**, then confirming a deletion. Refresh the page to verify the saved result. The hiring request should remain unchanged.

## Project scope

- The frontend is a coursework prototype. It uses sample data and does not send requests to real drivers.
- Browser storage demonstrates persistence on the same browser. It is not shared storage or evidence of server-side login, permissions, or synchronisation.
- Driver, Agency, and Admin responsibilities describe the broader system design. The customer walkthrough is not proof that all four roles have been deployed.
- The SQL design and browser demo are separate. Database integration, server-side authorisation, and production deployment are not claimed in this README.

## Clone the repository

```bash
gh repo clone raisa0411/fall-26-27-DriversDen-management-system
```

---

*Driver দেন · CSC 3215 Web Technologies · Fall 2026–27*
