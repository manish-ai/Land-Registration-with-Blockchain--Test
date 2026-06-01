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


class ApproveRequest extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            verified: '',
            requests: [],
            showModal: false,
            selectedReq: null,
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

    openModal = (req) => {
        this.setState({ showModal: true, selectedReq: req });
    }

    closeModal = () => {
        this.setState({ showModal: false, selectedReq: null });
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

            const requests = [];
            for (let i = 1; i <= requestsCount; i++) {
                var request = await instance.methods.getRequestDetails(i).call();
                var isPaid = await instance.methods.isPaid(i).call();

                // Resolve names and details
                let sellerName = request[0], buyerName = request[1];
                let sellerAge = '', sellerLands = '', buyerAge = '', buyerCity = '', buyerEmail = '';
                try {
                    const sd = await instance.methods.getSellerDetails(request[0]).call();
                    sellerName = sd[0] || request[0];
                    sellerAge = sd[1]; sellerLands = sd[2];
                } catch (e) {}
                try {
                    const bd = await instance.methods.getBuyerDetails(request[1]).call();
                    buyerName = bd[0] || request[1];
                    buyerAge = bd[1]; buyerCity = bd[2]; buyerEmail = bd[3];
                } catch (e) {}

                // Get land info
                const landId = parseInt(request[2]);
                let city = '', state = '', pid = '', survey = '', area = '';
                try {
                    city = await instance.methods.getCity(landId).call();
                    state = await instance.methods.getState(landId).call();
                    pid = await instance.methods.getPID(landId).call();
                    survey = await instance.methods.getSurveyNumber(landId).call();
                    area = await instance.methods.getArea(landId).call();
                } catch (e) {}

                const offerPrice = parseInt(request[4]) || 0;
                let listedPrice = 0;
                try { listedPrice = parseInt(await instance.methods.getPrice(landId).call()); } catch (e) {}

                const currentOwner = await instance.methods.getLandOwner(landId).call();
                const alreadyTransferred = currentOwner.toLowerCase() === request[1].toLowerCase();
                const canTransfer = request[3] && isPaid && !alreadyTransferred;

                requests.push({
                    reqId: i, sellerName, buyerName, landId, city, state, pid, survey, area,
                    approved: request[3], isPaid, offerPrice, listedPrice,
                    alreadyTransferred, canTransfer,
                    sellerAddr: request[0], buyerAddr: request[1],
                    sellerAge, sellerLands, buyerAge, buyerCity, buyerEmail,
                });
            }
            this.setState({ requests });

        } catch (error) {
            alert(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
    };

    renderModal() {
        const { showModal, selectedReq } = this.state;
        if (!showModal || !selectedReq) return null;

        const r = selectedReq;
        const charges = computeCharges(r.offerPrice);

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
                            <h5 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e', fontSize: 16 }}>Transaction Details</h5>
                            <span style={{ fontSize: 12, color: '#888' }}>Request #{r.reqId}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.approved ? '#d4edda' : '#fff3cd', color: r.approved ? '#155724' : '#856404' }}>
                                {r.approved ? 'Approved' : 'Pending'}
                            </span>
                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.isPaid ? '#d4edda' : '#f8d7da', color: r.isPaid ? '#155724' : '#721c24' }}>
                                {r.isPaid ? 'Paid' : 'Unpaid'}
                            </span>
                            {r.alreadyTransferred && (
                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#dbeafe', color: '#1e40af' }}>Transferred</span>
                            )}
                            <button onClick={this.closeModal} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999', lineHeight: 1, marginLeft: 8 }}>&times;</button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '20px 24px' }}>
                        <Section title="Property Details">
                            <InfoRow label="Land ID" value={`#${r.landId}`} />
                            <InfoRow label="Property PID" value={r.pid || 'N/A'} />
                            <InfoRow label="Survey Number" value={r.survey || 'N/A'} />
                            <InfoRow label="Area" value={r.area ? `${r.area} sq ft` : 'N/A'} />
                            <InfoRow label="Location" value={r.city && r.state ? `${r.city}, ${r.state}` : 'N/A'} />
                        </Section>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <Section title="Seller">
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>{r.sellerName}</div>
                                {r.sellerAge && <div style={{ fontSize: 12, color: '#666' }}>Age: {r.sellerAge.toString()}</div>}
                                {r.sellerLands && <div style={{ fontSize: 12, color: '#666' }}>Lands Owned: {r.sellerLands}</div>}
                                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#999', marginTop: 4, wordBreak: 'break-all' }}>{r.sellerAddr}</div>
                            </Section>

                            <Section title="Buyer">
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#333', marginBottom: 4 }}>{r.buyerName}</div>
                                {r.buyerAge && <div style={{ fontSize: 12, color: '#666' }}>Age: {r.buyerAge.toString()}</div>}
                                {r.buyerCity && <div style={{ fontSize: 12, color: '#666' }}>City: {r.buyerCity}</div>}
                                {r.buyerEmail && <div style={{ fontSize: 12, color: '#666' }}>Email: {r.buyerEmail}</div>}
                                <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#999', marginTop: 4, wordBreak: 'break-all' }}>{r.buyerAddr}</div>
                            </Section>
                        </div>

                        <Section title="Transaction Breakdown (Karnataka)">
                            <div style={{ background: '#f8f9fa', borderRadius: 8, padding: 14 }}>
                                <InfoRow label="Agreed Sale Price" value={fmtINR(r.offerPrice)} bold />
                                {r.offerPrice !== r.listedPrice && (
                                    <InfoRow label="Original Listed Price" value={fmtINR(r.listedPrice)} color="#999" />
                                )}
                                <div style={{ borderTop: '1px dashed #ddd', margin: '6px 0' }} />
                                <InfoRow label="Stamp Duty (5.6%)" value={fmtINR(charges.stampDuty)} />
                                <InfoRow label="Registration Fee (1%)" value={fmtINR(charges.registrationFee)} />
                                <InfoRow label="Cess (10% on Stamp Duty)" value={fmtINR(charges.cess)} />
                                <div style={{ borderTop: '2px solid #333', margin: '6px 0' }} />
                                <InfoRow label="Total Transaction Value" value={fmtINR(charges.grandTotal)} bold color="#166534" />
                            </div>
                        </Section>
                    </div>

                    {/* Footer */}
                    <div style={{ padding: '14px 24px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <Button size="sm" color="secondary" outline onClick={this.closeModal}>Close</Button>
                        {r.canTransfer && (
                            <Button size="sm" color="success" className="btn-fill" onClick={this.landTransfer(r.landId, r.buyerAddr)}>
                                Approve Transfer
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
                    <div><h1><Spinner animation="border" variant="primary" /></h1></div>
                </div>
            );
        }

        if (!this.state.verified) {
            return (
                <div className="content">
                    <Row><Col xs="6"><Card className="card-chart"><CardBody>
                        <h1>You are not verified to view this page</h1>
                    </CardBody></Card></Col></Row>
                </div>
            );
        }

        return (
            <div className="content">
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeader>
                                <CardTitle tag="h4">Land Transfer Approvals</CardTitle>
                                <p style={{ color: '#888', fontSize: 12, margin: 0 }}>
                                    Review transaction details including Karnataka stamp duty & registration charges before approving ownership transfer
                                </p>
                            </CardHeader>
                            <CardBody>
                                <Table className="tablesorter" responsive color="black">
                                    <thead className="text-primary">
                                        <tr>
                                            <th>#</th>
                                            <th>Seller</th>
                                            <th>Buyer</th>
                                            <th>Property</th>
                                            <th>Total Value</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {this.state.requests.length > 0 ? this.state.requests.map(r => {
                                            const charges = computeCharges(r.offerPrice);
                                            return (
                                                <tr key={r.reqId}>
                                                    <td>{r.reqId}</td>
                                                    <td>{r.sellerName}</td>
                                                    <td>{r.buyerName}</td>
                                                    <td>
                                                        <div>{r.city}, {r.state}</div>
                                                        {r.pid && <small style={{ color: '#888' }}>PID: {r.pid}</small>}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700 }}>{fmtINR(charges.grandTotal)}</div>
                                                        <small style={{ color: '#888' }}>Price: {fmtINR(r.offerPrice)} + Fees: {fmtINR(charges.totalCharges)}</small>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.approved ? '#d4edda' : '#fff3cd', color: r.approved ? '#155724' : '#856404', textAlign: 'center' }}>
                                                                {r.approved ? 'Approved' : 'Pending'}
                                                            </span>
                                                            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.isPaid ? '#d4edda' : '#f8d7da', color: r.isPaid ? '#155724' : '#721c24', textAlign: 'center' }}>
                                                                {r.isPaid ? 'Paid' : 'Unpaid'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                                                            <Button size="sm" color="info" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => this.openModal(r)}>
                                                                View Details
                                                            </Button>
                                                            {r.alreadyTransferred ? (
                                                                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Transferred</span>
                                                            ) : r.canTransfer ? (
                                                                <Button onClick={this.landTransfer(r.landId, r.buyerAddr)} size="sm" color="success" style={{ fontSize: 11, padding: '3px 10px' }}>
                                                                    Approve Transfer
                                                                </Button>
                                                            ) : (
                                                                <span style={{ color: '#888', fontSize: 11 }}>
                                                                    {!r.approved ? 'Awaiting Approval' : 'Awaiting Payment'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan="7" style={{textAlign: "center", color: "#888"}}>No transfer requests yet.</td></tr>
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

export default ApproveRequest;
