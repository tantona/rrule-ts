import { RRule } from "./rrule";

const DAYLIGHT_SAVINGS_DATE1 = "20231201T000000";
const DAYLIGHT_SAVINGS_DATE2 = "20240220T000000";
const STANDARD_DATE1 = "20230601T000000";
const STANDARD_DATE2 = "20230801T000000";

const UTC_DATE1 = "20230601T000000Z";
const UTC_DATE2 = "20230801T000000Z";

describe("RRule", () => {
  describe("parse", () => {
    describe("DST", () => {
      it(" 1", () => {
        const input = `DTSTART;TZID=America/Los_Angeles:${DAYLIGHT_SAVINGS_DATE1}\nRRULE:FREQ=WEEKLY;INTERVAL=1;WKST=MO;UNTIL=${DAYLIGHT_SAVINGS_DATE2};BYDAY=MO,TU,WE,TH,FR,SA,SU\nEXDATE;TZID=America/Los_Angeles:20231202T000000,20231203T000000`;
        const got = RRule.parse(input);

        expect(got.toJSON()).toEqual({
          dtstart: "2023-12-01T08:00:00.000Z",
          exdates: ["2023-12-02T08:00:00.000Z", "2023-12-03T08:00:00.000Z"],
          rrule: {
            byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
            freq: "WEEKLY",
            until: "2024-02-20T08:00:00.000Z",
          },
        });
      });

      it(" 2", () => {
        const input = `DTSTART;TZID=America/Chicago:${DAYLIGHT_SAVINGS_DATE1}\nRRULE:FREQ=WEEKLY;INTERVAL=1;WKST=MO;UNTIL=${DAYLIGHT_SAVINGS_DATE2};BYDAY=MO,TU,WE,TH,FR,SA,SU\nEXDATE;TZID=America/Chicago:20231202T000000,20231203T000000`;
        const got = RRule.parse(input);

        expect(got.toJSON()).toEqual({
          dtstart: "2023-12-01T06:00:00.000Z",
          exdates: ["2023-12-02T06:00:00.000Z", "2023-12-03T06:00:00.000Z"],
          rrule: {
            byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
            freq: "WEEKLY",
            until: "2024-02-20T06:00:00.000Z",
          },
        });
      });
    });

    describe("Standard Time", () => {
      it(" 1", () => {
        const input = `DTSTART;TZID=America/Los_Angeles:${STANDARD_DATE1}\nRRULE:FREQ=WEEKLY;INTERVAL=1;WKST=MO;UNTIL=${STANDARD_DATE2};BYDAY=MO,TU,WE,TH,FR,SA,SU\nEXDATE;TZID=America/Los_Angeles:20230602T000000,20230603T000000`;
        const got = RRule.parse(input);

        expect(got.toJSON()).toEqual({
          dtstart: "2023-06-01T07:00:00.000Z",
          exdates: ["2023-06-02T07:00:00.000Z", "2023-06-03T07:00:00.000Z"],
          rrule: {
            byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
            freq: "WEEKLY",
            until: "2023-08-01T07:00:00.000Z",
          },
        });
      });

      it(" 2", () => {
        const input = `DTSTART;TZID=America/Chicago:${STANDARD_DATE1}\nRRULE:FREQ=WEEKLY;INTERVAL=1;WKST=MO;UNTIL=${STANDARD_DATE2};BYDAY=MO,TU,WE,TH,FR,SA,SU\nEXDATE;TZID=America/Chicago:20230602T000000,20230603T000000`;
        const got = RRule.parse(input);

        expect(got.toJSON()).toEqual({
          dtstart: "2023-06-01T05:00:00.000Z",
          exdates: ["2023-06-02T05:00:00.000Z", "2023-06-03T05:00:00.000Z"],
          rrule: {
            byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
            freq: "WEEKLY",
            until: "2023-08-01T05:00:00.000Z",
          },
        });
      });
    });

    describe("Cross DST boundary", () => {
      it(" 1", () => {
        const input = `DTSTART;TZID=America/Los_Angeles:${DAYLIGHT_SAVINGS_DATE1}\nRRULE:FREQ=WEEKLY;INTERVAL=1;WKST=MO;UNTIL=${STANDARD_DATE2};BYDAY=MO,TU,WE,TH,FR,SA,SU\nEXDATE;TZID=America/Los_Angeles:${DAYLIGHT_SAVINGS_DATE2},20230603T000000`;
        const got = RRule.parse(input);

        expect(got.toJSON()).toEqual({
          dtstart: "2023-12-01T08:00:00.000Z",
          exdates: ["2024-02-20T08:00:00.000Z", "2023-06-03T07:00:00.000Z"],
          rrule: {
            byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
            freq: "WEEKLY",
            until: "2023-08-01T07:00:00.000Z",
          },
        });
      });
    });

    describe("UTC", () => {
      it("1", () => {
        const input = `DTSTART:${UTC_DATE1}\nRRULE:FREQ=DAILY;UNTIL=${UTC_DATE2};BYDAY=MO,TU,WE,TH,FR,SA,SU\nEXDATE:20230602T000000Z,20230603T000000Z`;
        const got = RRule.parse(input);

        expect(got.toJSON()).toEqual({
          dtstart: "2023-06-01T00:00:00.000Z",
          exdates: ["2023-06-02T00:00:00.000Z", "2023-06-03T00:00:00.000Z"],
          rrule: {
            byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
            freq: "DAILY",
            until: "2023-08-01T00:00:00.000Z",
          },
        });
      });
    });
  });

  it("respects day recurrences", () => {
    const rule = new RRule({
      dtstart: "2023-06-01T07:00:00.000Z",
      exdates: [],
      rrule: {
        byDay: ["MO"],
        freq: "WEEKLY",
        until: "2023-07-01T07:00:00.000Z",
      },
    });

    const dates = rule.all();
    expect(dates).toHaveLength(4);
  });

  it("returns all dates (no end date)", () => {
    const rule = new RRule({
      dtstart: "2023-06-01T07:00:00.000Z",
      exdates: [],
      rrule: {
        byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
        freq: "WEEKLY",
        until: null,
      },
    });

    const dates = rule.all();
    expect(dates).toHaveLength(366);
  });

  it("returns all dates", () => {
    const rule = new RRule({
      dtstart: "2023-06-01T07:00:00.000Z",
      exdates: [],
      rrule: {
        byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
        freq: "WEEKLY",
        until: "2023-08-01T07:00:00.000Z",
      },
    });

    const dates = rule.all();
    expect(dates).toHaveLength(61);
  });

  it("returns recurring dates between start and end dates ", () => {
    const rule = new RRule({
      dtstart: "2023-06-01T07:00:00.000Z",
      exdates: ["2023-06-02T07:00:00.000Z", "2023-06-03T07:00:00.000Z"],
      rrule: {
        byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
        freq: "WEEKLY",
        until: "2023-08-01T07:00:00.000Z",
      },
    });

    const dates = rule.between("2023-06-02T07:00:00.000Z", "2023-07-01T07:00:00.000Z");
    expect(dates).toHaveLength(27);
  });

  it("returns recurring dates between dtstart and until dates if requested end date is past the until date ", () => {
    const rule = new RRule({
      dtstart: "2023-06-01T07:00:00.000Z",
      exdates: [],
      rrule: {
        byDay: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
        freq: "WEEKLY",
        until: "2023-08-01T07:00:00.000Z",
      },
    });

    const dates = rule.between("2023-06-02T07:00:00.000Z", "2025-07-01T07:00:00.000Z");

    expect(dates).toHaveLength(60);
  });
});
