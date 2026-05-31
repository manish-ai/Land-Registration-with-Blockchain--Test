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


class ApproveRequest extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            verified: '',
            requestTable: [],
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

            var requestsCount = parseInt(await instance.methods.getRequestsCount().call());

            const requestTable = [];
            for (let i = 1; i <= requestsCount; i++) {
                var request = await instance.methods.getRequestDetails(i).call();
                var isPaid = await instance.methods.isPaid(i).call();

                // Resolve names
                let sellerName = request[0];
                let buyerName = request[1];
                try {
                    const sellerDetails = await instance.methods.getSellerDetails(request[0]).call();
                    sellerName = sellerDetails[0] || request[0];
                } catch (e) { /* use address */ }
                try {
                    const buyerDetails = await instance.methods.getBuyerDetails(request[1]).call();
                    buyerName = buyerDetails[0] || request[1];
                } catch (e) { /* use address */ }

                // Get land info
                let landInfo = `Land #${request[2]}`;
                try {
                    const landId = parseInt(request[2]);
                    const city = await instance.methods.getCity(landId).call();
                    const state = await instance.methods.getState(landId).call();
                    const pid = await instance.methods.getPID(landId).call();
                    landInfo = `${city}, ${state} (PID: ${pid})`;
                } catch (e) { /* use default */ }

                const statusBadge = request[3]
                    ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Approved</span>
                    : <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Pending</span>;

                const paidBadge = isPaid
                    ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Paid</span>
                    : <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f8d7da', color: '#721c24' }}>Unpaid</span>;

                // Check if ownership already transferred
                const landId = parseInt(request[2]);
                const currentOwner = await instance.methods.getLandOwner(landId).call();
                const alreadyTransferred = currentOwner.toLowerCase() === request[1].toLowerCase();
                const canTransfer = request[3] && isPaid && !alreadyTransferred;

                requestTable.push(<tr key={i}>
                    <td>{i}</td>
                    <td>{sellerName}</td>
                    <td>{buyerName}</td>
                    <td>{landInfo}</td>
                    <td>{statusBadge}</td>
                    <td>{paidBadge}</td>
                    <td>
                        {alreadyTransferred ? (
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Transferred</span>
                        ) : canTransfer ? (
                            <Button onClick={this.landTransfer(request[2], request[1])} size="sm" color="success">
                                Approve Transfer
                            </Button>
                        ) : (
                            <span style={{ color: '#888', fontSize: 12 }}>
                                {!request[3] ? 'Awaiting Seller Approval' : 'Awaiting Payment'}
                            </span>
                        )}
                    </td>
                </tr>);
            }
            this.setState({ requestTable });

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
                                <CardTitle tag="h4">Land Transfer Requests</CardTitle>
                            </CardHeader>
                            <CardBody>
                                <Table className="tablesorter" responsive color="black">
                                    <thead className="text-primary">
                                        <tr>
                                            <th>#</th>
                                            <th>Seller</th>
                                            <th>Buyer</th>
                                            <th>Land</th>
                                            <th>Request Status</th>
                                            <th>Payment</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.requestTable.length > 0 ? this.state.requestTable : (
                                            <tr><td colSpan="7" style={{textAlign: "center", color: "#888"}}>No transfer requests yet.</td></tr>
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

export default ApproveRequest;
