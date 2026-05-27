import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import "../index.css";
import { FormControl } from "react-bootstrap";
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Spinner } from 'react-bootstrap';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardFooter,
    CardText,
    FormGroup,
    Form,
    Input,
    Row,
    Col,
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

class buyerProfile extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            buyers: 0,
            sellers: 0,
            verified: '',
            buyerTable: null,
            verification: null,
        }
    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            // Use accounts[1] for buyer — accounts[0] is used for seller registration
            const currentAddress = getWalletAddress();
            console.log(currentAddress);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
            
            var buyer_verify = await instance.methods.isVerified(currentAddress).call();
            this.setState({verified: buyer_verify});
            var not_verify = await instance.methods.isRejected(currentAddress).call();
            const statusBadge = buyer_verify
                ? <span style={{ display:'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Verified</span>
                : not_verify
                ? <span style={{ display:'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f8d7da', color: '#721c24' }}>Rejected</span>
                : <span style={{ display:'inline-block', padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Pending Verification</span>;

            const buyer = await instance.methods.getBuyerDetails(currentAddress).call();
            console.log(buyer);

            const infoField = (label, value, mono = false) => (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9a9a9a', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, color: '#333', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all', padding: '8px 12px', background: 'rgba(0,0,0,0.03)', borderRadius: 6, border: '1px solid rgba(0,0,0,0.07)' }}>{value || '—'}</div>
              </div>
            );

            const buyerTableEl = (<>
              {infoField('Wallet Address', currentAddress, true)}
              {infoField('Name', buyer[0])}
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>{infoField('Age', buyer[1])}</div>
                <div style={{ flex: 1 }}>{infoField('City', buyer[2])}</div>
              </div>
              {infoField('Email Address', buyer[3])}
              {infoField('Verification ID', buyer[4], true)}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: '#9a9a9a', marginBottom: 4 }}>Document</div>
                <a href={`http://localhost:4002/api/files/${buyer[5]}`} target="_blank" rel="noreferrer"
                   style={{ color: '#1a5276', fontWeight: 600, fontSize: 13 }}>View Uploaded Document →</a>
              </div>
            </>);
            this.setState({ buyerTable: buyerTableEl, verification: statusBadge });

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

        return (
            <div className="content">
                <DrizzleProvider options={drizzleOptions}>
                    <LoadingContainer>
                        <Row>
                            <Col md="8">
                                <Card>
                                    <CardHeader>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <h5 className="title" style={{ margin: 0 }}>Buyer Profile</h5>
                                            {this.state.verification}
                                        </div>
                                    </CardHeader>
                                    <CardBody>
                                        {this.state.buyerTable}
                                        <Button href="/buyer/update-profile" className="btn-fill" disabled={!this.state.verified} color="primary">
                                            Edit Profile
                                        </Button>
                                    </CardBody>
                                    <CardFooter>

                                    </CardFooter>
                                </Card>
                            </Col>
                        </Row>
                    </LoadingContainer>
                </DrizzleProvider>
            </div>
        );

    }
}

export default buyerProfile;