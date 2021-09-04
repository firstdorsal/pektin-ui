import { Component } from "react";
import "@fontsource/inter";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Base from "./components/Base";
import { BrowserRouter as Router, Route } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
const theme = createTheme({
    palette: {
        primary: {
            light: "#dc143c",
            main: "#dc143c",
            dark: "#a20016",
            contrastText: "#fff"
        },
        secondary: {
            light: "#78ffea",
            main: "#37dbb8",
            dark: "#00a888",
            contrastText: "#000"
        }
    }
});

interface AppState {
    config: t.Config;
}
interface AppProps {}

export default class App extends Component<AppProps, AppState> {
    state = {
        config: {
            apiEndpoint: "http://127.0.0.1"
        }
    };
    render = () => {
        return (
            <Router>
                <ThemeProvider theme={theme}>
                    <Base config={this.state.config}>
                        <Route path="/add-domain">
                            <AddDomain />
                        </Route>
                        <Route
                            exact
                            path={`/domain/:domainName`}
                            render={routeProps => {
                                return <Domain config={this.state.config} {...routeProps} />;
                            }}
                        />
                    </Base>
                </ThemeProvider>
            </Router>
        );
    };
}
