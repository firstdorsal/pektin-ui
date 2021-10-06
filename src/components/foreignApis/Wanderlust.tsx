import { Button, Box, MenuItem, TextField } from "@material-ui/core";

import { ArrowRight } from "@material-ui/icons";
import { Component } from "react";
import * as l from "../lib";
import * as t from "../types";

const f = fetch;

interface WanderlustProps {
    readonly import: any;
}
interface WanderlustState {
    readonly domainName: string;
    readonly providerName: string;
    readonly console: string;
    readonly limit: number;
}

export default class Wanderlust extends Component<WanderlustProps, WanderlustState> {
    state: WanderlustState = {
        domainName: "",
        providerName: "Google",
        console: "",
        limit: 500
    };
    walk = async (name: string, provider: string, limit: number = 100) => {
        const parseData = (n: string[]) => {
            n = n.splice(1);
            n = n.filter((e: string) => {
                if (!(e === "NSEC" || e === "RRSIG")) return true;
                return false;
            });
            return n;
        };
        const ogName = l.absoluteName(name);
        let currentName = ogName;
        const allRecordsRequests: Array<Promise<any>> = [];
        const allTypes: string[] = [];
        for (let i = 0; i < limit; i++) {
            const newNameRes = await providers[provider](currentName, "NSEC");
            const newNameData = newNameRes.value.split(" ");
            /*eslint no-loop-func: "off"*/

            if (newNameRes.typeId !== 47) break;
            parseData(newNameData).forEach(coveredRecord => {
                allTypes.push(coveredRecord);
                allRecordsRequests.push(providers[provider](currentName, coveredRecord));
            });
            this.setState({ console: currentName });
            currentName = newNameData[0];
            if (newNameData[0] === ogName && i > 0) break;
        }
        const allRecords: t.RawDnsRecord[] = await Promise.all(allRecordsRequests);
        return allRecords.map((record: any) => {
            if (record.type === "TYPE61") record.type = "OPENPGPKEY";
            return record;
        });
        //console.log(allRecords.map(l.simpleDnsRecordToRedisEntry));
    };
    handleChange = (e: any) => {
        this.setState(state => ({ ...state, [e.target.name]: e.target.value }));
    };
    import = async () => {
        const records = await this.walk(
            this.state.domainName,
            this.state.providerName,
            this.state.limit
        );
        /*TODO: remove quotes for caa value*/
        this.props.import(records.map(simpleDnsRecordToDisplayRecord).filter(l.isSupportedRecord));
    };

    render = () => {
        return (
            <Box style={{ position: "relative" }}>
                <TextField
                    InputLabelProps={{
                        shrink: true
                    }}
                    style={{ paddingRight: "20px" }}
                    helperText="The domain you want to import"
                    placeholder="example.com."
                    value={this.state.domainName}
                    onChange={this.handleChange}
                    name="domainName"
                    label="Domain Name"
                    variant="standard"
                />
                <TextField
                    label="DNS Provider"
                    helperText="Where to send the queries to"
                    select
                    style={{ width: "190px", paddingRight: "20px" }}
                    onChange={e => this.setState({ providerName: e.target.value })}
                    value={this.state.providerName}
                    variant="standard"
                >
                    {Object.keys(providers).map((e, i) => {
                        return (
                            <MenuItem key={e} value={e}>
                                {e}
                            </MenuItem>
                        );
                    })}
                </TextField>
                <TextField
                    InputLabelProps={{
                        shrink: true
                    }}
                    helperText="Maximum of steps to take"
                    placeholder="100"
                    value={this.state.limit}
                    onChange={this.handleChange}
                    name="limit"
                    label="Limit"
                    variant="standard"
                />
                <Button
                    disabled={this.state.domainName.length ? false : true}
                    onClick={this.import}
                    style={{ position: "absolute", bottom: "10px", right: "10px" }}
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowRight />}
                >
                    Import
                </Button>
                <div>{this.state.console}</div>
            </Box>
        );
    };
}

type getDnsRecord = (name: string, type: string) => Promise<any>;

const providers: { [provider: string]: getDnsRecord } = {
    Google: async (name: string, type: string): Promise<any> => {
        const res = await f(`https://dns.google/resolve?name=${name}&type=${type}`);
        const json = await res.json();
        const answer = json.Answer ? json.Answer[0] : json.Authority[0];
        answer.ttl = answer.TTL;
        delete answer.TTL;
        answer.typeId = answer.type;
        answer.type = type;
        answer.value = answer.data;
        delete answer.data;

        return answer;
    },
    Cloudflare: async (name: string, type: string): Promise<any> => {
        const res = await f(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, {
            headers: { accept: "application/dns-json" }
        });
        const json = await res.json();
        const answer = json.Answer ? json.Answer[0] : json.Authority[0];
        answer.ttl = answer.TTL;
        delete answer.TTL;
        answer.typeId = answer.type;
        answer.type = type;
        return answer;
    }
};

const simpleDnsRecordToDisplayRecord = (simple: t.RawDnsRecord): t.DisplayRecord => {
    return {
        ...simple,
        value: textToRRValue(simple.type, simple.value)
    };
};
const textToRRValue = (recordType: t.RRTypes, text: string): t.ResourceRecordValue => {
    const t = text.split(" ");
    switch (recordType) {
        case "SOA":
            return {
                SOA: {
                    mname: t[0],
                    rname: t[1],
                    serial: parseInt(t[2]),
                    refresh: parseInt(t[3]),
                    retry: parseInt(t[4]),
                    expire: parseInt(t[5]),
                    minimum: parseInt(t[6])
                }
            };
        case "MX":
            return {
                MX: {
                    preference: parseInt(t[0]),
                    exchange: t[1]
                }
            };
        case "SRV":
            return {
                SRV: {
                    priority: parseInt(t[0]),
                    weight: parseInt(t[1]),
                    port: parseInt(t[2]),
                    target: t[3]
                }
            };

        case "CAA":
            return {
                CAA: {
                    flag: parseInt(t[0]),
                    tag: t[1] as "issue" | "issuewild" | "iodef",
                    value: t[2].replaceAll('"', "")
                }
            };

        case "TLSA":
            return {
                TLSA: {
                    usage: parseInt(t[0]),
                    selector: parseInt(t[1]),
                    matching_type: parseInt(t[2]),
                    data: t[3]
                }
            };

        default:
            return { [recordType]: text };
    }
};
