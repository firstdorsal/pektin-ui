import React, { Component } from "react";
/* @ts-ignore*/
//import { PowerdnsClient } from "@firstdorsal/powerdns-api";
import { Button, Container, TextField } from "@mui/material";
import { ArrowRight } from "@material-ui/icons";
//import { IoKeypadSharp } from "react-icons/io5";
interface PowerDnsProps {}
interface PowerDnsState {
    endpoint: string;
    apiKey: string;
}

export default class PowerDns extends Component<PowerDnsProps, PowerDnsState> {
    state: PowerDnsState = {
        endpoint: "",
        apiKey: ""
    };
    handleChange = (e: any) => {
        this.setState(state => ({ ...state, [e.target.name]: e.target.value }));
    };

    render = () => {
        return (
            <Container style={{ position: "relative" }}>
                <TextField
                    style={{ paddingRight: "20px" }}
                    helperText="The endpoint of your PowerDNS server"
                    placeholder="https://powerdns.example.com"
                    value={this.state.endpoint}
                    onChange={this.handleChange}
                    name="endpoint"
                    label="PowerDNS Enpoint"
                />
                <TextField helperText="Your PowerDNS api key" value={this.state.apiKey} onChange={this.handleChange} name="apiKey" label="PowerDNS Api Key" type="password" />

                <Button style={{ position: "absolute", bottom: "10px", right: "10px" }} variant="contained" color="primary" endIcon={<ArrowRight />}>
                    Next
                </Button>
            </Container>
        );
    };
}

/*
                <Button
                    endIcon={
                        <React.Fragment>
                            <ArrowRight />
                            <IoKeypadSharp />
                        </React.Fragment>
                    }
                >
                    Save to Vault
                </Button>


*/
