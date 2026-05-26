-- 9 Citizens: 8 real + 1 fake (is_verified = 0)
INSERT OR IGNORE INTO citizens (aadhar_number, pan_number, name, age, dob, gender, address, city, state, phone, email, photo_url, is_verified) VALUES
('123456789012', 'ABCDE1234F', 'Rahul Sharma', 32, '1992-03-15', 'Male', '42 MG Road, Indiranagar', 'Bengaluru', 'Karnataka', '9876543210', 'rahul.sharma@email.com', '/photos/rahul.jpg', 1),
('234567890123', 'BCDEF2345G', 'Priya Patel', 28, '1996-07-22', 'Female', '15 Marine Drive', 'Mumbai', 'Maharashtra', '9876543211', 'priya.patel@email.com', '/photos/priya.jpg', 1),
('345678901234', 'CDEFG3456H', 'Amit Kumar', 45, '1979-11-08', 'Male', '78 Connaught Place', 'New Delhi', 'Delhi', '9876543212', 'amit.kumar@email.com', '/photos/amit.jpg', 1),
('456789012345', 'DEFGH4567I', 'Sneha Reddy', 35, '1989-01-30', 'Female', '23 Banjara Hills', 'Hyderabad', 'Telangana', '9876543213', 'sneha.reddy@email.com', '/photos/sneha.jpg', 1),
('567890123456', 'EFGHI5678J', 'Vikram Singh', 50, '1974-05-12', 'Male', '56 MI Road', 'Jaipur', 'Rajasthan', '9876543214', 'vikram.singh@email.com', '/photos/vikram.jpg', 1),
('678901234567', 'FGHIJ6789K', 'Deepa Nair', 30, '1994-09-18', 'Female', '89 MG Road, Ernakulam', 'Kochi', 'Kerala', '9876543215', 'deepa.nair@email.com', '/photos/deepa.jpg', 1),
('789012345678', 'GHIJK7890L', 'Rajesh Gupta', 42, '1982-12-05', 'Male', '34 Park Street', 'Kolkata', 'West Bengal', '9876543216', 'rajesh.gupta@email.com', '/photos/rajesh.jpg', 1),
('890123456789', 'HIJKL8901M', 'Anita Desai', 38, '1986-04-25', 'Female', '67 FC Road', 'Pune', 'Maharashtra', '9876543217', 'anita.desai@email.com', '/photos/anita.jpg', 1),
('999999999999', 'FRAUD9999Z', 'Fake Person', 25, '1999-01-01', 'Male', 'Unknown Address', 'Unknown', 'Unknown', '0000000000', 'fake@fake.com', NULL, 0);

-- 6 Land Records: 1 encumbered (RJ-JPR-2024-005), 1 litigated (KL-KCH-2024-006)
INSERT OR IGNORE INTO land_records (property_pid, survey_number, area, city, state, district, taluk, village, owner_name, owner_aadhar, registration_date, market_value, land_type, has_encumbrance, has_litigation, is_registered_on_chain, latitude, longitude) VALUES
('KA-BLR-2024-001', 'SY-145/A', 2400, 'Bengaluru', 'Karnataka', 'Bengaluru Urban', 'Bengaluru North', 'Hebbal', 'Rahul Sharma', '123456789012', '2020-06-15', 7200000, 'Residential', 0, 0, 0, 13.0358, 77.5970),
('MH-MUM-2024-002', 'SY-302/B', 1800, 'Mumbai', 'Maharashtra', 'Mumbai Suburban', 'Andheri', 'Versova', 'Priya Patel', '234567890123', '2019-03-22', 15000000, 'Commercial', 0, 0, 0, 19.1334, 72.8144),
('DL-NDL-2024-003', 'SY-478/C', 5000, 'New Delhi', 'Delhi', 'New Delhi', 'Chanakyapuri', 'Vasant Vihar', 'Amit Kumar', '345678901234', '2018-11-10', 25000000, 'Residential', 0, 0, 0, 28.5574, 77.1590),
('TS-HYD-2024-004', 'SY-612/D', 3200, 'Hyderabad', 'Telangana', 'Hyderabad', 'Secunderabad', 'Jubilee Hills', 'Sneha Reddy', '456789012345', '2021-01-05', 9600000, 'Residential', 0, 0, 0, 17.4325, 78.4073),
('RJ-JPR-2024-005', 'SY-789/E', 4000, 'Jaipur', 'Rajasthan', 'Jaipur', 'Amber', 'Jagatpura', 'Vikram Singh', '567890123456', '2017-08-20', 12000000, 'Agricultural', 1, 0, 0, 26.8271, 75.8505),
('KL-KCH-2024-006', 'SY-234/F', 1500, 'Kochi', 'Kerala', 'Ernakulam', 'Kochi', 'Fort Kochi', 'Deepa Nair', '678901234567', '2022-04-12', 5500000, 'Commercial', 0, 1, 0, 9.9658, 76.2421);

-- 8 Bank Accounts (one per real citizen, none for fake)
INSERT OR IGNORE INTO bank_accounts (account_number, ifsc, bank_name, holder_name, aadhar_linked, pan_linked, balance, account_type, branch, is_active) VALUES
('SBI-1001-2024', 'SBIN0001234', 'State Bank of India', 'Rahul Sharma', '123456789012', 'ABCDE1234F', 5000000, 'Savings', 'Indiranagar Branch', 1),
('HDFC-2002-2024', 'HDFC0005678', 'HDFC Bank', 'Priya Patel', '234567890123', 'BCDEF2345G', 8500000, 'Savings', 'Marine Drive Branch', 1),
('ICICI-3003-2024', 'ICIC0009012', 'ICICI Bank', 'Amit Kumar', '345678901234', 'CDEFG3456H', 25000000, 'Current', 'Connaught Place Branch', 1),
('AXIS-4004-2024', 'UTIB0003456', 'Axis Bank', 'Sneha Reddy', '456789012345', 'DEFGH4567I', 12000000, 'Savings', 'Banjara Hills Branch', 1),
('BOB-5005-2024', 'BARB0007890', 'Bank of Baroda', 'Vikram Singh', '567890123456', 'EFGHI5678J', 35000000, 'Current', 'MI Road Branch', 1),
('FED-6006-2024', 'FDRL0001234', 'Federal Bank', 'Deepa Nair', '678901234567', 'FGHIJ6789K', 3200000, 'Savings', 'Ernakulam Branch', 1),
('PNB-7007-2024', 'PUNB0005678', 'Punjab National Bank', 'Rajesh Gupta', '789012345678', 'GHIJK7890L', 18000000, 'Savings', 'Park Street Branch', 1),
('KOTAK-8008-2024', 'KKBK0009012', 'Kotak Mahindra Bank', 'Anita Desai', '890123456789', 'HIJKL8901M', 6700000, 'Savings', 'FC Road Branch', 1);
