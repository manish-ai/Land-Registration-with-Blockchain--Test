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

class updateBuyer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            address: '',
            name: '',
            age: '',
            city: '',
            email: '',
            verification: null,
            buyerTable: null,
        }
    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const currentAddress = getWalletAddress();
            console.log(currentAddress);
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Land.networks[networkId];
            const instance = new web3.eth.Contract(
                Land.abi,
                deployedNetwork && deployedNetwork.address,
            );

            this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
            this.setState({address: currentAddress});
            var buyer_verify = await instance.methods.isVerified(currentAddress).call();
            var not_verify = await instance.methods.isRejected(currentAddress).call();
            let verificationEl;
            if(buyer_verify){
              verificationEl = <p id="verified">Verified <i className="fas fa-user-check"></i></p>;
            }else if(not_verify){
              verificationEl = <p id="rejected">Rejected <i className="fas fa-user-times"></i></p>;
            }else{
              verificationEl = <p id="unknown">Not Yet Verified <i className="fas fa-user-cog"></i></p>;
            }

            const buyer = await instance.methods.getBuyerDetails(currentAddress).call();
            console.log(buyer);
            console.log(buyer[0]);
            const buyerTableEl = (
            <Row>
                <Col md="12">
                  <FormGroup>
                    <label>Your Wallet Address: </label>
                    <Input
                      disabled
                      type="text"
                      value={currentAddress}
                    />
                  </FormGroup>
                </Col>
              </Row>
              );
            this.setState({name: buyer[0], age: buyer[1], city: buyer[2], email: buyer[3], buyerTable: buyerTableEl, verification: verificationEl });

        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };
    updateBuyer = async () => {
      if (this.state.name == '' || this.state.age == '' || this.state.city == '' || this.state.email == '') {
          alert("All the fields are compulsory!");
      } else if (!Number(this.state.age)) {
          alert("Your age must be a number");
      }
      else{
          await this.state.LandInstance.methods.updateBuyer(
              this.state.name,
              this.state.age,
              this.state.city,
              this.state.email
              )
              .send({
                  from : this.state.address,
                  gas : 2100000
              }).then(() => {
                  window.location.href = "/buyer/profile";
              });
      }
  }

  updateName = event => (
      this.setState({ name: event.target.value })
  )
  updateAge = event => (
      this.setState({ age: event.target.value })
  )
  updateCity = event => (
      this.setState({ city: event.target.value })
  )
  updateEmail = event => (
      this.setState({ email: event.target.value })
  )
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
                        <h5 className="title">Buyer Profile</h5>
                        <h5 className="title">{this.state.verification}</h5>

                      </CardHeader>
                      <CardBody>
                        <Form>
                          {this.state.buyerTable}
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label>Name</label>
                                <Input
                                  type="text"
                                  value={this.state.name}
                                  onChange={this.updateName}
                                />
                              </FormGroup>
                            </Col>

                          </Row>
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label>Age</label>
                                <Input
                                  type="text"
                                  value={this.state.age}
                                  onChange={this.updateAge}
                                />
                              </FormGroup>
                            </Col>

                          </Row>
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label>Email Address </label>
                                <Input
                                  type="text"
                                  value={this.state.email}
                                  onChange={this.updateEmail}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label>City</label>
                                <Input
                                  type="text"
                                  value={this.state.city}
                                  onChange={this.updateCity}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                        </Form>
                      </CardBody>
                      <CardFooter>
                        <Button onClick={this.updateBuyer} className="btn-fill" color="primary">
                          Update
                      </Button>
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

export default updateBuyer;