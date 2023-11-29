import * as rrule from "rrule";
import { RRule } from "../src/rrule";

const createRRule = ({
  dtstart,
  until,
  exdates,
  tzid,
}: {
  dtstart: Date;
  until: Date;
  exdates: Date[];
  tzid?: string;
}) => {
  const rule = new rrule.RRule({
    freq: rrule.RRule.DAILY,
    dtstart,
    tzid: tzid ?? null,
    until,
    byweekday: [
      rrule.RRule.MO,
      rrule.RRule.TU,
      rrule.RRule.WE,
      rrule.RRule.TH,
      rrule.RRule.FR,
      rrule.RRule.SA,
      rrule.RRule.SU,
    ],
  });

  const ruleset = new rrule.RRuleSet();
  ruleset.rrule(rule);

  exdates.forEach((d) => {
    ruleset.exdate(d);
  });

  return ruleset.toString();
};

const main = () => {
  const rrulesetWithTimezone = createRRule({
    dtstart: new Date(Date.UTC(2023, 11, 1, 6, 0, 0)),
    until: new Date(Date.UTC(2023, 11, 7, 6, 0, 0)),
    exdates: [new Date(Date.UTC(2023, 11, 2, 6, 0, 0)), new Date(Date.UTC(2023, 11, 3, 6, 0, 0))],
    tzid: "America/Chicago",
  });

  const r = RRule.parse(rrulesetWithTimezone.toString());
  console.log(r.toJSON());
};

main();
