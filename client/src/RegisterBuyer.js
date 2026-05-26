import React, { Component } from 'react';
import LandContract from "./artifacts/Land.json";
import getWeb3 from "./getWeb3";
import fileUpload from './ipfs';
import * as govApi from './services/govApi';

import { FormGroup, FormControl, Button, Spinner, FormFile } from 'react-bootstrap'

//import Navigation from './Navigation'

class RegisterBuyer extends Component {
    constructor(props) {
        super(props)

        this.state = {
            LandInstance: undefined,
            account: null,
            web3: null,
            name: '',
            age: '',
            city: '',
            email: '',
            aadharNumber: '',
            panNumber: '',
            aadharVerified: false,
            panVerified: false,
            verificationId: '',
            govData: null,
            aadharResult: null,
            panResult: null,
            buffer2: null,
            documentHash: '',
        }
        this.captureDoc = this.captureDoc.bind(this);
        this.addDoc = this.addDoc.bind(this);
    }

    componentDidMount = async () => {
        try {
            //Get network provider and web3 instance
            const web3 = await getWeb3();

            const accounts = await web3.eth.getAccounts();

            const networkId = await web3.eth.net.getId();
            const deployedNetwork = LandContract.networks[networkId];
            const instance = new web3.eth.Contract(
                LandContract.abi,
                deployedNetwork && deployedNetwork.address,
            );

            // Use accounts[1] for buyer — accounts[0] is already used for seller registration
            this.setState({ LandInstance: instance, web3: web3, account: accounts[2] });


        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };
    verifyAadhar = async () => {
        if (!this.state.aadharNumber || !this.state.name) {
            alert("Please enter both Name and Aadhar Number first.");
            return;
        }
        const result = await govApi.verifyAadhar(this.state.aadharNumber, this.state.name);
        this.setState({ aadharResult: result, aadharVerified: result.verified || false });
        if (result.verified && result.verificationId) {
            this.setState({ verificationId: result.verificationId, govData: result });
        }
    }

    verifyPAN = async () => {
        if (!this.state.panNumber || !this.state.name) {
            alert("Please enter both Name and PAN Number first.");
            return;
        }
        const result = await govApi.verifyPAN(this.state.panNumber, this.state.name);
        this.setState({ panResult: result, panVerified: result.verified || false });
    }

    addDoc = async () => {
        if (!this.state.buffer2) {
          console.log('No document selected, skipping upload');
          this.setState({ documentHash: '' });
          return;
        }
        try {
          const result = await fileUpload.upload(this.state.buffer2);
          this.setState({ documentHash: result.fileId || '' });
          console.log('documentHash:', result.fileId);
        } catch (e) {
          console.error('File upload failed:', e.message);
          this.setState({ documentHash: '' });
        }
      }

    RegisterBuyer = async () => {
        await this.addDoc();
        var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);

        if (this.state.name == '' || this.state.age == '' || this.state.city == '' || this.state.email == '') {
            alert("All the fields are compulsory!");
        } else if (!this.state.aadharVerified || !this.state.panVerified) {
            alert("Please complete Aadhar and PAN verification first!");
        } else if (!Number(this.state.age) || this.state.age < 18) {
            alert("Your age must be a number and at least 18");
        } else if(this.state.email == '' || !pattern.test(this.state.email)){
            alert('Please enter a valid email address\n');
        }
        else{
            await this.state.LandInstance.methods.registerBuyer(
                this.state.name,
                this.state.age,
                this.state.city,
                this.state.email,
                this.state.verificationId,
                this.state.documentHash,
                )

                .send({
                    from : this.state.account,
                    gas : 2100000
                }).then(response => {
                    window.location.href = "/buyer/dashboard";
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
    updateAadhar = event => (
        this.setState({ aadharNumber: event.target.value })
    )
    updatePan = event => (
        this.setState({ panNumber: event.target.value })
    )
    captureDoc(event) {
        event.preventDefault()
        const file2 = event.target.files[0]
        const reader2 = new window.FileReader()
        reader2.readAsArrayBuffer(file2)
        reader2.onloadend = () => {
          this.setState({ buffer2: Buffer(reader2.result) })
          console.log('buffer2', this.state.buffer2)
        }
        console.log('caoture doc...')
      }


    render() {
        if (!this.state.web3) {
            return (
                <div className="bodyC">

                    <div className="img-wrapper">
                        <img src="https://i.pinimg.com/originals/71/6e/00/716e00537e8526347390d64ec900107d.png" className="logo" />
                        <div className="wine-text-container">
                            <div className="site-title wood-text">Land Registry</div>
                        </div>
                    </div>
                    <div className="auth-wrapper">
                        <div className="auth-inner">
                            <div>
                                <div>
                                    <h1>
                                        <Spinner animation="border" variant="warning" />
                                    </h1>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="bodyC">
                <div className="img-wrapper">
                    <img src="https://i.pinimg.com/originals/71/6e/00/716e00537e8526347390d64ec900107d.png" className="logo" />
                    <div className="wine-text-container">
                        <div className="site-title wood-text">Land Registry</div>
                    </div>
                </div>
                <div className="auth-wrapper">
                    <div className="auth-inner">
                        <div className="App">

                            <div>
                                <div>
                                    <h1 style={{color:"black"}}>
                                        Buyer Registration
                  </h1>
                                </div>
                            </div>



                            <div className="form">
                                <FormGroup>
                                    <div className="form-label">
                                        Enter Name --
                      </div>
                                    <div className="form-input">
                                        <FormControl
                                            input='text'
                                            value={this.state.name}
                                            onChange={this.updateName}
                                        />
                                    </div>
                                </FormGroup>

                                <FormGroup>
                                    <div className="form-label">
                                        Enter Age --
                      </div>
                                    <div className="form-input">
                                        <FormControl
                                            input='text'
                                            value={this.state.age}
                                            onChange={this.updateAge}
                                        />
                                    </div>
                                </FormGroup>

                                <FormGroup>
                                    <div className="form-label">
                                        Enter City --
                      </div>
                                    <div className="form-input">
                                        <FormControl
                                            input='text'
                                            value={this.state.city}
                                            onChange={this.updateCity}
                                        />
                                    </div>
                                </FormGroup>

                                <FormGroup>
                                    <div className="form-label">
                                        Enter Email Address --
                      </div>
                                    <div className="form-input">
                                        <FormControl
                                            input='text'
                                            value={this.state.email}
                                            onChange={this.updateEmail}
                                        />
                                    </div>
                                </FormGroup>

                                <FormGroup>
                                    <div className="form-label">
                                        Enter Aadhar No --
                      </div>
                                    <div className="form-input">
                                        <FormControl
                                            input='text'
                                            value={this.state.aadharNumber}
                                            onChange={this.updateAadhar}
                                        />
                                    </div>
                                    <Button onClick={this.verifyAadhar} className="button-vote" style={{marginTop: '5px'}}>
                                        Verify with UIDAI
                                    </Button>
                                    {this.state.aadharResult && (
                                        <span style={{marginLeft: '10px', color: this.state.aadharVerified ? 'green' : 'red', fontWeight: 'bold'}}>
                                            {this.state.aadharVerified ? 'Verified' : ('Failed: ' + (this.state.aadharResult.reason || 'Not verified'))}
                                        </span>
                                    )}
                                </FormGroup>

                                <FormGroup>
                                    <div className="form-label">
                                        Enter PAN No --
                      </div>
                                    <div className="form-input">
                                        <FormControl
                                            input='text'
                                            value={this.state.panNumber}
                                            onChange={this.updatePan}
                                        />
                                    </div>
                                    <Button onClick={this.verifyPAN} className="button-vote" style={{marginTop: '5px'}}>
                                        Verify with Income Tax
                                    </Button>
                                    {this.state.panResult && (
                                        <span style={{marginLeft: '10px', color: this.state.panVerified ? 'green' : 'red', fontWeight: 'bold'}}>
                                            {this.state.panVerified ? 'Verified' : ('Failed: ' + (this.state.panResult.reason || 'Not verified'))}
                                        </span>
                                    )}
                                </FormGroup>

                                <FormGroup>
                                    <label>Upload Identity Document (PDF Format)</label>
                                    <FormFile
                                        id="File2"
                                        onChange={this.captureDoc}
                                    />
                                </FormGroup>

                                <Button onClick={this.RegisterBuyer} disabled={!this.state.aadharVerified || !this.state.panVerified} className="button-vote">
                                    Register on Blockchain
                  </Button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );

    }
}

export default RegisterBuyer;
