import { DateTime, Interval } from "luxon";

const TZID_TOKEN = "TZID=";

const getTimezoneFromDtStart = (input: string) => {
  const idx = input.indexOf(TZID_TOKEN);
  if (idx) {
    return input.substring(idx + TZID_TOKEN.length, input.indexOf(":"));
  }

  return "UTC";
};

type TR = {
  freq: string;
  until: string | null;
  byDay: string[];
};

export type TRRule = {
  dtstart: string;
  rrule: TR;
  exdates: string[];
};

const parse = (input: string): TRRule => {
  const parts = input.split("\n");
  const tzid = getTimezoneFromDtStart(parts[0]);

  return {
    dtstart: parseDtStart(parts[0]),
    rrule: parseRRule(parts[1], tzid),
    exdates: parseExdates(parts[2]),
  };
};

const DAYS: Record<number, string> = {
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
  7: "SU",
};

const getDatesBetween = (input: TRRule, startstr: string, endstr: string) => {
  const exdates = new Set(input.exdates);
  const byDay = new Set(input.rrule.byDay ?? []);

  const start = DateTime.fromISO(startstr);
  const until = input.rrule.until ? DateTime.fromISO(input.rrule.until) : null;

  let end = DateTime.fromISO(endstr);
  if (until && end.diff(until).as("milliseconds") >= 0) {
    end = until;
  }

  const i = Interval.fromDateTimes(start, end);

  let date = start;
  let results = [];
  while (true) {
    if (i.isBefore(date)) {
      break;
    }

    const utcd = date.toUTC().toISO();

    if (utcd && !exdates.has(utcd) && byDay.has(DAYS[date.weekday])) {
      results.push(utcd);
    }

    date = date.plus({ days: 1 });
  }

  return results;
};

const parseExdates = (input: string) => {
  if (input.includes(TZID_TOKEN)) {
    const [, exdates] = input.split(";");
    const [tz, dates] = exdates.split(":");
    const zone = tz.replace(TZID_TOKEN, "");

    return dates.split(",").map((date) => {
      const d = DateTime.fromISO(date, { zone }).toUTC().toISO();
      if (!d) {
        throw new Error("unable to parse exdate");
      }
      return d;
    });
  }

  const parts = input.split(":");

  return parts[1].split(",").map((date) => {
    const d = DateTime.fromISO(date, { zone: "utc" }).toISO();
    if (!d) {
      throw new Error("unable to parse exdate");
    }
    return d;
  });
};

const parseRRule = (input: string, tzid: string) => {
  const parts = input.replace("RRULE:", "").split(";");
  const rule: TR = {
    freq: "",
    until: "",
    byDay: [],
  };

  for (const part of parts) {
    const [key, val] = part.split("=");

    switch (key) {
      case "FREQ":
        rule.freq = val;
        break;
      case "UNTIL":
        const d = DateTime.fromISO(val, {
          zone: tzid,
        })
          .toUTC()
          .toISO();

        if (!d) {
          throw new Error("unable to parse UNTIL");
        }
        rule.until = d;
        break;
      case "BYDAY":
        rule.byDay = val.split(",");
        break;
      default:
        // console.debug("unknown key", key);
        break;
    }
  }

  return rule;
};

const parseDtStart = (input: string) => {
  if (input.includes(TZID_TOKEN)) {
    const [, startDate] = input.split(";");
    const [tzid, date] = startDate.split(":");
    const dtstart = DateTime.fromISO(date, {
      zone: tzid.replace(TZID_TOKEN, ""),
    });

    const dt = dtstart.toUTC().toISO();
    if (!dt) {
      throw new Error("unable to parse dtstart");
    }
    return dt;
  }

  const parts = input.split(":");
  const dtstart = DateTime.fromISO(parts[1], { zone: "utc" });

  const dt = dtstart.toISO();

  if (!dt) {
    throw new Error("unable to parse dtstart");
  }
  return dt;
};

export class RRule {
  public static parse(input: string) {
    return new RRule(parse(input));
  }

  constructor(private rrule: TRRule) {}

  public toJSON() {
    return this.rrule;
  }

  public all() {
    let end = this.rrule.rrule.until;
    if (!end) {
      end = DateTime.fromISO(this.rrule.dtstart).plus({ years: 1 }).toISO()!;
    }

    return getDatesBetween(this.rrule, this.rrule.dtstart, end);
  }

  public between(start: string, end: string) {
    return getDatesBetween(this.rrule, start, end);
  }
}
