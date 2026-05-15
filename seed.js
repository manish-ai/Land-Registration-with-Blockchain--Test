const Land = artifacts.require("Land");

module.exports = async function(callback) {
  try {
    const accounts = await web3.eth.getAccounts();
    const land = await Land.deployed();

    // Account 0 = Land Inspector (set in constructor)
    const inspector = accounts[0];
    const seller1 = accounts[1];
    const seller2 = accounts[2];
    const buyer1 = accounts[3];
    const buyer2 = accounts[4];

    console.log("=== Seeding Demo Data ===\n");

    // --- Register Sellers ---
    console.log("Registering Seller 1: Rajesh Kumar");
    await land.registerSeller(
      "Rajesh Kumar", 42, "1234-5678-9012", "ABCDE1234F", "3 Lands", "QmSellerDoc1",
      { from: seller1 }
    );

    console.log("Registering Seller 2: Priya Sharma");
    await land.registerSeller(
      "Priya Sharma", 35, "9876-5432-1098", "FGHIJ5678K", "2 Lands", "QmSellerDoc2",
      { from: seller2 }
    );

    // --- Register Buyers ---
    console.log("Registering Buyer 1: Amit Patel");
    await land.registerBuyer(
      "Amit Patel", 30, "Mumbai", "5555-6666-7777", "KLMNO9012P", "QmBuyerDoc1", "amit.patel@email.com",
      { from: buyer1 }
    );

    console.log("Registering Buyer 2: Sneha Reddy");
    await land.registerBuyer(
      "Sneha Reddy", 28, "Hyderabad", "8888-9999-0000", "QRSTU3456V", "QmBuyerDoc2", "sneha.reddy@email.com",
      { from: buyer2 }
    );

    // --- Verify Sellers & Buyers (as Land Inspector) ---
    console.log("\nLand Inspector verifying sellers...");
    await land.verifySeller(seller1, { from: inspector });
    await land.verifySeller(seller2, { from: inspector });

    console.log("Land Inspector verifying buyers...");
    await land.verifyBuyer(buyer1, { from: inspector });
    await land.verifyBuyer(buyer2, { from: inspector });

    // --- Add Lands (as verified sellers) ---
    console.log("\nSeller 1 adding lands...");
    // addLand(area, city, state, price, PID, surveyNum, ipfsHash, document)
    await land.addLand(1200, "Mumbai", "Maharashtra", 5000000, 101, 5001, "QmLandImg1", "QmLandDoc1", { from: seller1 });
    await land.addLand(2500, "Pune", "Maharashtra", 3500000, 102, 5002, "QmLandImg2", "QmLandDoc2", { from: seller1 });
    await land.addLand(800, "Thane", "Maharashtra", 7500000, 103, 5003, "QmLandImg3", "QmLandDoc3", { from: seller1 });

    console.log("Seller 2 adding lands...");
    await land.addLand(3000, "Hyderabad", "Telangana", 4200000, 201, 6001, "QmLandImg4", "QmLandDoc4", { from: seller2 });
    await land.addLand(1500, "Bangalore", "Karnataka", 8900000, 202, 6002, "QmLandImg5", "QmLandDoc5", { from: seller2 });

    // --- Verify Lands (as Land Inspector) ---
    console.log("\nLand Inspector verifying lands...");
    await land.verifyLand(1, { from: inspector });
    await land.verifyLand(2, { from: inspector });
    await land.verifyLand(3, { from: inspector });
    await land.verifyLand(4, { from: inspector });
    await land.verifyLand(5, { from: inspector });

    // --- Buyer requests a land ---
    console.log("\nBuyer 1 (Amit) requesting Land #1 (Mumbai, 1200 sq ft)...");
    await land.requestLand(seller1, 1, { from: buyer1 });

    console.log("Buyer 2 (Sneha) requesting Land #4 (Hyderabad, 3000 sq ft)...");
    await land.requestLand(seller2, 4, { from: buyer2 });

    // --- Seller approves one request ---
    console.log("\nSeller 1 approving request #1...");
    await land.approveRequest(1, { from: seller1 });

    // --- Print summary ---
    const landsCount = await land.getLandsCount();
    const sellersCount = await land.getSellersCount();
    const buyersCount = await land.getBuyersCount();
    const requestsCount = await land.getRequestsCount();

    console.log("\n=== Demo Data Summary ===");
    console.log(`Sellers: ${sellersCount}`);
    console.log(`Buyers: ${buyersCount}`);
    console.log(`Lands: ${landsCount}`);
    console.log(`Requests: ${requestsCount}`);
    console.log(`\nLand Inspector (Account 0): ${inspector}`);
    console.log(`Seller 1 - Rajesh Kumar (Account 1): ${seller1}`);
    console.log(`Seller 2 - Priya Sharma (Account 2): ${seller2}`);
    console.log(`Buyer 1 - Amit Patel (Account 3): ${buyer1}`);
    console.log(`Buyer 2 - Sneha Reddy (Account 4): ${buyer2}`);
    console.log(`\nRequest #1: Amit wants Land #1 (Mumbai) - APPROVED by seller, pending payment`);
    console.log(`Request #2: Sneha wants Land #4 (Hyderabad) - Pending seller approval`);

    console.log("\n=== Seeding Complete! ===");
    callback();
  } catch (err) {
    console.error(err);
    callback(err);
  }
};
