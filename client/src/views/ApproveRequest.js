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
                    requestTable.push(<tr key={i}><td>{i}</td><td>{request[1]}</td><td>{request[2]}</td><td>{request[3].toString()}</td>
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
                                            <th>Buyer Address</th>
                                            <th>Land ID</th>
                                            <th>Request Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.requestTable.length > 0 ? this.state.requestTable : (
                                            <tr><td colSpan="5" style={{textAlign: "center", color: "#888"}}>No pending requests.</td></tr>
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
