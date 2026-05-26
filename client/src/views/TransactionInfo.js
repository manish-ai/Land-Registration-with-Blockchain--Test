import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Line, Bar } from "react-chartjs-2";
import '../index.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Spinner } from 'react-bootstrap'
import {
    LoadingContainer,
    AccountData,
    ContractData,
    ContractForm
} from '../drizzle-shims/drizzle-react-components'

// reactstrap components
import {
    Button,
    ButtonGroup,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    DropdownToggle,
    DropdownMenu,
    DropdownItem,
    UncontrolledDropdown,
    Label,
    FormGroup,
    Input,
    Table,
    Row,
    Col,
    UncontrolledTooltip,
} from "reactstrap";


const drizzleOptions = {
    contracts: [Land]
}


class TransactionInfo extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            verified: '',
            landTable: [],
        }
    }

    landTransfer = (landId, newOwner) => async () => {
        
        await this.state.LandInstance.methods.LandOwnershipTransfer(
            landId, newOwner
        ).send({
            from : this.state.account,
            gas : 2100000
        });
        window.location.reload(false);

    }


    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const currentAddress = getWalletAddress();
            //console.log(currentAddress);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
            
            var verified = await instance.methods.isLandInspector(currentAddress).call();
            //console.log(verified);
            this.setState({ verified: verified });
            
            var count = await instance.methods.getLandsCount().call();
            count = parseInt(count);
            var rowsArea = [];
            var rowsCity = [];
            var rowsState = [];
            var rowsPrice = [];
            var rowsPID = [];
            var rowsSurvey = [];


            for (var i = 1; i < count + 1; i++) {
                rowsArea.push(<ContractData contract="Land" method="getArea" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
                rowsCity.push(<ContractData contract="Land" method="getCity" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
                rowsState.push(<ContractData contract="Land" method="getState" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
                rowsPrice.push(<ContractData contract="Land" method="getPrice" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
                rowsPID.push(<ContractData contract="Land" method="getPID" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
                rowsSurvey.push(<ContractData contract="Land" method="getSurveyNumber" methodArgs={[i, { from: "0xa42A8B478E5e010609725C2d5A8fe6c0C4A939cB" }]} />);
              }
            var requestsCount = await instance.methods.getRequestsCount().call();
            requestsCount = parseInt(requestsCount);

            // Build a map from landId → request info (Bug 5 fix: requests are separate from lands)
            const requestByLandId = {};
            for (var r = 1; r <= requestsCount; r++) {
                var req = await instance.methods.getRequestDetails(r).call();
                var reqPaid = await instance.methods.isPaid(r).call();
                // req[2] is landId
                requestByLandId[req[2]] = { req, reqId: r, isPaid: reqPaid };
            }

            const landTable = [];
            for (var i = 1; i <= count; i++) {
                var reqInfo = requestByLandId[String(i)] || null;
                var request = reqInfo ? reqInfo.req : [null, null, null, false];
                var isPaid = reqInfo ? reqInfo.isPaid : false;
                var disabled = request[3] && isPaid;

                var owner = await instance.methods.getLandOwner(i).call();
                landTable.push(<tr key={i}><td>{i}</td><td>{owner}</td><td>{rowsArea[i-1]}</td><td>{rowsCity[i-1]}</td><td>{rowsState[i-1]}</td><td>{rowsPrice[i-1]}</td><td>{rowsPID[i-1]}</td><td>{rowsSurvey[i-1]}</td>
                <td>
                     <Button onClick={this.landTransfer(i, request[1])} disabled={!disabled} className="button-vote">
                          Verify Transaction
                    </Button>
                </td>
                </tr>)
            }
            this.setState({ landTable });

        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };



    render() {
        if (!this.state.web3) {
            return (
                <div>
                    <div>
                        <h1>
                            <Spinner animation="border" variant="primary" />
                        </h1>
                    </div>

                </div>
            );
        }

        if (!this.state.verified) {
            return (
                <div className="content">
                    <div>
                        <Row>
                            <Col xs="6">
                                <Card className="card-chart">
                                    <CardBody>
                                        <h1>
                                            You are not verified to view this page
                                        </h1>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </div>

                </div>
            );
        }

        return (
            <DrizzleProvider options={drizzleOptions}>
                <LoadingContainer>
                    <div className="content">
                        <Row>
                            <Col xs="12">
                                <Card>
                                    <CardHeader>
                                        <CardTitle tag="h6">Lands Info</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Table className="tablesorter" responsive color="black">
                                            <thead className="text-primary">
                                                <tr>
                                                <th>#</th>
                                                <th>Owner ID</th>
                                                <th>Area</th>
                                                <th>City</th>
                                                <th>State</th>
                                                <th>Price</th>
                                                <th>Property PID</th>
                                                <th>Survey Number</th>
                                                <th>Verify Land Transfer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.landTable.length > 0 ? this.state.landTable : (
                                                    <tr><td colSpan="9" style={{textAlign: "center", color: "#888"}}>No land transactions found.</td></tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>

                    </div>
                </LoadingContainer>
            </DrizzleProvider>
        );

    }
}

export default TransactionInfo;
