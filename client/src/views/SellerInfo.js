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


class SellerInfo extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            sellers: 0,
            verified: '',
            not_verified: '',
            sellerTable: [],
        }
    }

    verifySeller = (item) => async () => {
        //console.log("Hello");
        //console.log(item);

        await this.state.LandInstance.methods.verifySeller(
            item
        ).send({
            from: this.state.account,
            gas: 2100000
        });

        //Reload
        window.location.reload(false);

    }

    NotverifySeller = (item) => async() => {

        await this.state.LandInstance.methods.rejectSeller(
            item
        ).send({
            from: this.state.account,
            gas: 2100000
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


            const sellersCount = await instance.methods.getSellersCount().call();
            console.log(sellersCount);

            const sellersMap = await instance.methods.getSeller().call();

            var verified = await instance.methods.isLandInspector(currentAddress).call();
            this.setState({ verified: verified });

            const sellerTable = [];
            for (let i = 0; i < sellersCount; i++) {
                var seller = await instance.methods.getSellerDetails(sellersMap[i]).call();
                console.log(seller);
                var seller_verify = await instance.methods.isVerified(sellersMap[i]).call();
                console.log(seller_verify);
                seller.verified = seller_verify;

                var not_verify = await instance.methods.isRejected(sellersMap[i]).call();
                console.log(not_verify);

                const addrShort = `${sellersMap[i].slice(0, 8)}...${sellersMap[i].slice(-6)}`;
                const statusBadge = seller_verify
                    ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Verified</span>
                    : not_verify
                    ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#f8d7da', color: '#721c24' }}>Rejected</span>
                    : <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Pending</span>;
                sellerTable.push(<tr key={i}>
                    <td>{i + 1}</td>
                    <td><span title={sellersMap[i]} style={{ fontFamily: 'monospace', fontSize: 12 }}>{addrShort}</span></td>
                    <td>{seller[0]}</td><td>{seller[1]}</td><td>{seller[2]}</td><td>{seller[3]}</td>
                    <td>{seller[4] ? <a href={`http://localhost:4002/api/files/${seller[4]}`} target="_blank" rel="noreferrer" style={{ color: '#1a5276', fontWeight: 600 }}>View</a> : ''}</td>
                    <td>{statusBadge}</td>
                    <td>
                        {!seller_verify && !not_verify && (
                            <Button onClick={this.verifySeller(sellersMap[i])} size="sm" color="success">
                                Verify
                            </Button>
                        )}
                    </td>
                    <td>
                        {!seller_verify && !not_verify && (
                            <Button onClick={this.NotverifySeller(sellersMap[i])} size="sm" color="danger">
                                Reject
                            </Button>
                        )}
                    </td>
                </tr>)

            }
            this.setState({ sellers: sellerTable.length, sellerTable });


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
                                        <CardTitle tag="h4">Sellers Info</CardTitle>
                                    </CardHeader>
                                    <CardBody>
                                        <Table sclassName="tablesorter" responsive color="black">
                                            <thead className="text-primary">
                                                <tr>
                                                    <th>#</th>
                                                    <th>Account Address</th>
                                                    <th>Name</th>
                                                    <th>Age</th>
                                                    <th>Owned Lands</th>
                                                    <th>Verification ID</th>
                                                    <th>Document</th>
                                                    <th>Verification Status</th>
                                                    <th>Verify Seller</th>
                                                    <th>Reject Seller</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.state.sellerTable.length > 0 ? this.state.sellerTable : (
                                                    <tr><td colSpan="10" style={{textAlign: "center", color: "#888"}}>No sellers registered yet.</td></tr>
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

export default SellerInfo;
