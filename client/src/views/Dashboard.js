import React, { Component } from "react";
// nodejs library that concatenates classes
import classNames from "classnames";
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { Spinner } from 'react-bootstrap'
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
      row: [],
      totalLands: 0,
      myRequestCount: 0,
    }
  }

  requestLand = (seller_address, land_id) => async () => {

    console.log(seller_address);
    console.log(land_id);
    // this.setState({requested: true});
    // requested = true;
    await this.state.LandInstance.methods.requestLand(
      seller_address,
      land_id
    ).send({
      from: this.state.account,
      gas: 2100000
    }).then(response => {
      // navigation handled by reload below
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
      var registered = await instance.methods.isBuyer(currentAddress).call();
      console.log(registered);
      this.setState({ registered: registered });
      var count = await instance.methods.getLandsCount().call();
      count = parseInt(count);
      console.log(typeof (count));
      console.log(count);
      var verified = await instance.methods.isVerified(currentAddress).call();
      console.log(verified);

      // Count this buyer's own requests
      var requestsCount = await instance.methods.getRequestsCount().call();
      requestsCount = parseInt(requestsCount);
      let myRequestCount = 0;
      for (var r = 1; r <= requestsCount; r++) {
        var req = await instance.methods.getRequestDetails(r).call();
        if (req[1].toLowerCase() === currentAddress.toLowerCase()) myRequestCount++;
      }

      // Build the available lands table (all lands, for buyer to browse & request)
      const row = [];
      for (var i = 1; i <= count; i++) {
        var landOwner = await instance.methods.getLandOwner(i).call();
        var area = await instance.methods.getArea(i).call();
        var city = await instance.methods.getCity(i).call();
        var state = await instance.methods.getState(i).call();
        var price = await instance.methods.getPrice(i).call();
        var pid = await instance.methods.getPID(i).call();
        var survey = await instance.methods.getSurveyNumber(i).call();
        var requested = await instance.methods.isRequested(i).call();

        const priceINR = '₹' + parseInt(price).toLocaleString('en-IN');
        row.push(<tr key={i}><td>{i}</td><td>{area}</td><td>{city}</td><td>{state}</td><td>{priceINR}</td><td>{pid}</td><td>{survey}</td>
          <td>
            <Button onClick={this.requestLand(landOwner, i)} disabled={!verified || requested} className="button-vote">
              Request Land
            </Button>
          </td>
        </tr>)
      }
      this.setState({ row, totalLands: count, myRequestCount });

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
                            <th>Price (₹)</th>
                            <th>Property PID</th>
                            <th>Survey No.</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.row.length > 0 ? this.state.row : (
                            <tr><td colSpan="8" style={{textAlign: "center", color: "#888"}}>No lands listed yet.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
        </div>
      </>

    );
  }
}


export default Dashboard;
