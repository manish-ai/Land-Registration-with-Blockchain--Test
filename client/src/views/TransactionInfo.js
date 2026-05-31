import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import '../index.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Table,
    Row,
    Col,
} from "reactstrap";


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
            from: this.state.account,
            gas: 2100000
        });
        window.location.reload(false);
    }

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const currentAddress = getWalletAddress();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

            var verified = await instance.methods.isLandInspector(currentAddress).call();
            this.setState({ verified: verified });

            var count = parseInt(await instance.methods.getLandsCount().call());

            // Build request map keyed by landId
            var requestsCount = parseInt(await instance.methods.getRequestsCount().call());
            const requestByLandId = {};
            for (var r = 1; r <= requestsCount; r++) {
                var req = await instance.methods.getRequestDetails(r).call();
                var reqPaid = await instance.methods.isPaid(r).call();
                requestByLandId[req[2]] = { req, reqId: r, isPaid: reqPaid };
            }

            const landTable = [];
            for (var i = 1; i <= count; i++) {
                const area = await instance.methods.getArea(i).call();
                const city = await instance.methods.getCity(i).call();
                const state = await instance.methods.getState(i).call();
                const price = await instance.methods.getPrice(i).call();
                const pid = await instance.methods.getPID(i).call();
                const survey = await instance.methods.getSurveyNumber(i).call();
                const owner = await instance.methods.getLandOwner(i).call();

                var reqInfo = requestByLandId[String(i)] || null;
                var request = reqInfo ? reqInfo.req : [null, null, null, false];
                var isPaid = reqInfo ? reqInfo.isPaid : false;
                var alreadyTransferred = reqInfo && request[1] && owner.toLowerCase() === request[1].toLowerCase();
                var canTransfer = request[3] && isPaid && !alreadyTransferred;

                const ownerShort = `${owner.slice(0, 8)}...${owner.slice(-6)}`;

                landTable.push(<tr key={i}>
                    <td>{i}</td>
                    <td><span title={owner} style={{ fontFamily: 'monospace', fontSize: 12 }}>{ownerShort}</span></td>
                    <td>{area} sq m</td>
                    <td>{city}</td>
                    <td>{state}</td>
                    <td>₹{parseInt(price).toLocaleString('en-IN')}</td>
                    <td>{pid}</td>
                    <td>{survey}</td>
                    <td>
                        {alreadyTransferred ? (
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Transferred</span>
                        ) : canTransfer ? (
                            <Button onClick={this.landTransfer(i, request[1])} size="sm" color="success">
                                Transfer Ownership
                            </Button>
                        ) : (
                            <span style={{ color: '#888', fontSize: 12 }}>
                                {reqInfo ? (request[3] ? 'Awaiting Payment' : 'Request Pending') : 'No Request'}
                            </span>
                        )}
                    </td>
                </tr>);
            }
            this.setState({ landTable });

        } catch (error) {
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
            <div className="content">
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h4">Land Transactions</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table className="tablesorter" responsive color="black">
                                    <thead className="text-primary">
                                        <tr>
                                            <th>#</th>
                                            <th>Owner</th>
                                            <th>Area</th>
                                            <th>City</th>
                                            <th>State</th>
                                            <th>Price</th>
                                            <th>Property PID</th>
                                            <th>Survey Number</th>
                                            <th>Action</th>
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
        );
    }
}

export default TransactionInfo;
