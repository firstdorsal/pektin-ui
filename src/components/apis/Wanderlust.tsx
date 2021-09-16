import { Button, Container, FormHelperText, InputLabel, MenuItem, Select, TextField } from "@material-ui/core";
import { ArrowRight } from "@material-ui/icons";
import { Component } from "react";
import * as l from "../lib";
import * as t from "../types";

const f = fetch;

interface WanderlustProps {}
interface WanderlustState {
    domainName: string;
    providerName: string;
}

export default class Wanderlust extends Component<WanderlustProps, WanderlustState> {
    state: WanderlustState = {
        domainName: "",
        providerName: "Google"
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
            const newNameData = (await providers[provider].fn(currentName, "NSEC")).data.split(" ");
            /*eslint no-loop-func: "off"*/
            parseData(newNameData).forEach(coveredRecord => {
                allTypes.push(coveredRecord);
                allRecordsRequests.push(providers[provider].fn(currentName, coveredRecord));
            });
            currentName = newNameData[0];
            if (newNameData[0] === ogName && i > 0) break;
        }
        const allRecords: t.SimpleDnsRecord[] = await Promise.all(allRecordsRequests);
        console.log(allRecords.map(l.simpleDnsRecordToRedisEntry));
    };
    handleChange = (e: any) => {
        this.setState(state => ({ ...state, [e.target.name]: e.target.value }));
    };

    render() {
        //this.walk("vonforell.de", "google");
        return (
            <Container style={{ position: "relative" }}>
                <TextField
                    InputLabelProps={{
                        shrink: true
                    }}
                    style={{ paddingRight: "20px" }}
                    helperText="The domain you want to import"
                    placeholder="example.com"
                    value={this.state.domainName}
                    onChange={this.handleChange}
                    name="domainName"
                    label="Domain Name"
                />
                <TextField label="DNS Provider" helperText="Where to send the queries to" select style={{ width: "170px" }} value={this.state.providerName}>
                    {Object.values(providers).map((e, i) => {
                        return (
                            <MenuItem key={e.name} value={e.name}>
                                {e.name}
                            </MenuItem>
                        );
                    })}
                </TextField>
                <Button style={{ position: "absolute", bottom: "10px", right: "10px" }} variant="contained" color="primary" endIcon={<ArrowRight />}>
                    Next
                </Button>
            </Container>
        );
    }
}

type getDnsRecord = (name: string, type: string) => Promise<any>;

const providers: { [provider: string]: { name: string; fn: getDnsRecord } } = {
    google: {
        name: "Google",
        fn: async (name: string, type: string): Promise<any> => {
            const res = await f(`https://dns.google/resolve?name=${name}&type=${type}`);
            const json = await res.json();
            const answer = json.Answer[0];
            answer.ttl = answer.TTL;
            delete answer.TTL;
            answer.type = type;
            return answer;
        }
    }
};
