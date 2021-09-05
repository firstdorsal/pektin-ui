import { Component } from "react";
import "@fontsource/inter";
import { createTheme, ThemeProvider } from "@material-ui/core/styles";
import Base from "./components/Base";
import { BrowserRouter as Router, Route } from "react-router-dom";
import AddDomain from "./components/AddDomain";
import Domain from "./components/Domain";
import * as t from "./components/types";
import * as l from "./components/lib";

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
    readonly config: t.Config;
    readonly db: l.PektinUiDb;
}
interface AppProps {}

export default class App extends Component<AppProps, AppState> {
    state: AppState = {
        config: l.defaulConfig,
        db: new l.PektinUiDb()
    };

    initDb = async () => {
        const db = this.state.db;
        await db.config.add({ key: "config", value: l.defaulConfig }).catch(() => {});
    };

    loadConfig = async () => {
        const db = this.state.db;
        const config = (await db.config.get("config"))?.value;
        if (config) this.setState({ config });
    };

    componentDidMount = async () => {
        await this.initDb();
        await this.loadConfig();
    };

    render = () => {
        console.log(this.state.config);

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
