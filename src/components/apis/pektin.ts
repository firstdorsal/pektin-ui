// @ts-nocheck
import * as t from "../types";
import * as l from "../lib";

import { cloneDeep } from "lodash";
import { PektinRRTypes, RedisEntry } from "@pektin/client/src/types";

export const toDisplayRecord = (config: t.Config, record: RedisEntry): t.DisplayRecord => {
  const [name, type]: [string, PektinRRTypes] = record.name.split(":");
  const { rr_set } = record;
  const display_values = rr_set.map((rr, i) => {
    if (type === "TXT") {
      return { value: l.valuesToVariables(config, rr.value.TXT), ttl: rr.ttl };
    } else if (type === "OPENPGPKEY") {
      return { value: l.valuesToVariables(config, rr.value.OPENPGPKEY), ttl: rr.ttl };
    } else if (type === "TLSA") {
      return {
        data: l.valuesToVariables(config, rr.value.TLSA.cert_data),
        usage: rr.value.TLSA.cert_usage,
        selector: rr.value.TLSA.selector,
        matching_type: rr.value.TLSA.matching,
        ttl: rr.ttl,
      };
    } else if (type === "A" || type === "AAAA" || type === "NS" || type === "CNAME") {
      return {
        value: l.valuesToVariables(config, rr.value[type]),
        ttl: rr.ttl,
      };
    } else if (type === "CAA") {
      const displayValue = { tag: l.valuesToVariables(config, rr.value[type].tag), ttl: rr.ttl };

      if (rr.value[type].tag === "issue" || rr.value[type].tag === "issuewild") {
        displayValue.caaValue = l.valuesToVariables(config, rr.value[type].value);
      } else if (displayValue.tag === "iodef") {
        displayValue.caaValue = l.valuesToVariables(config, rr.value[type].value);
      }
      displayValue.tag = displayValue.tag.toLowerCase();
      return displayValue;
    } else if (type === "SOA") {
      rr.value[type].mname = l.valuesToVariables(config, rr.value[type].mname);
      rr.value[type].rname = l.valuesToVariables(config, rr.value[type].rname);
      return { ttl: rr.ttl, ...rr.value[type] };
    } else if (type === "MX") {
      rr.value[type].exchange = l.valuesToVariables(config, rr.value[type].exchange);
      return {
        ttl: rr.ttl,
        ...rr.value[type],
      };
    } else if (type === "SRV") {
      rr.value[type].target = l.valuesToVariables(config, rr.value[type].target);
      return { ttl: rr.ttl, ...rr.value[type] };
    } else {
      console.log("MISSING TYPE", type);
      return false;
    }
  });

  return {
    name: l.valuesToVariables(config, name),
    type,
    values: display_values,
  };
};

export const toPektinApiRecord = (config: t.Config, record: t.DisplayRecord): RedisEntry => {
  record = cloneDeep(record);
  const rr_set: PektinRRset = record.values.map((rr, i) => {
    if (record.type === "A" || record.type === "AAAA") {
      return {
        ttl: rr.ttl,
        value: { [record.type]: l.variablesToValues(config, rr.value.replace(/\s+/g, "")) },
      };
    } else if (record.type === "NS" || record.type === "CNAME") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: l.absoluteName(
            l.variablesToValues(config, rr.value.replaceAll(/\s+/g, ""))
          ),
        },
      };
    } else if (record.type === "TXT") {
      return {
        ttl: rr.ttl,
        value: { [record.type]: rr.value },
      };
    } else if (record.type === "CAA") {
      if (rr.tag.toLowerCase() === "issue" || rr.tag.toLowerCase() === "issuewild") {
        return {
          ttl: rr.ttl,
          value: {
            [record.type]: {
              issuer_critical: true,
              tag: l.variablesToValues(config, rr.tag).toLowerCase(),
              value: l.variablesToValues(config, rr.caaValue.replaceAll(/\s+/g, "")),
            },
          },
        };
      } else if (rr.tag.toLowerCase() === "iodef") {
        return {
          ttl: rr.ttl,
          value: {
            [record.type]: {
              issuer_critical: true,
              tag: "iodef",
              value: l.variablesToValues(config, rr.caaValue.replaceAll(/\s+/g, "")),
            },
          },
        };
      } else {
        return false;
      }
    } else if (record.type === "OPENPGPKEY") {
      return { ttl: rr.ttl, value: { [record.type]: rr.value } };
    } else if (record.type === "TLSA") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            cert_usage: rr.usage,
            selector: rr.selector,
            matching: rr.matching_type,
            cert_data: rr.data,
          },
        },
      };
    } else if (record.type === "SOA") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            mname: l.absoluteName(l.variablesToValues(config, rr.mname.replaceAll(/\s+/g, ""))),
            rname: l.absoluteName(l.variablesToValues(config, rr.rname.replaceAll(/\s+/g, ""))),
            refresh: rr.refresh === undefined ? 0 : rr.refresh,
            retry: rr.retry === undefined ? 0 : rr.retry,
            serial: rr.serial === undefined ? 0 : rr.serial,
            expire: rr.expire === undefined ? 0 : rr.expire,
            minimum: rr.minimum === undefined ? 0 : rr.minimum,
          },
        },
      };
    } else if (record.type === "MX") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            exchange: l.absoluteName(
              l.variablesToValues(config, rr.exchange.replaceAll(/\s+/g, ""))
            ),
            preference: rr.preference === undefined ? 0 : rr.preference,
          },
        },
      };
    } else if (record.type === "SRV") {
      return {
        ttl: rr.ttl,
        value: {
          [record.type]: {
            priority: rr.priority === undefined ? 0 : rr.priority,
            weight: rr.weight === undefined ? 0 : rr.weight,
            port: rr.port === undefined ? 0 : rr.port,
            target:
              rr.target === undefined
                ? ""
                : l.absoluteName(l.variablesToValues(config, rr.target.replaceAll(/\s+/g, ""))),
          },
        },
      };
    } else {
      console.log("MISSING TYPE", record.type);
      return false;
    }
  });

  return {
    name: `${l
      .absoluteName(l.variablesToValues(config, record.name.replaceAll(/\s+/g, "")))
      .toLowerCase()}:${record.type}`,
    rr_set,
  };
};
