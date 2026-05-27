import React, { Component } from 'react';
import LandContract from "../artifacts/Land.json";
import getWeb3 from "../getWeb3";
import fileUpload from '../ipfs';
import * as govApi from '../services/govApi';
import { getWalletAddress } from '../services/authService';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col,
} from "reactstrap"; // eslint-disable-line no-unused-vars
import { Spinner, FormFile } from 'react-bootstrap';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';

const INDIA_STATES_CITIES = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Hisar', 'Rohtak'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar'],
  'Karnataka': ['Bangalore', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Alappuzha'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Thane'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur'],
  'Sikkim': ['Gangtok', 'Namchi', 'Mangan'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Noida', 'Ghaziabad'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rishikesh'],
  'West Bengal': ['Kolkata', 'Asansol', 'Siliguri', 'Durgapur', 'Howrah'],
  'Andaman and Nicobar Islands': ['Port Blair'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa'],
  'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Laxmi Nagar', 'Saket'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe'],
};

class AddLand extends Component {
  constructor(props) {
    super(props)

    this.state = {
      LandInstance: undefined,
      account: null,
      web3: null,
      area: '',
      city: '',
      stateLoc: '',
      price: '',
      lands: null,
      verficationStatus: false,
      verified: '',
      registered: '',
      buffer: null,
      file: null,
      ipfsHash: '',
      propertyPID: '',
      surveyNum: '',
      buffer2: null,
      file2: null,
      document: '',
      govLandData: null,
      landLookupDone: false,
      hasEncumbrance: false,
      hasLitigation: false,
    }
    this.captureFile = this.captureFile.bind(this);
    this.addimage = this.addimage.bind(this);
    this.captureDoc = this.captureDoc.bind(this);
    this.addDoc = this.addDoc.bind(this);
  }

  componentDidMount = async () => {
    try {
      //Get network provider and web3 instance
      const web3 = await getWeb3();

      const networkId = await web3.eth.net.getId();
      const deployedNetwork = LandContract.networks[networkId];
      const instance = new web3.eth.Contract(
        LandContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
      const currentAddress = getWalletAddress();
      console.log(currentAddress);
      this.setState({ LandInstance: instance, web3: web3, account: getWalletAddress() });
      var verified = await instance.methods.isVerified(currentAddress).call();
      console.log(verified);
      this.setState({ verified: verified });
      var registered = await instance.methods.isSeller(currentAddress).call();
      console.log(registered);
      this.setState({ registered: registered });


    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  lookupLand = async () => {
    if (!this.state.propertyPID) {
      alert("Please enter a Property PID first.");
      return;
    }
    const result = await govApi.lookupLand(this.state.propertyPID);
    if (result.found) {
      this.setState({
        govLandData: result,
        landLookupDone: true,
        area: result.record.area ? String(result.record.area) : this.state.area,
        city: result.record.city || this.state.city,
        stateLoc: result.record.state || this.state.stateLoc,
        surveyNum: result.record.survey_number || this.state.surveyNum,
        hasEncumbrance: result.record.has_encumbrance || false,
        hasLitigation: result.record.has_litigation || false,
      });
    } else {
      this.setState({ govLandData: result, landLookupDone: true, hasEncumbrance: false, hasLitigation: false });
      alert(result.message || "Land not found in government records.");
    }
  }

  addimage = async () => {
    if (!this.state.file) {
      this.setState({ ipfsHash: '' });
      return;
    }
    try {
      const result = await fileUpload.upload(this.state.file);
      this.setState({ ipfsHash: result.fileId || '' });
      console.log('ipfsHash:', result.fileId);
    } catch (e) {
      console.error('Image upload failed:', e.message);
      this.setState({ ipfsHash: '' });
    }
  }
  addDoc = async () => {
    if (!this.state.file2) {
      this.setState({ document: '' });
      return;
    }
    try {
      const result = await fileUpload.upload(this.state.file2);
      this.setState({ document: result.fileId || '' });
      console.log('document:', result.fileId);
    } catch (e) {
      console.error('Document upload failed:', e.message);
      this.setState({ document: '' });
    }
  }

  addLand = async () => {
    await this.addimage();
    await this.addDoc();
    if (this.state.area == '' || this.state.city == '' || this.state.stateLoc == '' || this.state.price == '' || this.state.propertyPID == '' || this.state.surveyNum == '') {
      alert("All the fields are compulsory!");
    } else if ((!Number(this.state.area)) || (!Number(this.state.price))) {
      alert("Land area and Price of Land must be a number!");
    } else if (this.state.hasEncumbrance || this.state.hasLitigation) {
      alert("Cannot register: this land has encumbrance or litigation issues!");
    } else {
      // Check for duplicates in govt records
      const dupCheck = await govApi.checkDuplicate(this.state.propertyPID, this.state.surveyNum);
      if (dupCheck.isDuplicate) {
        alert("This land is already registered in government records!");
        return;
      }

      await this.state.LandInstance.methods.addLand(
        this.state.area,
        this.state.city,
        this.state.stateLoc,
        this.state.price,
        this.state.propertyPID,
        this.state.surveyNum,
        this.state.ipfsHash,
        this.state.document)
        .send({
          from: this.state.account,
          gas: 2100000
        }).then(async (response) => {
          // Mark as registered in govt records
          const txHash = response.transactionHash || '';
          await govApi.markRegistered(this.state.propertyPID, txHash);
          window.location.href = "/seller/dashboard";
        });
    }
  }
  // _city,string  _state, uint landPrice, uint _propertyPID,uint _surveyNum,string memory _ipfsHash

  updateArea = event => (
    this.setState({ area: event.target.value })
  )
  updateCity = event => (
    this.setState({ city: event.target.value })
  )
  updateState = event => {
    this.setState({ stateLoc: event.target.value, city: '' });
  }
  updatePrice = event => (
    this.setState({ price: event.target.value })
  )
  updatePID = event => (
    this.setState({ propertyPID: event.target.value })
  )
  updateSurveyNum = event => (
    this.setState({ surveyNum: event.target.value })
  )
  captureFile(event) {
    event.preventDefault()
    const file = event.target.files[0]
    if (file) this.setState({ file })
  }
  captureDoc(event) {
    event.preventDefault()
    const file2 = event.target.files[0]
    if (file2) this.setState({ file2 })
  }

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

    if (!this.state.registered || !this.state.verified) {
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
          <Col md="8">
            <Card>
              <CardHeader>
                <h5 className="title">Add Land</h5>
              </CardHeader>
              <CardBody>
                <Form>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Area (in sqm.)</label>
                        <Input
                          placeholder="Area"
                          type="text"
                          value={this.state.area}
                          onChange={this.updateArea}
                        />
                      </FormGroup>
                    </Col>

                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>State</label>
                        <Input
                          type="select"
                          value={this.state.stateLoc}
                          onChange={this.updateState}
                        >
                          <option value="">-- Select State --</option>
                          {Object.keys(INDIA_STATES_CITIES).sort().map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>City</label>
                        <Input
                          type="select"
                          value={this.state.city}
                          onChange={this.updateCity}
                          disabled={!this.state.stateLoc}
                        >
                          <option value="">-- Select City --</option>
                          {(INDIA_STATES_CITIES[this.state.stateLoc] || []).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </Input>
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Price (in ₹)</label>
                        <Input
                          placeholder="e.g. 5000000 for ₹50,00,000"
                          type="number"
                          min="1"
                          value={this.state.price}
                          onChange={this.updatePrice}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Property PID Number</label>
                        <Input
                          placeholder="Property PID"
                          type="text"
                          value={this.state.propertyPID}
                          onChange={this.updatePID}
                        />
                        <Button color="info" size="sm" style={{marginTop: '5px'}} onClick={this.lookupLand}>
                          Lookup in Govt Records
                        </Button>
                        {this.state.govLandData && this.state.govLandData.found && (
                          <span style={{marginLeft: '10px', color: 'green', fontWeight: 'bold'}}>Land found in records</span>
                        )}
                        {(this.state.hasEncumbrance || this.state.hasLitigation) && (
                          <div style={{color: 'red', fontWeight: 'bold', marginTop: '5px'}}>
                            WARNING: This land has {this.state.hasEncumbrance ? 'encumbrance' : ''}{this.state.hasEncumbrance && this.state.hasLitigation ? ' and ' : ''}{this.state.hasLitigation ? 'litigation' : ''} issues. Registration is disabled.
                          </div>
                        )}
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Physical Survey Number</label>
                        <Input
                          placeholder="Survey Num"
                          type="text"
                          value={this.state.surveyNum}
                          onChange={this.updateSurveyNum}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Insert Land Image</label>
                        <FormFile
                          id="File1"
                          onChange={this.captureFile}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row>
                    <Col md="12">
                      <FormGroup>
                        <label>Insert Adhar card document</label>
                        <FormFile
                          id="File2"
                          onChange={this.captureDoc}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
              <CardFooter>
                <Button className="btn-fill" color="primary" onClick={this.addLand} disabled={this.state.hasEncumbrance || this.state.hasLitigation}>
                  Add Land
                </Button>
              </CardFooter>
            </Card>
          </Col>
        </Row>
      </div>
    );

  }
}

export default AddLand;
