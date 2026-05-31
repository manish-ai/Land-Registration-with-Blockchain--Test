import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Spinner } from 'react-bootstrap';
import {
    Button,
    Card,
    CardHeader,
    CardBody,
    CardTitle,
    Row,
    Col,
} from "reactstrap";
import "../card.css";

class LIDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            LandInstance: undefined,
            web3: null,
            verified: false,
            sellersCount: 0,
            buyersCount: 0,
            requestsCount: 0,
            landsCount: 0,
            pendingLands: 0,
        };
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
            this.setState({ LandInstance: instance, web3 });

            const verified = await instance.methods.isLandInspector(currentAddress).call();
            const sellersCount = parseInt(await instance.methods.getSellersCount().call());
            const buyersCount = parseInt(await instance.methods.getBuyersCount().call());
            const requestsCount = parseInt(await instance.methods.getRequestsCount().call());
            const landsCount = parseInt(await instance.methods.getLandsCount().call());

            let pendingLands = 0;
            for (let i = 1; i <= landsCount; i++) {
                const isVerified = await instance.methods.isLandVerified(i).call();
                const isRejected = await instance.methods.isLandRejected(i).call();
                if (!isVerified && !isRejected) pendingLands++;
            }

            this.setState({ verified, sellersCount, buyersCount, requestsCount, landsCount, pendingLands });
        } catch (error) {
            alert('Failed to load contract data. Check console for details.');
            console.error(error);
        }
    };

    render() {
        if (!this.state.web3) {
            return (
                <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                    <Spinner animation="border" variant="primary" />
                </div>
            );
        }

        if (!this.state.verified) {
            return (
                <div className="content">
                    <Row><Col xs="6">
                        <Card><CardBody>
                            <h4 style={{ color: '#e14eca' }}>You are not authorized to view this page.</h4>
                        </CardBody></Card>
                    </Col></Row>
                </div>
            );
        }

        const { sellersCount, buyersCount, requestsCount, landsCount, pendingLands } = this.state;

        return (
            <div className="content">
                {/* KPI cards */}
                <Row style={{ marginBottom: 8 }}>
                    <Col lg="3" md="6">
                        <div className="kpi-card kpi-blue">
                            <div className="kpi-icon"><i className="fa fa-users" /></div>
                            <div className="kpi-number">{buyersCount}</div>
                            <div className="kpi-label">Registered Buyers</div>
                        </div>
                    </Col>
                    <Col lg="3" md="6">
                        <div className="kpi-card kpi-indigo">
                            <div className="kpi-icon"><i className="fa fa-store" /></div>
                            <div className="kpi-number">{sellersCount}</div>
                            <div className="kpi-label">Registered Sellers</div>
                        </div>
                    </Col>
                    <Col lg="3" md="6">
                        <div className="kpi-card kpi-amber">
                            <div className="kpi-icon"><i className="fa fa-bell" /></div>
                            <div className="kpi-number">{requestsCount}</div>
                            <div className="kpi-label">Total Requests</div>
                        </div>
                    </Col>
                    <Col lg="3" md="6">
                        <div className="kpi-card kpi-teal">
                            <div className="kpi-icon"><i className="fa fa-landmark" /></div>
                            <div className="kpi-number">{landsCount}</div>
                            <div className="kpi-label">Lands Registered</div>
                        </div>
                    </Col>
                </Row>
                {pendingLands > 0 && (
                    <Row>
                        <Col lg="12">
                            <div style={{
                                background: 'rgba(255, 179, 0, 0.1)',
                                border: '1px solid rgba(255, 179, 0, 0.4)',
                                borderRadius: 8,
                                padding: '12px 18px',
                                marginBottom: 16,
                                color: '#ffb300',
                                fontSize: 13,
                            }}>
                                <strong>{pendingLands} land(s)</strong> pending verification. <a href="/admin/land-verifications" style={{ color: '#ffb300', fontWeight: 700, textDecoration: 'underline' }}>Review now &rarr;</a>
                            </div>
                        </Col>
                    </Row>
                )}

                {/* Action cards */}
                <Row>
                    <Col lg="4" md="6">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">
                                    <i className="tim-icons icon-single-02" style={{ marginRight: 8, color: '#e14eca' }} />
                                    Buyer Verification
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>
                                    Review registered buyers and approve their profiles to allow land purchases.
                                </p>
                                <Button href="/admin/buyers" className="btn-fill" color="primary" block>
                                    Verify Buyers
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg="4" md="6">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">
                                    <i className="tim-icons icon-single-02" style={{ marginRight: 8, color: '#e14eca' }} />
                                    Seller Verification
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>
                                    Review registered sellers and approve their profiles to allow land listings.
                                </p>
                                <Button href="/admin/sellers" className="btn-fill" color="primary" block>
                                    Verify Sellers
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg="4" md="6">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">
                                    <i className="tim-icons icon-check-2" style={{ marginRight: 8, color: '#e14eca' }} />
                                    Ownership Transfers
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>
                                    Approve final land ownership transfers after buyer payment is confirmed.
                                </p>
                                <Button href="/admin/approve" className="btn-fill" color="primary" block>
                                    Approve Transfers
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg="4" md="6">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">
                                    <i className="tim-icons icon-send" style={{ marginRight: 8, color: '#e14eca' }} />
                                    All Transactions
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>
                                    View the full transaction history across all land purchase requests.
                                </p>
                                <Button href="/admin/transactions" className="btn-fill" color="primary" block>
                                    View Transactions
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg="4" md="6">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">
                                    <i className="tim-icons icon-badge" style={{ marginRight: 8, color: '#e14eca' }} />
                                    Land Verifications
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>
                                    Review newly added lands and approve or reject them before they appear to buyers.
                                </p>
                                <Button href="/admin/land-verifications" className="btn-fill" color="primary" block>
                                    Verify Lands
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col lg="4" md="6">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h5">
                                    <i className="tim-icons icon-notes" style={{ marginRight: 8, color: '#e14eca' }} />
                                    Audit Trail
                                </CardTitle>
                            </CardHeader>
                            <CardBody>
                                <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>
                                    View a complete log of all system activity for oversight and accountability.
                                </p>
                                <Button href="/admin/audit" className="btn-fill" color="primary" block>
                                    View Audit Trail
                                </Button>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        );
    }
}

export default LIDashboard;
