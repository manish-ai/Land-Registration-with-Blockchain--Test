import React, { Component } from "react";
import ReactDOM from "react-dom";
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap'
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
import "../card.css";



class Dashboard extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      count: 0,
      requested: false,
      lands: [],
      totalLands: 0,
      myRequestCount: 0,
      // Offer modal state
      showOfferModal: false,
      selectedLand: null,
      offerPrice: '',
      offerError: '',
      requesting: false,
    }
  }

  openOfferModal = (land) => {
    this.setState({ showOfferModal: true, selectedLand: land, offerPrice: '', offerError: '', requesting: false });
  }

  closeOfferModal = () => {
    this.setState({ showOfferModal: false, selectedLand: null, offerPrice: '', offerError: '', requesting: false });
  }

  submitOffer = async () => {
    const { selectedLand, offerPrice, LandInstance, account } = this.state;
    const price = parseInt(offerPrice);
    if (!offerPrice || isNaN(price) || price <= 0) {
      this.setState({ offerError: 'Please enter a valid offer price greater than 0.' });
      return;
    }
    this.setState({ requesting: true, offerError: '' });
    try {
      await LandInstance.methods.requestLand(
        selectedLand.owner,
        selectedLand.id,
        price
      ).send({
        from: account,
        gas: 2100000
      });
      this.closeOfferModal();
      window.location.reload(false);
    } catch (err) {
      console.error(err);
      this.setState({ offerError: 'Transaction failed. Please try again.', requesting: false });
    }
  }

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = Land.networks[networkId];
      const instance = new web3.eth.Contract(
        Land.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });

      const currentAddress = getWalletAddress();
      var registered = await instance.methods.isBuyer(currentAddress).call();
      this.setState({ registered: registered });
      var count = await instance.methods.getLandsCount().call();
      count = parseInt(count);
      var verified = await instance.methods.isVerified(currentAddress).call();
      this.setState({ verified: verified });

      // Build buyer's request map: landId → { requestId, status (bool), offerPrice }
      var requestsCount = await instance.methods.getRequestsCount().call();
      requestsCount = parseInt(requestsCount);
      let myRequestCount = 0;
      const myRequests = {}; // keyed by landId
      for (var r = 1; r <= requestsCount; r++) {
        var req = await instance.methods.getRequestDetails(r).call();
        // req: [sellerId, buyerId, landId, requestStatus (bool), offerPrice]
        if (req[1].toLowerCase() === currentAddress.toLowerCase()) {
          myRequestCount++;
          const landId = parseInt(req[2]);
          myRequests[landId] = { requestId: r, accepted: req[3], offerPrice: parseInt(req[4]) };
        }
      }

      // Build the available lands data
      const lands = [];
      for (var i = 1; i <= count; i++) {
        var landOwner = await instance.methods.getLandOwner(i).call();
        var area = await instance.methods.getArea(i).call();
        var city = await instance.methods.getCity(i).call();
        var state = await instance.methods.getState(i).call();
        var price = await instance.methods.getPrice(i).call();
        var pid = await instance.methods.getPID(i).call();
        var survey = await instance.methods.getSurveyNumber(i).call();
        var landVerified = await instance.methods.isLandVerified(i).call();
        if (!landVerified) continue;
        var requested = await instance.methods.isRequested(i).call();
        const isOwnLand = landOwner.toLowerCase() === currentAddress.toLowerCase();
        const myReq = myRequests[i] || null;
        lands.push({ id: i, owner: landOwner, area, city, state, price: parseInt(price), pid, survey, requested, isOwnLand, myRequest: myReq });
      }
      this.setState({ lands, totalLands: count, myRequestCount });

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

    if (!this.state.registered) {
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
      <>
        <div className="content">
          <Row style={{ marginBottom: 8 }}>
              <Col lg="3" md="6">
                <div className="kpi-card kpi-teal">
                  <div className="kpi-icon"><i className="fa fa-landmark" /></div>
                  <div className="kpi-number">{this.state.totalLands}</div>
                  <div className="kpi-label">Available Lands</div>
                </div>
              </Col>
              <Col lg="3" md="6">
                <div className="kpi-card kpi-indigo">
                  <div className="kpi-icon"><i className="fa fa-bell" /></div>
                  <div className="kpi-number">{this.state.myRequestCount}</div>
                  <div className="kpi-label">My Requests</div>
                </div>
              </Col>
            </Row>

          {!this.state.verified && this.state.registered && (
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
                  <strong>Pending Verification:</strong> Your account is awaiting Land Inspector approval. Once verified, you can request land purchases.
                </div>
              </Col>
            </Row>
          )}

          <Row>
            <Col lg="4" md="6">
              <Card>
                <CardHeader>
                  <CardTitle tag="h5">
                    <i className="tim-icons icon-single-02" style={{ marginRight: 8, color: '#e14eca' }} />
                    My Profile
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>View and update your registered buyer details.</p>
                  <Button href="/buyer/profile" className="btn-fill" color="primary" block>
                    View Profile
                  </Button>
                </CardBody>
              </Card>
            </Col>
            <Col lg="4" md="6">
              <Card>
                <CardHeader>
                  <CardTitle tag="h5">
                    <i className="tim-icons icon-bank" style={{ marginRight: 8, color: '#e14eca' }} />
                    Owned Lands
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>View all land properties that have been transferred to you.</p>
                  <Button href="/buyer/owned-lands" className="btn-fill" color="primary" block>
                    View Owned Lands
                  </Button>
                </CardBody>
              </Card>
            </Col>
            <Col lg="4" md="6">
              <Card>
                <CardHeader>
                  <CardTitle tag="h5">
                    <i className="tim-icons icon-money-coins" style={{ marginRight: 8, color: '#e14eca' }} />
                    Payments
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <p style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 12 }}>Complete payment for requests that have been accepted by the seller.</p>
                  <Button href="/buyer/payment" className="btn-fill" color="success" block>
                    Make Payment
                  </Button>
                </CardBody>
              </Card>
            </Col>
          </Row>
          {this.state.lands.filter(l => l.myRequest && l.myRequest.accepted).length > 0 && (
            <Row>
              <Col lg="12">
                <Card style={{ border: '1px solid #d1fae5' }}>
                  <CardHeader>
                    <CardTitle tag="h5" style={{ color: '#166534', marginBottom: 0 }}>
                      <i className="fa fa-check-circle" style={{ marginRight: 8 }} />
                      Accepted Offers
                    </CardTitle>
                  </CardHeader>
                  <CardBody style={{ paddingTop: 0 }}>
                    {this.state.lands.filter(l => l.myRequest && l.myRequest.accepted).map(land => (
                      <div key={land.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', background: '#f0fdf4', borderRadius: 8, marginBottom: 8,
                      }}>
                        <div>
                          <strong style={{ color: '#333' }}>{land.area} sq ft in {land.city}, {land.state}</strong>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                            PID: {land.pid} &middot; Your offer: ₹{land.myRequest.offerPrice.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <Button href="/buyer/payment" color="success" size="sm" className="btn-fill">
                          Make Payment
                        </Button>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          <Row>
                <Col lg="12" md="12">
                  <Card>
                    <CardHeader>
                      <CardTitle tag="h4">Available Lands</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <Table className="tablesorter" responsive>
                        <thead className="text-primary">
                          <tr>
                            <th>#</th>
                            <th>Area (sq ft)</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Listed Price (₹)</th>
                            <th>Property PID</th>
                            <th>Survey No.</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.lands.length > 0 ? this.state.lands.map(land => {
                            const priceINR = '₹' + land.price.toLocaleString('en-IN');
                            return (
                              <tr key={land.id}>
                                <td>{land.id}</td>
                                <td>{land.area}</td>
                                <td>{land.city}</td>
                                <td>{land.state}</td>
                                <td>{priceINR}</td>
                                <td>{land.pid}</td>
                                <td>{land.survey}</td>
                                <td>
                                  {land.isOwnLand ? (
                                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d4edda', color: '#155724' }}>Owned</span>
                                  ) : land.myRequest && land.myRequest.accepted ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#d1fae5', color: '#166534' }}>Accepted</span>
                                      <Button href="/buyer/payment" color="success" size="sm" style={{ fontSize: 11, padding: '2px 10px' }}>
                                        Pay Now
                                      </Button>
                                    </div>
                                  ) : land.requested ? (
                                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fff3cd', color: '#856404' }}>Offer Sent</span>
                                  ) : (
                                    <Button onClick={() => this.openOfferModal(land)} disabled={!this.state.verified} className="button-vote" style={{ fontSize: 12, padding: '5px 14px' }}>
                                      Make Offer
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan="8" style={{textAlign: "center", color: "#888"}}>No lands listed yet.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
        </div>

        {/* Make Offer Modal */}
        {this.state.showOfferModal && this.state.selectedLand && ReactDOM.createPortal(
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={this.closeOfferModal}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 420, maxWidth: '90vw', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
              onClick={e => e.stopPropagation()}>
              <h4 style={{ color: '#1d1d2b', marginBottom: 4, fontWeight: 600 }}>Make an Offer</h4>
              <p style={{ color: '#666', fontSize: 13, marginBottom: 16 }}>
                {this.state.selectedLand.area} sq ft in {this.state.selectedLand.city}, {this.state.selectedLand.state}
              </p>
              <div style={{ background: '#f0f4ff', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
                <span style={{ color: '#666' }}>Listed Price: </span>
                <span style={{ color: '#344767', fontWeight: 700 }}>₹{this.state.selectedLand.price.toLocaleString('en-IN')}</span>
              </div>
              <label style={{ color: '#555', fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Your Offer Price (₹)</label>
              <input
                type="number"
                value={this.state.offerPrice}
                onChange={e => this.setState({ offerPrice: e.target.value, offerError: '' })}
                placeholder="Enter your offer amount"
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd',
                  background: '#f8f9fa', color: '#333', fontSize: 14, marginBottom: 6, outline: 'none',
                }}
              />
              {this.state.offerError && (
                <p style={{ color: '#dc3545', fontSize: 12, marginBottom: 8 }}>{this.state.offerError}</p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <Button color="secondary" outline onClick={this.closeOfferModal} style={{ flex: 1 }}>Cancel</Button>
                <Button color="primary" className="btn-fill" onClick={this.submitOffer} disabled={this.state.requesting} style={{ flex: 1 }}>
                  {this.state.requesting ? 'Submitting...' : 'Submit Offer'}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </>

    );
  }
}


export default Dashboard;
