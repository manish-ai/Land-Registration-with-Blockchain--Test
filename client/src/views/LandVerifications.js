import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Spinner } from 'react-bootstrap';
import {
  Card, CardHeader, CardBody, CardTitle, Table, Row, Col,
} from "reactstrap";
import "../index.css";

const GOV_FILES = 'http://localhost:4002/api/files';

class LandVerifications extends Component {
  constructor(props) {
    super(props);
    this.state = {
      LandInstance: undefined,
      web3: null,
      account: null,
      isInspector: false,
      lands: [],
      showModal: false,
      selected: null,
      sellerName: '',
      processing: false,
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

      const isInspector = await instance.methods.isLandInspector(currentAddress).call();
      this.setState({ LandInstance: instance, web3, account: currentAddress, isInspector });

      const count = parseInt(await instance.methods.getLandsCount().call());
      const lands = [];
      for (let i = 1; i <= count; i++) {
        const owner = await instance.methods.getLandOwner(i).call();
        const area = await instance.methods.getArea(i).call();
        const city = await instance.methods.getCity(i).call();
        const state = await instance.methods.getState(i).call();
        const price = await instance.methods.getPrice(i).call();
        const pid = await instance.methods.getPID(i).call();
        const survey = await instance.methods.getSurveyNumber(i).call();
        const landImg = await instance.methods.getImage(i).call();
        const document = await instance.methods.getDocument(i).call();
        const verified = await instance.methods.isLandVerified(i).call();
        const rejected = await instance.methods.isLandRejected(i).call();

        let sellerName = '';
        try {
          const s = await instance.methods.getSellerDetails(owner).call();
          sellerName = s[0];
        } catch (_) {}

        lands.push({ id: i, owner, area, city, state, price, pid, survey, landImg, document, verified, rejected, sellerName });
      }
      this.setState({ lands });
    } catch (error) {
      alert('Failed to load data. Check console.');
      console.error(error);
    }
  };

  openModal = (land) => {
    this.setState({ showModal: true, selected: land });
  }

  closeModal = () => {
    this.setState({ showModal: false, selected: null, processing: false });
  }

  approveLand = async () => {
    const { selected, LandInstance, account } = this.state;
    if (!selected) return;
    this.setState({ processing: true });
    try {
      await LandInstance.methods.verifyLand(selected.id).send({ from: account, gas: 2100000 });
      const lands = this.state.lands.map(l => l.id === selected.id ? { ...l, verified: true, rejected: false } : l);
      this.setState({ lands, selected: { ...selected, verified: true, rejected: false }, processing: false });
    } catch (e) {
      console.error(e);
      this.setState({ processing: false });
    }
  }

  rejectLand = async () => {
    const { selected, LandInstance, account } = this.state;
    if (!selected) return;
    this.setState({ processing: true });
    try {
      await LandInstance.methods.rejectLand(selected.id).send({ from: account, gas: 2100000 });
      const lands = this.state.lands.map(l => l.id === selected.id ? { ...l, rejected: true, verified: false } : l);
      this.setState({ lands, selected: { ...selected, rejected: true, verified: false }, processing: false });
    } catch (e) {
      console.error(e);
      this.setState({ processing: false });
    }
  }

  render() {
    if (!this.state.web3) {
      return <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}><Spinner animation="border" variant="primary" /></div>;
    }
    if (!this.state.isInspector) {
      return <div className="content"><Row><Col xs="6"><Card><CardBody><h4>You are not authorized to view this page.</h4></CardBody></Card></Col></Row></div>;
    }

    const { lands, showModal, selected, processing } = this.state;

    const statusBadge = (l) => {
      if (l.verified) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#166534' }}>Verified</span>;
      if (l.rejected) return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>Rejected</span>;
      return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Pending</span>;
    };

    return (
      <div className="content">
        <Card>
          <CardHeader>
            <CardTitle tag="h4">Land Verification Requests</CardTitle>
          </CardHeader>
          <CardBody>
            <Table className="tablesorter" responsive>
              <thead className="text-primary">
                <tr>
                  <th>#</th>
                  <th>Property PID</th>
                  <th>City</th>
                  <th>Area (sqft)</th>
                  <th>Price</th>
                  <th>Seller</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lands.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: '#888' }}>No lands registered yet.</td></tr>
                ) : lands.map(l => (
                  <tr key={l.id}>
                    <td>{l.id}</td>
                    <td><code>{l.pid}</code></td>
                    <td>{l.city}</td>
                    <td>{l.area}</td>
                    <td>{'₹' + parseInt(l.price).toLocaleString('en-IN')}</td>
                    <td>{l.sellerName}</td>
                    <td>{statusBadge(l)}</td>
                    <td>
                      <button onClick={() => this.openModal(l)} style={{
                        padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: '#1a5276', color: '#fff', border: 'none', cursor: 'pointer',
                      }}>View More</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        {showModal && selected && ReactDOM.createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)' }} onClick={this.closeModal} />
            <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 540, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e', fontSize: 18 }}>Land #{selected.id} Details</h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {statusBadge(selected)}
                  <button onClick={this.closeModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}>&times;</button>
                </div>
              </div>

              {/* Image */}
              {selected.landImg ? (
                <img src={`${GOV_FILES}/${selected.landImg}`} alt="Land" style={{ width: '100%', height: 200, objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              ) : (
                <div style={{ width: '100%', height: 100, background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13 }}>No Image</div>
              )}

              {/* Body */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>
                  {'₹' + parseInt(selected.price).toLocaleString('en-IN')}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 20 }}>
                  {[
                    ['Area', selected.area + ' sq ft'],
                    ['Location', selected.city + ', ' + selected.state],
                    ['Property PID', selected.pid],
                    ['Survey No.', selected.survey],
                    ['Seller', selected.sellerName || 'N/A'],
                    ['Land ID', '#' + selected.id],
                  ].map(([label, val], idx) => (
                    <div key={idx}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Owner Wallet</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#555', background: '#f7f8fc', padding: '8px 12px', borderRadius: 6, marginBottom: 16, wordBreak: 'break-all' }}>
                  {selected.owner}
                </div>

                {selected.document && (
                  <a href={`${GOV_FILES}/${selected.document}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#1a5276', fontWeight: 600 }}>
                    View Document &rarr;
                  </a>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button onClick={this.closeModal} style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff',
                  fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer',
                }}>Close</button>
                {selected.verified ? (
                  <span style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#d1fae5', color: '#166534' }}>Verified</span>
                ) : selected.rejected ? (
                  <span style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>Rejected</span>
                ) : (
                  <>
                    <button
                      onClick={this.rejectLand}
                      disabled={processing}
                      style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                        background: processing ? '#aaa' : '#dc3545', color: '#fff', cursor: processing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={this.approveLand}
                      disabled={processing}
                      style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                        background: processing ? '#aaa' : '#28a745', color: '#fff', cursor: processing ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }
}

export default LandVerifications;
