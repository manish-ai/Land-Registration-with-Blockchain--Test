import React, { Component } from 'react'
import Land from "../artifacts/Land.json"
import getWeb3 from "../getWeb3"
import { getWalletAddress } from '../services/authService'
import '../index.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import {  Spinner } from 'react-bootstrap'
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
import {
    LoadingContainer,
    AccountData,
    ContractData,
    ContractForm
} from '../drizzle-shims/drizzle-react-components'

const drizzleOptions = {
    contracts: [Land]
}

class ApproveRequest extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            registered: '',
            approved: '',
            requestTable: [],
        }
    }
    approveRequest = (reqId) => async () => {

        await this.state.LandInstance.methods.approveRequest(
            reqId
        ).send({
            from: this.state.account,
            gas: 2100000
        });
        //Reload
        window.location.reload(false);

    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

            const currentAddress = getWalletAddress();
            console.log(currentAddress);
            var registered = await instance.methods.isSeller(currentAddress).call();
            console.log(registered);
            this.setState({ registered: registered });
            var requestsCount = await instance.methods.getRequestsCount().call();
            console.log(requestsCount);
            
            const requestTable = [];
            for (let i = 1; i < requestsCount + 1; i++) {
                var request = await instance.methods.getRequestDetails(i).call();
                var approved = await instance.methods.isApproved(i).call();
                console.log(approved);
                if (currentAddress.toLowerCase() === request[0].toLowerCase()) {
                    // Resolve buyer name from address
                    let buyerName = request[1];
                    try {
                        const buyerDetails = await instance.methods.getBuyerDetails(request[1]).call();
                        if (buyerDetails[0]) buyerName = buyerDetails[0];
                    } catch (e) { /* fallback to address */ }
                    const offerPrice = request[4] ? parseInt(request[4]) : 0;
                    const offerINR = offerPrice > 0 ? '₹' + offerPrice.toLocaleString('en-IN') : '—';
                    // Get land listed price for comparison
                    let landPrice = 0;
                    try {
                        landPrice = parseInt(await instance.methods.getPrice(request[2]).call());
                    } catch (e) {}
                    const priceDiff = landPrice > 0 && offerPrice > 0 ? ((offerPrice - landPrice) / landPrice * 100).toFixed(1) : null;
                    const statusLabel = request[3] ? 'Approved' : 'Pending';
                    const statusColor = request[3] ? '#166534' : '#856404';
                    const statusBg = request[3] ? '#d1fae5' : '#fff3cd';
                    requestTable.push(<tr key={i}><td>{i}</td><td>{buyerName}</td><td>{request[2]}</td>
                        <td>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{offerINR}</div>
                            {priceDiff !== null && (
                                <div style={{ fontSize: 11, color: Number(priceDiff) >= 0 ? '#166534' : '#991b1b' }}>
                                    {Number(priceDiff) >= 0 ? '+' : ''}{priceDiff}% vs listed
                                </div>
                            )}
                        </td>
                        <td><span style={{ padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: statusBg, color: statusColor }}>{statusLabel}</span></td>
                        <td>
                            <Button onClick={this.approveRequest(i)} disabled={approved} className="button-vote" color="success" size="sm">
                                {approved ? 'Accepted' : 'Accept Offer'}
                    </Button>
                        </td></tr>)
                }
            }
            this.setState({ requestTable });

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

        if (!this.state.registered) {
            return (
                <div className="content">
                    <div>
                        <h1>
                            You are not authorized to view this page.
                  </h1>
                    </div>

                </div>
            );
        }

        return (
            <div className="content">
                <DrizzleProvider options={drizzleOptions}>
                    <LoadingContainer>
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h4">Requests Info</CardTitle>
                            </CardHeader>
                            <CardBody>

                                <Table className="tablesorter" responsive color="black">
                                    <thead className="text-primary">
                                        <tr>
                                            <th>#</th>
                                            <th>Buyer Name</th>
                                            <th>Land ID</th>
                                            <th>Offer Price</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.requestTable.length > 0 ? this.state.requestTable : (
                                            <tr><td colSpan="6" style={{textAlign: "center", color: "#888"}}>No pending requests.</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>

                    </LoadingContainer>
                </DrizzleProvider>
            </div>
        );

    }
}

export default ApproveRequest;
