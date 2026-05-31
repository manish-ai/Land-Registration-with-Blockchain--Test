import React, {Component} from 'react'
import Land from "../artifacts/Land.json"
import getWeb3 from "../getWeb3"
import { getWalletAddress } from '../services/authService'

import '../index.css';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';
import { DrizzleProvider } from '../drizzle-shims/drizzle-react';
import { Table, Spinner } from 'react-bootstrap';
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

class updateSeller extends Component {
    constructor(props){
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            address: '',
            name: '',
            age: '',
            landsOwned: '',
            verification: null,
            sellerTable: null,
        }
    }

    componentDidMount = async () => {
        try{
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
            var seller_verify = await instance.methods.isVerified(currentAddress).call();
            console.log(seller_verify);
            var not_verify = await instance.methods.isRejected(currentAddress).call();
            console.log(not_verify);
            let verificationEl;
            if(seller_verify){
              verificationEl = <p id="verified">Verified <i className="fas fa-user-check"></i></p>;
            }else if(not_verify){
              verificationEl = <p id="rejected">Rejected <i className="fas fa-user-times"></i></p>;
            }else{
              verificationEl = <p id="unknown">Not Yet Verified <i className="fas fa-user-cog"></i></p>;
            }

            const seller = await instance.methods.getSellerDetails(currentAddress).call();
            console.log(seller);
            console.log(seller[0]);
            const sellerTableEl = (
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
            this.setState({name: seller[0], age: seller[1], landsOwned: seller[2], sellerTable: sellerTableEl, verification: verificationEl, verified: seller_verify });

        }catch (error) {
            // Catch any errors for any of the above operations.
            alert(
              `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
          }
    };

    updateSeller = async () => {
        if (!this.state.name.trim() || !this.state.age || !this.state.landsOwned.toString().trim()) {
            alert("All the fields are compulsory!");
        } else if (!Number(this.state.age) || Number(this.state.age) < 21 || Number(this.state.age) > 120) {
            alert("Age must be a number between 21 and 120");
        } else if (isNaN(this.state.landsOwned) || Number(this.state.landsOwned) < 0) {
            alert("Owned Lands must be a non-negative number");
        } else {
            await this.state.LandInstance.methods.updateSeller(
                this.state.name,
                this.state.age,
                this.state.landsOwned
                )
                .send({
                    from: this.state.address,
                    gas: 2100000
                }).then(() => {
                    window.location.href = "/seller/profile";
                });
        }
    }

    updateName = event => (
        this.setState({ name: event.target.value })
    )
    updateAge = event => (
        this.setState({ age: event.target.value })
    )
    updateOwnedLands = event => (
        this.setState({ landsOwned: event.target.value })
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
                                        <h5 className="title">Seller Profile</h5>
                                        <h5 className="title">{this.state.verification}</h5>

                                    </CardHeader>
                                    <CardBody>
                                        <Form>
                                            {this.state.sellerTable}
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
                                                        <label>Owned Lands</label>
                                                        <Input
                                                            type="text"
                                                            value={this.state.landsOwned}
                                                            onChange={this.updateOwnedLands}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </CardBody>
                                    <CardFooter>
                                        <Button onClick={this.updateSeller} className="btn-fill" color="primary" disabled={!this.state.verified}>
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

export default updateSeller;