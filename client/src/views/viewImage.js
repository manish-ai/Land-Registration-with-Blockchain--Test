import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress, getRole } from '../services/authService';
import { Spinner } from 'react-bootstrap';
import { Row, Col, Card, CardBody } from 'reactstrap';
import "../index.css";

const GOV_FILES = 'http://localhost:4002/api/files';

class LandGallery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      web3: null,
      LandInstance: null,
      account: getWalletAddress(),
      lands: [],
      role: getRole(),
      verified: false,
      showModal: false,
      selectedLand: null,
      sellerName: '',
      isRequested: false,
      isOwnLand: false,
      requesting: false,
      offerPrice: '',
      offerError: '',
    };
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const currentAddress = getWalletAddress();
      const isSeller = this.state.role === 'seller';
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Land.networks[networkId];
      const instance = new web3.eth.Contract(
        Land.abi,
        deployedNetwork && deployedNetwork.address,
      );

      let verified = false;
      if (!isSeller && currentAddress) {
        verified = await instance.methods.isVerified(currentAddress).call();
      }

      this.setState({ web3, LandInstance: instance, verified });

      const count = parseInt(await instance.methods.getLandsCount().call());
      const lands = [];
      for (let i = 1; i <= count; i++) {
        const owner = await instance.methods.getLandOwner(i).call();
        if (isSeller && currentAddress && owner.toLowerCase() !== currentAddress.toLowerCase()) continue;
        const area     = await instance.methods.getArea(i).call();
        const city     = await instance.methods.getCity(i).call();
        const state    = await instance.methods.getState(i).call();
        const price    = await instance.methods.getPrice(i).call();
        const pid      = await instance.methods.getPID(i).call();
        const survey   = await instance.methods.getSurveyNumber(i).call();
        const landImg  = await instance.methods.getImage(i).call();
        const document = await instance.methods.getDocument(i).call();
        const requested = !isSeller ? await instance.methods.isRequested(i).call() : false;
        const landVerified = await instance.methods.isLandVerified(i).call();
        const landRejected = await instance.methods.isLandRejected(i).call();
        // Buyers only see verified lands
        if (!isSeller && !landVerified) continue;
        const isOwn = currentAddress && owner.toLowerCase() === currentAddress.toLowerCase();
        lands.push({ id: i, area, city, state, price, pid, survey, landImg, document, owner, requested, isOwn, landVerified, landRejected });
      }
      this.setState({ lands });
    } catch (error) {
      alert('Failed to load land gallery. Check console for details.');
      console.error(error);
    }
  };

  openModal = async (land) => {
    let sellerName = '';
    try {
      const seller = await this.state.LandInstance.methods.getSellerDetails(land.owner).call();
      sellerName = seller[0];
    } catch (_) {}
    this.setState({
      showModal: true,
      selectedLand: land,
      sellerName,
      isRequested: land.requested,
      isOwnLand: land.isOwn,
      offerPrice: land.price ? String(land.price) : '',
      offerError: '',
    });
  }

  closeModal = () => {
    this.setState({ showModal: false, selectedLand: null, requesting: false, offerPrice: '', offerError: '' });
  }

  requestLand = async () => {
    const { selectedLand, LandInstance, account, offerPrice } = this.state;
    if (!selectedLand) return;
    if (!offerPrice || !Number(offerPrice) || Number(offerPrice) <= 0) {
      this.setState({ offerError: 'Please enter a valid offer price' });
      return;
    }
    this.setState({ requesting: true, offerError: '' });
    try {
      await LandInstance.methods.requestLand(selectedLand.owner, selectedLand.id, offerPrice).send({
        from: account,
        gas: 2100000
      });
      // Update land status in state
      const lands = this.state.lands.map(l =>
        l.id === selectedLand.id ? { ...l, requested: true } : l
      );
      this.setState({ lands, isRequested: true, requesting: false });
    } catch (e) {
      console.error(e);
      this.setState({ requesting: false });
    }
  }

  render() {
    if (!this.state.web3) {
      return (
        <div className="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }

    const { lands, role, showModal, selectedLand, sellerName, isRequested, isOwnLand, verified, requesting, offerPrice, offerError } = this.state;
    const isSeller = role === 'seller';

    return (
      <div className="content">
        <h4 style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 20 }}>{isSeller ? 'My Lands' : 'Available Lands'}</h4>
        {lands.length === 0 ? (
          <Card>
            <CardBody style={{ textAlign: 'center', color: '#888', padding: 40 }}>
              {isSeller
                ? <>You haven't added any lands yet. Go to <a href="/seller/addLand" style={{ color: '#1a5276', fontWeight: 600 }}>Add Land</a> to list your property.</>
                : 'No lands are currently listed on the blockchain.'}
            </CardBody>
          </Card>
        ) : (
          <Row>
            {lands.map(land => (
              <Col key={land.id} lg="4" md="6" style={{ marginBottom: 24 }}>
                <Card style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e8ecf0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', height: '100%', cursor: !isSeller ? 'pointer' : 'default' }}
                  onClick={!isSeller ? () => this.openModal(land) : undefined}>
                  {land.landImg ? (
                    <img
                      src={`${GOV_FILES}/${land.landImg}`}
                      alt={`Land ${land.id}`}
                      style={{ width: '100%', height: 180, objectFit: 'cover' }}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%', height: 180, background: '#f4f5f7',
                    display: land.landImg ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#aaa', fontSize: 13,
                  }}>
                    No Image
                  </div>
                  <CardBody style={{ padding: '16px 20px' }}>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
                        {'₹' + parseInt(land.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 4 }}>
                      {land.area} sq ft &nbsp;&middot;&nbsp; {land.city}, {land.state}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>
                      PID: {land.pid}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                      Survey No.: {land.survey}
                    </div>
                    {!isSeller && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {land.isOwn ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Owned</span>
                        ) : land.requested ? (
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Requested</span>
                        ) : (
                          <span style={{ fontSize: 12, color: '#1a5276', fontWeight: 600 }}>View Details &rarr;</span>
                        )}
                      </div>
                    )}
                    {isSeller && (
                      <div style={{ marginBottom: 8 }}>
                        {land.landVerified
                          ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#166534' }}>Verified</span>
                          : land.landRejected
                          ? <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#991b1b' }}>Rejected</span>
                          : <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Pending Verification</span>
                        }
                      </div>
                    )}
                    {isSeller && land.document && (
                      <a
                        href={`${GOV_FILES}/${land.document}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 13, color: '#1a5276', fontWeight: 600 }}
                        onClick={e => e.stopPropagation()}
                      >
                        View Land Document &rarr;
                      </a>
                    )}
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {showModal && selectedLand && ReactDOM.createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)' }} onClick={this.closeModal} />
            <div style={{ position: 'relative', background: '#fff', borderRadius: 12, width: 520, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
              {/* Header */}
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ margin: 0, fontWeight: 700, color: '#1a1a2e', fontSize: 18 }}>Land Details</h5>
                <button onClick={this.closeModal} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999', lineHeight: 1 }}>&times;</button>
              </div>

              {/* Image */}
              {selectedLand.landImg ? (
                <img
                  src={`${GOV_FILES}/${selectedLand.landImg}`}
                  alt="Land"
                  style={{ width: '100%', height: 200, objectFit: 'cover' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '100%', height: 120, background: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 13 }}>
                  No Image Available
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '20px 24px' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', marginBottom: 16 }}>
                  {'₹' + parseInt(selectedLand.price).toLocaleString('en-IN')}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Area</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{selectedLand.area} sq ft</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Location</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{selectedLand.city}, {selectedLand.state}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Property PID</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{selectedLand.pid}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Survey No.</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{selectedLand.survey}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Seller</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{sellerName || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>Land ID</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>#{selectedLand.id}</div>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#999', marginBottom: 4 }}>Owner Wallet</div>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#555', background: '#f7f8fc', padding: '8px 12px', borderRadius: 6, marginBottom: 20, wordBreak: 'break-all' }}>
                  {selectedLand.owner}
                </div>

                {selectedLand.document && (
                  <div style={{ marginBottom: 20 }}>
                    <a
                      href={`${GOV_FILES}/${selectedLand.document}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 13, color: '#1a5276', fontWeight: 600 }}
                    >
                      View Land Document &rarr;
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0' }}>
                {!isOwnLand && !isRequested && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, display: 'block' }}>Your Offer Price (INR)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Enter your offer amount"
                      value={offerPrice}
                      onChange={e => this.setState({ offerPrice: e.target.value, offerError: '' })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                    {offerError && <div style={{ color: '#c0392b', fontSize: 12, marginTop: 4 }}>{offerError}</div>}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={this.closeModal} style={{
                    padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd', background: '#fff',
                    fontSize: 13, fontWeight: 600, color: '#666', cursor: 'pointer',
                  }}>Close</button>
                  {isOwnLand ? (
                    <span style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#d4edda', color: '#155724' }}>You Own This Land</span>
                  ) : isRequested ? (
                    <span style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Already Requested</span>
                  ) : (
                    <button
                      onClick={this.requestLand}
                      disabled={!verified || requesting}
                      style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700,
                        background: (!verified || requesting) ? '#aaa' : '#1a5276', color: '#fff',
                        cursor: (!verified || requesting) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {requesting ? 'Requesting...' : 'Request Land'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }
}

export default LandGallery;
