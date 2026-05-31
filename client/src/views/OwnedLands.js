import React, { Component } from 'react';
import Land from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import { getWalletAddress } from '../services/authService';
import { Spinner } from 'react-bootstrap';
import {
  Card,
  CardHeader,
  CardBody,
  CardTitle,
  Table,
  Row,
  Col,
} from "reactstrap";


class OwnedLands extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      verified: '',
      registered: '',
      landRows: [],
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

      const currentAddress = getWalletAddress();
      this.setState({ LandInstance: instance, web3: web3, account: currentAddress });

      var verified = await instance.methods.isVerified(currentAddress).call();
      this.setState({ verified: verified });
      var registered = await instance.methods.isBuyer(currentAddress).call();
      this.setState({ registered: registered });

      var count = parseInt(await instance.methods.getLandsCount().call());

      const landRows = [];
      for (var i = 1; i <= count; i++) {
        var owner = await instance.methods.getLandOwner(i).call();
        if (owner.toLowerCase() === currentAddress.toLowerCase()) {
          const area = await instance.methods.getArea(i).call();
          const city = await instance.methods.getCity(i).call();
          const state = await instance.methods.getState(i).call();
          const price = await instance.methods.getPrice(i).call();
          const pid = await instance.methods.getPID(i).call();
          const survey = await instance.methods.getSurveyNumber(i).call();

          landRows.push(<tr key={i}>
            <td>{landRows.length + 1}</td>
            <td>{area} sq m</td>
            <td>{city}</td>
            <td>{state}</td>
            <td>₹{parseInt(price).toLocaleString('en-IN')}</td>
            <td>{pid}</td>
            <td>{survey}</td>
          </tr>);
        }
      }
      this.setState({ landRows });

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
      <div className="content">
        <Row>
          <Col lg="12" md="12">
            <Card>
              <CardHeader>
                <CardTitle tag="h4">Owned Lands</CardTitle>
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
                    {this.state.landRows.length > 0 ? this.state.landRows : (
                      <tr><td colSpan="7" style={{textAlign: "center", color: "#888"}}>You don't own any lands yet.</td></tr>
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

export default OwnedLands;
