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
  Table,
  Row,
  Col,
} from "reactstrap";

import "../card.css";
import "../index.css";


class SDash extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      verified: '',
      registered: '',
      row: [],
      myLandCount: 0,
      myRequestCount: 0,
    }
  }

  viewImage = (landId) => {
    alert(landId);
    this.props.history.push({
        pathname: '/viewImage',
      })
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

      const currentAddress = getWalletAddress();
      console.log(currentAddress);
      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
      var verified = await instance.methods.isVerified(currentAddress).call();
      console.log(verified);
      this.setState({ verified: verified });
      var registered = await instance.methods.isSeller(currentAddress).call();
      console.log(registered);
      this.setState({ registered: registered });

      var totalCount = await instance.methods.getLandsCount().call();
      totalCount = parseInt(totalCount);

      // Only show this seller's own lands
      const row = [];
      let myLandCount = 0;
      for (var i = 1; i <= totalCount; i++) {
        var owner = await instance.methods.getLandOwner(i).call();
        if (owner.toLowerCase() !== currentAddress.toLowerCase()) continue;
        myLandCount++;
        var area = await instance.methods.getArea(i).call();
        var city = await instance.methods.getCity(i).call();
        var state = await instance.methods.getState(i).call();
        var price = await instance.methods.getPrice(i).call();
        var pid = await instance.methods.getPID(i).call();
        var survey = await instance.methods.getSurveyNumber(i).call();
        row.push(<tr key={i}><td>{myLandCount}</td><td>{area}</td><td>{city}</td><td>{state}</td><td>{price}</td><td>{pid}</td><td>{survey}</td></tr>);
      }

      // Count requests for this seller's lands
      var requestsCount = await instance.methods.getRequestsCount().call();
      requestsCount = parseInt(requestsCount);
      let myRequestCount = 0;
      for (var r = 1; r <= requestsCount; r++) {
        var req = await instance.methods.getRequestDetails(r).call();
        if (req[0].toLowerCase() === currentAddress.toLowerCase()) myRequestCount++;
      }

      this.setState({ row, myLandCount, myRequestCount });

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
          <div className="main-section">
                <Row>
                  <Col lg="4">
                    <div class="dashbord dashbord-orange">
                      <div class="icon-section">
                        <i class="fa fa-landmark" aria-hidden="true"></i><br />
                        <medium>My Listed Lands</medium><br />
                        <p>{this.state.myLandCount}</p>
                      </div>
                      <div class="detail-section"><br />
                      </div>
                    </div>
                  </Col>
                  <Col lg="4">
                    <div class="dashbord dashbord-blue">
                      <div class="icon-section">
                        <i class="fa fa-bell" aria-hidden="true"></i><br />
                        <medium>Requests for My Lands</medium><br />
                        <p>{this.state.myRequestCount}</p>
                      </div>
                      <div class="detail-section">
                        <br />
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
          <Row>
            <Col lg="4">
              <Card>
                <CardHeader>
                  <h5 className="title">Wish to Add Land !</h5>
                </CardHeader>
                <CardBody>
                  <div className="chart-area">

                    <Button href="/seller/add-land" disabled={!this.state.verified} className="btn-fill" color="primary">
                      Add Land
                </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col lg="4">
              <Card>
                <CardHeader>
                  <h5 className="title">Profile</h5>
                </CardHeader>
                <CardBody>
                  <div className="chart-area">

                    <Button href="/seller/sellerProfile" className="btn-fill" color="primary">
                      View Profile
                </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col lg="4">
              <Card>
                <CardHeader>
                  <h5 className="title">Requests</h5>
                </CardHeader>
                <CardBody>
                  <div className="chart-area">

                    <Button href="/seller/requests" disabled={!this.state.verified} className="btn-fill" color="primary">
                      View all Land Requests
                        </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
         
          <Row>
                <Col lg="12" md="12">
                  <Card>
                    <CardHeader>
                      <CardTitle tag="h4">My Lands</CardTitle>
                    </CardHeader>
                    <CardBody>
                      <Table className="tablesorter" responsive color="black">
                        <thead className="text-primary">
                          <tr>
                            <th>#</th>
                            <th>Area</th>
                            <th>City</th>
                            <th>State</th>
                            <th>Price</th>
                            <th>Property PID</th>
                            <th>Survey Number</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.row.length > 0 ? this.state.row : (
                            <tr><td colSpan="7" style={{textAlign: "center", color: "#888"}}>No lands added yet.</td></tr>
                          )}
                        </tbody>
                      </Table>
                    </CardBody>
                  </Card>
                </Col>
              </Row>
          <Row>
            <Col lg="4">
              <Card>
                <CardHeader>
                  <CardTitle>View Images of all Lands!</CardTitle>
                </CardHeader>
                <CardBody>
                    <Button href="/seller/gallery" className="btn-fill" color="primary">
                      View Images
                </Button>
                </CardBody>
              </Card>
            </Col>
            </Row>
        </div>
      </>

    );

  }
}

export default SDash;