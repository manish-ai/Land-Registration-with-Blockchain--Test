import React, { Component } from 'react';
import ReactDOM from 'react-dom';
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

// Karnataka stamp duty & registration charges
const STAMP_DUTY_RATE = 0.056;
const REGISTRATION_FEE_RATE = 0.01;
const CESS_ON_STAMP_RATE = 0.10;

function computeCharges(basePrice) {
    const stampDuty = Math.round(basePrice * STAMP_DUTY_RATE);
    const registrationFee = Math.round(basePrice * REGISTRATION_FEE_RATE);
    const cess = Math.round(stampDuty * CESS_ON_STAMP_RATE);
    const totalCharges = stampDuty + registrationFee + cess;
    const grandTotal = basePrice + totalCharges;
    return { stampDuty, registrationFee, cess, totalCharges, grandTotal };
}

const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN');


class TransactionInfo extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            verified: '',
            lands: [],
            showModal: false,
            selectedLand: null,
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

    openModal = (land) => {
        this.setState({ showModal: true, selectedLand: land });
    }

    closeModal = () => {
        this.setState({ showModal: false, selectedLand: null });
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

            const lands = [];
            for (var i = 1; i <= count; i++) {
                const area = await instance.methods.getArea(i).call();
                const city = await instance.methods.getCity(i).call();
                const state = await instance.methods.getState(i).call();
                const price = parseInt(await instance.methods.getPrice(i).call());
                const pid = await instance.methods.getPID(i).call();
                const survey = await instance.methods.getSurveyNumber(i).call();
                const owner = await instance.methods.getLandOwner(i).call();

                var reqInfo = requestByLandId[String(i)] || null;
                var request = reqInfo ? reqInfo.req : [null, null, null, false, '0'];
                var isPaid = reqInfo ? reqInfo.isPaid : false;
                var alreadyTransferred = reqInfo && request[1] && owner.toLowerCase() === request[1].toLowerCase();
                var canTransfer = request[3] && isPaid && !alreadyTransferred;

                // Resolve seller and buyer details
                let sellerName = owner, sellerAge = '', sellerLands = '';
                let buyerName = '', buyerAge = '', buyerCity = '', buyerEmail = '';
                let sellerAddr = owner, buyerAddr = '';

                try {
                    const sd = await instance.methods.getSellerDetails(owner).call();
                    if (sd[0]) sellerName = sd[0];
                    sellerAge = sd[1]; sellerLands = sd[2];
                } catch (e) {}

                if (reqInfo && request[1]) {
                    buyerAddr = request[1];
                    try {
                        const bd = await instance.methods.getBuyerDetails(request[1]).call();
                        if (bd[0]) buyerName = bd[0];
                        buyerAge = bd[1]; buyerCity = bd[2]; buyerEmail = bd[3];
                    } catch (e) {
                        buyerName = request[1];
                    }
                }

                const offerPrice = reqInfo ? (parseInt(request[4]) || 0) : 0;

                // Determine status
                let status, statusBg, statusColor;
                if (alreadyTransferred) {
                    status = 'Transferred'; statusBg = '#dbeafe'; statusColor = '#1e40af';
                } else if (canTransfer) {
                    status = 'Ready to Transfer'; statusBg = '#d4edda'; statusColor = '#155724';
                } else if (reqInfo && request[3] && !isPaid) {
                    status = 'Awaiting Payment'; statusBg = '#fff3cd'; statusColor = '#856404';
                } else if (reqInfo && !request[3]) {
                    status = 'Request Pending'; statusBg = '#fff3cd'; statusColor = '#856404';
                } else {
                    status = 'No Request'; statusBg = '#f0f0f0'; statusColor = '#888';
                }

                lands.push({
                    landId: i, area, city, state, price, pid, survey, owner,
                    reqInfo, request, isPaid, alreadyTransferred, canTransfer,
                    sellerName, sellerAge, sellerLands, sellerAddr,
                    buyerName, buyerAge, buyerCity, buyerEmail, buyerAddr,
                    offerPrice, status, statusBg, statusColor,
                });
            }
            this.setState({ lands });

        } catch (error) {
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    renderModal() {
        const { showModal, selectedLand } = this.state;
        if (!showModal || !selectedLand) return null;

        const l = selectedLand;
        const hasTransaction = l.reqInfo != null;
        const basePrice = l.offerPrice > 0 ? l.offerPrice : l.price;
        const charges = computeCharges(basePrice);

        const Section = ({ title, children }) => (
            <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{title}</div>
                {children}
            </div>
        );

        const InfoRow = ({ label, value, mono, bold, color }) => (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                <span style={{ color: '#666' }}>{label}</span>
                <span style={{ color: color || '#333', fontWeight: bold ? 700 : 400, fontFamily: mono ? 'monospace' : 'inherit', fontSize: mono ? 11 : 13 }}>{value}</span>
            </div>
        );

        return ReactDOM.createPortal(
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={this.closeModal}>
                <div style={{ background: '#fff', borderRadius: 12, width: 540, maxWidth: '90vw', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
                    onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h5 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e', fontSize: 16 }}>Land Details</h5>
                            <span style={{ fontSize: 12, color: '#888' }}>Land #{l.landId}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: l.statusBg, color: l.statusColor }}>
                                {l.status}
                            </span>
                            <button onClick={this.closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', lineHeight: 1, marginLeft: 8 }}>&times;</button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '20px 24px' }}>
                        <Section title="Property Details">
                            <InfoRow label="Land ID" value={`#${l.landId}`} />
                            <InfoRow label="Property PID" value={l.pid || 'N/A'} />
                            <InfoRow label="Survey Number" value={l.survey || 'N/A'} />
                            <InfoRow label="Area" value={l.area ? `${l.area} sq m` : 'N/A'} />
                            <InfoRow label="Location" value={l.city && l.state ? `${l.city}, ${l.state}` : 'N/A'} />
                            <InfoRow label="Listed Price" value={fmtINR(l.price)} bold />
                        </Section>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Section title="Owner / Seller">
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>{l.sellerName}</div>
                                {l.sellerAge && <div style={{ fontSize: 12, color: '#666' }}>Age: {l.sellerAge.toString()}</div>}
                                {l.sellerLands && <div style={{ fontSize: 12, color: '#666' }}>Lands Owned: {l.sellerLands}</div>}
                                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#999', marginTop: 4, wordBreak: 'break-all' }}>{l.sellerAddr}</div>
                            </Section>

                            <Section title="Buyer">
                                {l.buyerName ? (
                                    <>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>{l.buyerName}</div>
                                        {l.buyerAge && <div style={{ fontSize: 12, color: '#666' }}>Age: {l.buyerAge.toString()}</div>}
                                        {l.buyerCity && <div style={{ fontSize: 12, color: '#666' }}>City: {l.buyerCity}</div>}
                                        {l.buyerEmail && <div style={{ fontSize: 12, color: '#666' }}>Email: {l.buyerEmail}</div>}
                                        <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#999', marginTop: 4, wordBreak: 'break-all' }}>{l.buyerAddr}</div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: 13, color: '#999' }}>No buyer yet</div>
                                )}
                            </Section>
                        </div>

                        {hasTransaction && l.offerPrice > 0 && (
                            <Section title="Transaction Breakdown (Karnataka)">
                                <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 14 }}>
                                    <InfoRow label="Agreed Sale Price" value={fmtINR(l.offerPrice)} bold />
                                    {l.offerPrice !== l.price && (
                                        <InfoRow label="Original Listed Price" value={fmtINR(l.price)} color="#999" />
                                    )}
                                    <div style={{ borderTop: '1px dashed #ddd', margin: '6px 0' }} />
                                    <InfoRow label="Stamp Duty (5.6%)" value={fmtINR(charges.stampDuty)} />
                                    <InfoRow label="Registration Fee (1%)" value={fmtINR(charges.registrationFee)} />
                                    <InfoRow label="Cess (10% on Stamp Duty)" value={fmtINR(charges.cess)} />
                                    <div style={{ borderTop: '2px solid #333', margin: '6px 0' }} />
                                    <InfoRow label="Total Transaction Value" value={fmtINR(charges.grandTotal)} bold color="#166534" />
                                </div>
                            </Section>
                        )}
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button size="sm" color="secondary" outline onClick={this.closeModal}>Close</Button>
                        {l.canTransfer && (
                            <Button size="sm" color="success" className="btn-fill" onClick={this.landTransfer(l.landId, l.buyerAddr)}>
                                Transfer Ownership
                            </Button>
                        )}
                    </div>
                </div>
            </div>,
            document.body
        );
    }

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
                                <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                                    All registered lands with transaction status and details
                                </p>
                            </CardHeader>
                            <CardBody>
                                <Table className="tablesorter" responsive color="black">
                                    <thead className="text-primary">
                                        <tr>
                                            <th>#</th>
                                            <th>Owner</th>
                                            <th>Location</th>
                                            <th>Area</th>
                                            <th>Listed Price</th>
                                            <th>PID</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.lands.length > 0 ? this.state.lands.map(l => (
                                            <tr key={l.landId}>
                                                <td>{l.landId}</td>
                                                <td>{l.sellerName}</td>
                                                <td>{l.city}, {l.state}</td>
                                                <td>{l.area} sq m</td>
                                                <td>{fmtINR(l.price)}</td>
                                                <td>{l.pid}</td>
                                                <td>
                                                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: l.statusBg, color: l.statusColor }}>
                                                        {l.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                                                        <Button size="sm" color="info" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => this.openModal(l)}>
                                                            View More
                                                        </Button>
                                                        {l.canTransfer && (
                                                            <Button onClick={this.landTransfer(l.landId, l.buyerAddr)} size="sm" color="success" style={{ fontSize: 11, padding: '3px 10px' }}>
                                                                Transfer Ownership
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="8" style={{textAlign: "center", color: "#888"}}>No land transactions found.</td></tr>
                                        )}
                                    </tbody>
                                </Table>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {this.renderModal()}
            </div>
        );
    }
}

export default TransactionInfo;
