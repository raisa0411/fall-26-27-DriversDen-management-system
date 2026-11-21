/* =====================================================================
   data.js  -  Fictional sample data for the whole DriverDen demo
   ---------------------------------------------------------------------
   ONE shared file for every role (customer, driver, agency, admin).
   Every page loads it first, then common.js, then its own script.

   Rules for this file:
   - ALL data is fictional: no real names, phone numbers, NIDs or documents.
   - Ids are text with a prefix (u-, ag-, hr-, br-, m-, as-, con-, rep-, rv-).
     Never use an array position as an id.
   - Dates are "YYYY-MM-DD" text. End dates are INCLUSIVE.
   - Money is a number in BDT. Status words are lowercase (see each list).

   How it is used:
   seedData is only the STARTING data. common.js copies it into the
   browser's localStorage the first time (and after Reset). Pages then
   read and change the saved copy, never seedData itself.

   Who added what:
   - Hameem: drivers u-drv9 to u-drv13 with their services and rates,
     hiring requests, reviews, demo logins.
   - Akash: the main demo driver u-drv1 (profile, phone, summary,
     document) and his availability records av-3 to av-5.
   - Zinia: agencies, memberships, bulk requests, assignments,
     agency contracts, replacements, extra drivers u-drv7 and u-drv8.
   - Raisa: verification submissions, complaints (add more here).
   ===================================================================== */


// "Today" for every date rule in the project. Everyone calls getToday()
// (common.js) instead of new Date(), so all pages agree on the same day.
// USE_FIXED_TODAY = true  -> every page uses DEMO_TODAY (repeatable demo)
// USE_FIXED_TODAY = false -> every page uses the computer's real date
const USE_FIXED_TODAY = true;
const DEMO_TODAY = "2026-12-01";


// Labels for the service codes used in driverProfiles[].services (Hameem)
const jobTypeLabels = {
  FullTimeMonthly: "Full-time (Monthly Contract)",
  PartTimeDaily: "Part-time (Up to 4 Hours)",
  InsideCityTrip: "Single Trip (Inside City)",
  IntercityHighway: "Interdistrict / Highway Trip",
  RoundTrip: "Round Trip (Same-day Return)",
  NightShift: "Night Shift",
  WeekendOnly: "Weekend / Holiday",
  OnDemandHourly: "On-Demand / Hourly",
  OfficeSchoolRoutine: "Office / School Pick & Drop",
  EmergencyRelief: "Emergency / Backup Replacement",
  OutstationTour: "Outstation / Multi-day Tour"
};


// The whole starting data as ONE object of arrays of objects
const seedData = {
  schemaVersion: 1,

  // The account that is logged in (set by login.html through setCurrentUser)
  session: { currentUserId: null, compareDriverIds: [] },

  // Everyone who can log in. role: admin | customer | driver | agency_manager. status: active | suspended.
  // email + password are FICTIONAL demo logins used by login.html.
  users: [
    { id: "u-admin", name: "Nadia Rahman", role: "admin", status: "active", email: "admin@driverden.com", password: "admin123" },
    { id: "u-cus1", name: "Farhan Ahmed", role: "customer", status: "active", email: "customer@driverden.com", password: "customer123" },
    { id: "u-cus2", name: "Tasnim Kabir", role: "customer", status: "active", email: "tasnim@driverden.com", password: "tasnim123" },
    { id: "u-drv1", name: "Anisul Islam", role: "driver", status: "active", email: "driver@driverden.com", password: "driver123" },
    { id: "u-drv2", name: "Sohel Mia", role: "driver", status: "active", email: "sohel@driverden.com", password: "sohel123" },
    { id: "u-drv3", name: "Jamal Uddin", role: "driver", status: "active", email: "jamal@driverden.com", password: "jamal123" },
    { id: "u-drv4", name: "Arif Hossain", role: "driver", status: "active", email: "arif@driverden.com", password: "arif123" },
    { id: "u-drv5", name: "Kamal Sheikh", role: "driver", status: "active", email: "kamal@driverden.com", password: "kamal123" },
    { id: "u-drv6", name: "Babul Das", role: "driver", status: "suspended", email: "babul@driverden.com", password: "babul123" },
    { id: "u-drv7", name: "Mizan Rahman", role: "driver", status: "active", email: "mizan@driverden.com", password: "mizan123" },
    { id: "u-drv8", name: "Nayeem Khan", role: "driver", status: "active", email: "nayeem@driverden.com", password: "nayeem123" },
    { id: "u-drv9", name: "Nurjahan Karim", role: "driver", status: "active", email: "nurjahan@driverden.com", password: "nurjahan123" },
    { id: "u-drv10", name: "Kayium Ahmed Liton", role: "driver", status: "active", email: "kayium@driverden.com", password: "kayium123" },
    { id: "u-drv11", name: "Garibullah Shah", role: "driver", status: "active", email: "garibullah@driverden.com", password: "garibullah123" },
    { id: "u-drv12", name: "Rahimolla Showkot", role: "driver", status: "active", email: "rahimolla@driverden.com", password: "rahimolla123" },
    { id: "u-drv13", name: "Nurjahan Karim", role: "driver", status: "active", email: "nurjahan.b@driverden.com", password: "nurjahan123" },
    { id: "u-mgr1", name: "Shirin Akter", role: "agency_manager", status: "active", email: "agency@driverden.com", password: "agency123" },
    { id: "u-mgr2", name: "Tanvir Alam", role: "agency_manager", status: "active", email: "tanvir@driverden.com", password: "tanvir123" }
  ],

  // One profile per driver. verificationStatus: pending | approved | rejected.
  // experienceYears is in whole YEARS. services = the jobs, rates and units a customer can book (Hameem).
  driverProfiles: [
    {
      driverId: "u-drv1",
      area: "Mirpur",
      experienceYears: 6,
      expectedSalary: 24000,
      vehicleCategories: ["car"],
      verificationStatus: "approved",
      phone: "01711223344",
      summary: "Careful, punctual driver with six years of city driving experience.",
      documentName: "driving-licence.jpg",
      services: [
        { jobType: "FullTimeMonthly", rate: 24000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "PartTimeDaily", rate: 800, unit: "booking", scope: "Up to 4 hours", minimumQuantity: 1 },
        { jobType: "InsideCityTrip", rate: 550, unit: "trip", scope: "One-way, up to 2 hours", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv2",
      area: "Uttara",
      experienceYears: 4,
      expectedSalary: 22000,
      vehicleCategories: ["car"],
      verificationStatus: "approved",
      phone: "01711000002",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 22000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "OfficeSchoolRoutine", rate: 16000, unit: "month", scope: "Route and daily runs agreed before hiring", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv3",
      area: "Dhanmondi",
      experienceYears: 9,
      expectedSalary: 30000,
      vehicleCategories: ["car", "pickup"],
      verificationStatus: "approved",
      phone: "01711000003",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 30000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "IntercityHighway", rate: 2600, unit: "booking", scope: "Up to 8 hours of driver service", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv4",
      area: "Gulshan",
      experienceYears: 2,
      expectedSalary: 18000,
      vehicleCategories: ["car"],
      verificationStatus: "pending",
      phone: "01711000004",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 18000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv5",
      area: "Mohammadpur",
      experienceYears: 3,
      expectedSalary: 20000,
      vehicleCategories: ["microbus"],
      verificationStatus: "rejected",
      phone: "01711000005",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 20000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv6",
      area: "Banani",
      experienceYears: 7,
      expectedSalary: 27000,
      vehicleCategories: ["car"],
      verificationStatus: "approved",
      phone: "01711000006",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 27000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv7",
      area: "Badda",
      experienceYears: 5,
      expectedSalary: 24000,
      vehicleCategories: ["car", "microbus"],
      verificationStatus: "approved",
      phone: "01711000007",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 24000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "WeekendOnly", rate: 1500, unit: "booking", scope: "Up to 8 hours", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv8",
      area: "Motijheel",
      experienceYears: 3,
      expectedSalary: 21000,
      vehicleCategories: ["car"],
      verificationStatus: "approved",
      phone: "01711000008",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 21000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "NightShift", rate: 2000, unit: "booking", scope: "Up to 8 hours", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv9",
      area: "Dhanmondi",
      experienceYears: 1,
      expectedSalary: 22000,
      vehicleCategories: ["sedan"],
      verificationStatus: "approved",
      phone: "01711000009",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 22000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "PartTimeDaily", rate: 700, unit: "booking", scope: "Up to 4 hours", minimumQuantity: 1 },
        {
          jobType: "InsideCityTrip",
          rate: 500,
          unit: "trip",
          scope: "One-way, up to 2 hours, fare might increase based on time and traffic.",
          minimumQuantity: 1
        }
      ]
    },
    {
      driverId: "u-drv10",
      area: "Dhanmondi, Banani, Gulshan",
      experienceYears: 9,
      expectedSalary: 32000,
      vehicleCategories: ["all"],
      verificationStatus: "approved",
      phone: "01711000010",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 32000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "IntercityHighway", rate: 2500, unit: "booking", scope: "Up to 8 hours of driver service", minimumQuantity: 1 },
        { jobType: "OutstationTour", rate: 2500, unit: "day", scope: "Up to 8 service hours per day", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv11",
      area: "Mohammadpur, Dhanmondi",
      experienceYears: 2,
      expectedSalary: 27000,
      vehicleCategories: ["sedan", "suv", "off road", "van"],
      verificationStatus: "pending",
      phone: "01711000011",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 27000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "OfficeSchoolRoutine", rate: 18000, unit: "month", scope: "Route and daily runs agreed before hiring", minimumQuantity: 1 },
        { jobType: "WeekendOnly", rate: 1600, unit: "booking", scope: "Up to 8 hours", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv12",
      area: "Bashundhara RA",
      experienceYears: 4,
      expectedSalary: 25000,
      vehicleCategories: ["jeep"],
      verificationStatus: "approved",
      phone: "01711000012",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 25000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "OnDemandHourly", rate: 300, unit: "hour", scope: "Minimum booking of 2 hours", minimumQuantity: 2 },
        { jobType: "EmergencyRelief", rate: 1800, unit: "booking", scope: "Up to 8 hours", minimumQuantity: 1 }
      ]
    },
    {
      driverId: "u-drv13",
      area: "Banani",
      experienceYears: 3,
      expectedSalary: 29000,
      vehicleCategories: ["sedan", "suv", "luxury suv"],
      verificationStatus: "approved",
      phone: "01711000013",
      summary: "",
      documentName: "",
      services: [
        { jobType: "FullTimeMonthly", rate: 29000, unit: "month", scope: "Working hours and days agreed before hiring", minimumQuantity: 1 },
        { jobType: "RoundTrip", rate: 2000, unit: "booking", scope: "Outward and return journey, up to 8 hours total", minimumQuantity: 1 },
        { jobType: "NightShift", rate: 2200, unit: "booking", scope: "Up to 8 hours", minimumQuantity: 1 }
      ]
    }
  ],

  // verificationStatus: pending | approved | rejected.
  agencies: [
    { id: "ag-1", managerId: "u-mgr1", name: "Dhaka Fleet Partners", area: "Mirpur", verificationStatus: "approved" },
    { id: "ag-2", managerId: "u-mgr2", name: "Uttara Drive Services", area: "Uttara", verificationStatus: "pending" }
  ],

  // Fictional document METADATA only (no real files). subjectType: driver | agency.
  verificationSubmissions: [
    {
      id: "vs-1",
      subjectType: "driver",
      subjectId: "u-drv4",
      filename: "licence-sample.pdf",
      fileType: "application/pdf",
      fileSize: 182000,
      status: "pending",
      reason: "",
      reviewedAt: ""
    },
    {
      id: "vs-2",
      subjectType: "agency",
      subjectId: "ag-2",
      filename: "trade-licence-sample.pdf",
      fileType: "application/pdf",
      fileSize: 240000,
      status: "pending",
      reason: "",
      reviewedAt: ""
    },
    {
      id: "vs-3",
      subjectType: "driver",
      subjectId: "u-drv5",
      filename: "blurry-photo.jpg",
      fileType: "image/jpeg",
      fileSize: 95000,
      status: "rejected",
      reason: "Document image is not readable.",
      reviewedAt: "2026-11-18"
    },
    {
      id: "vs-4",
      subjectType: "driver",
      subjectId: "u-drv11",
      filename: "nid-sample.jpg",
      fileType: "image/jpeg",
      fileSize: 150000,
      status: "pending",
      reason: "",
      reviewedAt: ""
    }
  ],

  // type: available | unavailable (lowercase). End dates are inclusive.
  availability: [
    { id: "av-1", driverId: "u-drv7", startDate: "2026-11-20", endDate: "2026-11-25", type: "unavailable", reason: "Family visit" },
    { id: "av-2", driverId: "u-drv2", startDate: "2027-01-05", endDate: "2027-01-10", type: "unavailable", reason: "Leave" },
    { id: "av-3", driverId: "u-drv1", startDate: "2026-11-05", endDate: "2026-11-06", type: "unavailable", reason: "Personal work" },
    { id: "av-4", driverId: "u-drv1", startDate: "2026-11-10", endDate: "2026-11-15", type: "available", reason: "Ready for work" },
    { id: "av-5", driverId: "u-drv1", startDate: "2026-12-01", endDate: "2026-12-03", type: "unavailable", reason: "Family event" }
  ],

  // Customer -> driver direct requests. status: pending | accepted | declined | cancelled | confirmed.
  // Every request has startDate AND endDate, driverId and customerId.
  hiringRequests: [
    {
      id: "hr-0",
      customerId: "u-cus1",
      driverId: "u-drv1",
      startDate: "2026-11-10",
      endDate: "2026-12-10",
      duties: "Office commute, Mirpur to Motijheel",
      offeredSalary: 24000,
      status: "confirmed",
      jobType: "FullTimeMonthly",
      rate: 24000,
      unit: "month",
      quantity: 1,
      scope: "Working hours and days agreed before hiring"
    },
    {
      id: "hr-1",
      customerId: "u-cus1",
      driverId: "u-drv1",
      startDate: "2026-12-15",
      endDate: "2027-01-14",
      duties: "School drop-off and pick-up",
      offeredSalary: 24000,
      status: "pending",
      jobType: "FullTimeMonthly",
      rate: 24000,
      unit: "month",
      quantity: 1,
      scope: "Working hours and days agreed before hiring"
    },
    {
      id: "hr-2",
      customerId: "u-cus2",
      driverId: "u-drv2",
      startDate: "2027-02-01",
      endDate: "2027-02-28",
      duties: "Family car, weekends",
      offeredSalary: 22000,
      status: "accepted",
      jobType: "FullTimeMonthly",
      rate: 22000,
      unit: "month",
      quantity: 1,
      scope: "Working hours and days agreed before hiring"
    },
    {
      id: "hr-3",
      customerId: "u-cus2",
      driverId: "u-drv3",
      startDate: "2027-03-01",
      endDate: "2027-03-01",
      duties: "Airport run",
      offeredSalary: 2600,
      status: "declined",
      jobType: "IntercityHighway",
      rate: 2600,
      unit: "booking",
      quantity: 1,
      scope: "Up to 8 hours of driver service"
    },
    {
      id: "hr-4",
      customerId: "u-cus1",
      driverId: "u-drv10",
      startDate: "2026-12-20",
      endDate: "2026-12-21",
      duties: "Outstation trip to Sylhet",
      offeredSalary: 5000,
      status: "pending",
      jobType: "OutstationTour",
      rate: 2500,
      unit: "day",
      quantity: 2,
      scope: "Up to 8 service hours per day"
    }
  ],

  // Customer -> agency. status: open | partially_filled | filled | cancelled.
  bulkRequests: [
    {
      id: "br-0",
      customerId: "u-cus2",
      agencyId: "ag-1",
      headcount: 1,
      startDate: "2026-11-15",
      endDate: "2026-12-20",
      duties: "Factory staff shuttle",
      offeredSalary: 28000,
      status: "filled"
    },
    {
      id: "br-1",
      customerId: "u-cus1",
      agencyId: "ag-1",
      headcount: 2,
      startDate: "2026-12-10",
      endDate: "2026-12-31",
      duties: "Wedding season guest transport (2 cars)",
      offeredSalary: 25000,
      status: "open"
    }
  ],

  // Agency roster. status: invited | active | declined | removed.
  memberships: [
    { id: "m-1", agencyId: "ag-1", driverId: "u-drv2", status: "active" },
    { id: "m-2", agencyId: "ag-1", driverId: "u-drv3", status: "active" },
    { id: "m-3", agencyId: "ag-1", driverId: "u-drv7", status: "active" },
    { id: "m-4", agencyId: "ag-1", driverId: "u-drv1", status: "invited" }
  ],

  // Agency proposals for a bulk request. status: proposed | accepted | confirmed | declined.
  assignments: [
    { id: "as-0", bulkRequestId: "br-0", driverId: "u-drv3", status: "confirmed", driverAccepted: true, customerApproved: true }
  ],

  // Confirmed work. sourceType: direct | assignment | replacement. status: active | completed | replaced | cancelled.
  contracts: [
    {
      id: "con-1",
      customerId: "u-cus1",
      driverId: "u-drv1",
      sourceType: "direct",
      sourceId: "hr-0",
      startDate: "2026-11-10",
      endDate: "2026-12-10",
      salary: 24000,
      status: "active"
    },
    {
      id: "con-2",
      customerId: "u-cus2",
      driverId: "u-drv3",
      sourceType: "assignment",
      sourceId: "as-0",
      startDate: "2026-11-15",
      endDate: "2026-12-20",
      salary: 28000,
      status: "active"
    },
    {
      id: "con-3",
      customerId: "u-cus1",
      driverId: "u-drv2",
      sourceType: "direct",
      sourceId: "hr-x1",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      salary: 22000,
      status: "completed"
    },
    {
      id: "con-4",
      customerId: "u-cus2",
      driverId: "u-drv7",
      sourceType: "direct",
      sourceId: "hr-x2",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      salary: 24000,
      status: "completed"
    },
    {
      id: "con-5",
      customerId: "u-cus2",
      driverId: "u-drv1",
      sourceType: "direct",
      sourceId: "hr-x3",
      startDate: "2026-08-01",
      endDate: "2026-08-31",
      salary: 25000,
      status: "completed"
    },
    {
      id: "con-6",
      customerId: "u-cus1",
      driverId: "u-drv13",
      sourceType: "direct",
      sourceId: "hr-x4",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      salary: 29000,
      status: "completed"
    }
  ],

  // status: pending | approved | rejected | cancelled.
  replacements: [
    {
      id: "rep-1",
      originalContractId: "con-2",
      replacementDriverId: "u-drv7",
      reason: "Original driver requested leave for a family event.",
      driverAccepted: true,
      customerApproved: false,
      status: "pending",
      newContractId: null
    }
  ],

  // One review per completed contract. visibility: public | hidden (Admin).
  reviews: [
    {
      id: "rv-1",
      contractId: "con-3",
      customerId: "u-cus1",
      driverId: "u-drv2",
      rating: 5,
      comment: "Punctual and careful driver.",
      visibility: "public"
    },
    {
      id: "rv-2",
      contractId: "con-5",
      customerId: "u-cus2",
      driverId: "u-drv1",
      rating: 3,
      comment: "Good driving, sometimes late.",
      visibility: "public"
    },
    {
      id: "rv-3",
      contractId: "con-6",
      customerId: "u-cus1",
      driverId: "u-drv13",
      rating: 4,
      comment: "Punctual and polite. The driving experience was comfortable.",
      visibility: "public"
    }
  ],

  // status: open | in_review | resolved.
  complaints: [
    { id: "cp-1", contractId: "con-3", reporterId: "u-cus1", description: "Car returned with low fuel twice.", status: "open", resolution: "" },
    {
      id: "cp-2",
      contractId: "con-5",
      reporterId: "u-cus2",
      description: "Arrived 40 minutes late on one day.",
      status: "resolved",
      resolution: "Driver apologised; customer accepted."
    }
  ],

  activityLog: []
};


// Returns a fresh, separate copy of seedData (so a reset is always clean).
// JSON.stringify turns the object into text; JSON.parse builds a new object from it.
function getSeedData() {
  return JSON.parse(JSON.stringify(seedData));
}
