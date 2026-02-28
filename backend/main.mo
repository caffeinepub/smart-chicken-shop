import Array "mo:core/Array";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
import Nat32 "mo:core/Nat32";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Char "mo:core/Char";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  /***********
   * Types and State Management
  ************/
  type PaymentType = {
    #cash;
    #online;
    #partial;
    #fullClear;
  };

  type Transaction = {
    id : Text;
    customerId : Text;
    weight : Float;
    rate : Float;
    totalPrice : Float;
    payment : Float;
    paymentType : PaymentType;
    balance : Float;
    timestamp : Time.Time;
    shopName : Text;
    creator : Principal;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Text.compare(t1.id, t2.id);
    };
  };

  type Customer = {
    id : Text;
    name : Text;
    phone : Text;
    address : Text;
    balance : Float;
    principal : Principal;
  };

  module Customer {
    public func compare(a : Customer, b : Customer) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  type Notification = {
    id : Text;
    customerId : Text;
    message : Text;
    isRead : Bool;
    timestamp : Time.Time;
    shopName : Text;
  };

  module Notification {
    public func compare(n1 : Notification, n2 : Notification) : Order.Order {
      Text.compare(n1.id, n2.id);
    };
  };

  type UserProfile = {
    name : Text;
    role : Text; // "admin", "staff", or "customer"
    customerId : ?Text; // linked customer ID for customer role
  };

  // New CustomerView type for public customer portal
  type CustomerPortalView = {
    customer : Customer;
    pendingBalance : Float;
    allTransactions : [Transaction];
    unreadNotifications : [Notification];
    oldestToNewest : [Transaction];
  };

  // Persistent State
  let notificationState = Map.empty<Text, List.List<Notification>>();
  let transactionsState = Map.empty<Text, Transaction>();
  let customersState = Map.empty<Text, Customer>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Admin-configurable kgRate (persistent)
  var currentKgRate : Float = 140.0;

  // Authorization System State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  /***********
   * Utility Functions
  ************/
  func generateUniqueId(prefix : Text) : Text {
    let time = Time.now();
    let chars = prefix.toArray().concat(['0', '0', '0', '0', '0', '0']);
    if (chars.size() > 6) {
      let truncatedChars = chars.sliceToArray(0, 6);
      Text.fromArray(truncatedChars).concat(time.toText());
    } else {
      Text.fromArray(chars).concat(time.toText());
    };
  };

  func isLinkedCustomer(caller : Principal, customerId : Text) : Bool {
    switch (customersState.get(customerId)) {
      case (null) { false };
      case (?customer) { customer.principal == caller };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their profile");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  /***********
   * Customer Management
  ************/
  public shared ({ caller }) func createCustomer(name : Text, phone : Text, address : Text) : async Text {
    // Only admins and staff (users) can create customers
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only admins and staff can create customers");
    };

    if (name.trim(#char ' ') == "") {
      Runtime.trap("Customer name cannot be empty");
    };

    let customerId = generateUniqueId("CUST-");
    let customer : Customer = {
      id = customerId;
      name;
      phone;
      address;
      balance = 0.0;
      principal = caller;
    };
    customersState.add(customerId, customer);
    customerId;
  };

  public query ({ caller }) func getCustomer(customerId : Text) : async Customer {
    // Admins and staff can view any customer; customers can only view their own record
    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      // staff or admin: allowed
    } else if (AccessControl.hasPermission(accessControlState, caller, #guest)) {
      // guest/customer: only their own
      if (not isLinkedCustomer(caller, customerId)) {
        Runtime.trap("Unauthorized: Customers can only view their own record");
      };
    } else {
      Runtime.trap("Unauthorized: Please log in to view customer data");
    };

    switch (customersState.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    // Only admins and staff can list all customers
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only admins and staff can list all customers");
    };
    customersState.values().toArray();
  };

  public shared ({ caller }) func createTransaction(
    customerId : Text,
    weight : Float,
    payment : Float,
    paymentType : PaymentType,
    shopName : Text
  ) : async { transactionId : Text; remainingBalance : Float } {
    // Only admins and staff can create transactions
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only admins and staff can create transactions");
    };

    let customer = switch (customersState.get(customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?found) { found };
    };

    if (weight == 0.0 or currentKgRate == 0.0 or payment < 0.0) {
      Runtime.trap("Invalid transaction values");
    };

    let totalPrice = weight * currentKgRate;
    let newBalance = customer.balance + totalPrice - payment;

    let transactionId = generateUniqueId("TXN-");
    let transaction : Transaction = {
      id = transactionId;
      customerId;
      weight;
      rate = currentKgRate;
      totalPrice;
      payment;
      paymentType;
      balance = if (newBalance < 0.0) { 0.0 } else { newBalance };
      timestamp = Time.now();
      shopName;
      creator = caller;
    };

    // Update customer balance
    let updatedCustomer = {
      id = customer.id;
      name = customer.name;
      phone = customer.phone;
      address = customer.address;
      balance = transaction.balance;
      principal = customer.principal;
    };

    customersState.add(customerId, updatedCustomer);
    transactionsState.add(transactionId, transaction);

    {
      transactionId;
      remainingBalance = transaction.balance;
    };
  };

  /***********
   * Admin-Configurable kgRate
  ************/
  public shared ({ caller }) func setKgRate(newRate : Float) : async () {
    // Only admins can update the rate
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set the price per kg");
    };

    if (newRate <= 0.0) {
      Runtime.trap("Rate must be greater than 0");
    };

    currentKgRate := newRate;
  };

  public query ({ caller }) func getCurrentKgRate() : async Float {
    currentKgRate;
  };

  /***********
   * Notification System
  ************/
  public shared ({ caller }) func sendNotification(customerId : Text, message : Text, shopName : Text) : async Text {
    // Only admins and staff can send notifications
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only admins and staff can send notifications");
    };

    let notificationId = generateUniqueId("NTF-");
    let notification : Notification = {
      id = notificationId;
      customerId;
      message;
      isRead = false;
      timestamp = Time.now();
      shopName;
    };

    let existingNotifications = switch (notificationState.get(customerId)) {
      case (null) { List.empty<Notification>() };
      case (?found) { found };
    };

    existingNotifications.add(notification);
    notificationState.add(customerId, existingNotifications);

    notificationId;
  };

  public query ({ caller }) func getUnreadNotifications(customerId : Text) : async [Notification] {
    // Must be authenticated (not anonymous)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      // Not staff/admin — must be the linked customer
      if (not isLinkedCustomer(caller, customerId)) {
        Runtime.trap("Unauthorized: Customers can only view their own notifications");
      };
    };
    // Staff and admins can view any customer's notifications

    let notifications = switch (notificationState.get(customerId)) {
      case (null) { List.empty<Notification>() };
      case (?found) { found };
    };

    notifications.filter(func(n) { not n.isRead }).toArray();
  };

  public shared ({ caller }) func markNotificationsRead(customerId : Text) : async () {
    // Must be authenticated (not anonymous)
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      // Not staff/admin — must be the linked customer
      if (not isLinkedCustomer(caller, customerId)) {
        Runtime.trap("Unauthorized: Customers can only mark their own notifications as read");
      };
    };
    // Staff and admins can mark any customer's notifications as read

    let notifications = switch (notificationState.get(customerId)) {
      case (null) { List.empty<Notification>() };
      case (?found) { found };
    };

    let updatedNotifications = notifications.map<Notification, Notification>(func(n) {
      {
        id = n.id;
        customerId = n.customerId;
        message = n.message;
        isRead = true;
        timestamp = n.timestamp;
        shopName = n.shopName;
      }
    });
    notificationState.add(customerId, updatedNotifications);
  };

  public query ({ caller }) func getDailyStats(shopName : Text) : async {
    totalSales : Float;
    totalPayments : Float;
    totalBalance : Float;
  } {
    // Only admins can access dashboard stats
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access this data");
    };

    let now = Time.now();
    let dayStart = now - 24 * 3600 * 1000000000;
    var dailySales : Float = 0.0;
    var dailyPayments : Float = 0.0;
    var totalBalance : Float = 0.0;

    for ((_, transaction) in transactionsState.entries()) {
      if (transaction.shopName == shopName) {
        if (transaction.timestamp >= dayStart) {
          dailySales += transaction.totalPrice;
          dailyPayments += transaction.payment;
        };
        totalBalance += transaction.balance;
      };
    };

    {
      totalSales = dailySales;
      totalPayments = dailyPayments;
      totalBalance;
    };
  };

  public query ({ caller }) func getWeeklyStats(shopName : Text) : async {
    totalSales : Float;
    totalPayments : Float;
    totalBalance : Float;
  } {
    // Only admins can access dashboard stats
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access this data");
    };

    let now = Time.now();
    let weekStart = now - 7 * 24 * 3600 * 1000000000;
    var weeklySales : Float = 0.0;
    var weeklyPayments : Float = 0.0;
    var totalBalance : Float = 0.0;

    for ((_, transaction) in transactionsState.entries()) {
      if (transaction.shopName == shopName) {
        if (transaction.timestamp >= weekStart) {
          weeklySales += transaction.totalPrice;
          weeklyPayments += transaction.payment;
        };
        totalBalance += transaction.balance;
      };
    };

    {
      totalSales = weeklySales;
      totalPayments = weeklyPayments;
      totalBalance;
    };
  };

  public query ({ caller }) func getMonthlyStats(shopName : Text) : async {
    totalSales : Float;
    totalPayments : Float;
    totalBalance : Float;
  } {
    // Only admins can access dashboard stats
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access this data");
    };

    let now = Time.now();
    let monthStart = now - 30 * 24 * 3600 * 1000000000;
    var monthlySales : Float = 0.0;
    var monthlyPayments : Float = 0.0;
    var totalBalance : Float = 0.0;

    for ((_, transaction) in transactionsState.entries()) {
      if (transaction.shopName == shopName) {
        if (transaction.timestamp >= monthStart) {
          monthlySales += transaction.totalPrice;
          monthlyPayments += transaction.payment;
        };
        totalBalance += transaction.balance;
      };
    };

    {
      totalSales = monthlySales;
      totalPayments = monthlyPayments;
      totalBalance;
    };
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    // Only admins can view all transactions
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactionsState.values().toArray();
  };

  /***********
   * Public Customer Portal (CustomerView)
  ************/
  public query ({ caller }) func getCustomerPortalView(customerId : Text) : async ?CustomerPortalView {
    let customer = switch (customersState.get(customerId)) {
      case (null) { return null };
      case (?customer) { customer };
    };

    let transactions = transactionsState.values().filter(func(t) { t.customerId == customerId }).toArray();
    let unreadNotifications = switch (notificationState.get(customerId)) {
      case (null) { List.empty<Notification>() };
      case (?found) { found };
    };

    // Sort transactions from oldest to newest by timestamp
    let oldestToNewestArray = transactions.sort(
      func(a, b) { Nat.compare(a.timestamp.toNat(), b.timestamp.toNat()) }
    );

    ?{
      customer;
      pendingBalance = customer.balance;
      allTransactions = transactions;
      unreadNotifications = unreadNotifications.filter(func(n) { not n.isRead }).toArray();
      oldestToNewest = oldestToNewestArray;
    };
  };

  public query ({ caller }) func getCustomerTransactions(_customerId : Text) : async [Transaction] {
    // This method is now unused by the public portal and could be deprecated
    [];
  };

  public shared ({ caller }) func deleteTransaction(transactionId : Text) : async () {
    // Only admins can delete transactions (staff cannot delete financial history)
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete transactions");
    };

    let transaction = switch (transactionsState.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?found) { found };
    };

    let customer = switch (customersState.get(transaction.customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?found) { found };
    };

    let updatedCustomer = {
      id = customer.id;
      name = customer.name;
      phone = customer.phone;
      address = customer.address;
      balance = customer.balance - transaction.totalPrice + transaction.payment;
      principal = customer.principal;
    };

    customersState.add(transaction.customerId, updatedCustomer);
    transactionsState.remove(transactionId);
  };

  public shared ({ caller }) func deleteCustomer(customerId : Text) : async () {
    // Only admins can delete customers
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };

    customersState.remove(customerId);
    notificationState.remove(customerId);

    let transToDelete = transactionsState.entries().filter(func((_, t)) { t.customerId == customerId }).toArray();
    for ((id, _) in transToDelete.values()) {
      transactionsState.remove(id);
    };
  };

  public shared ({ caller }) func editTransaction(
    transactionId : Text,
    weight : Float,
    payment : Float,
    paymentType : PaymentType,
    shopName : Text
  ) : async () {
    // Only admins can edit transactions
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can edit transactions");
    };

    let oldTransaction = switch (transactionsState.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?found) { found };
    };

    let customer = switch (customersState.get(oldTransaction.customerId)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?found) { found };
    };

    if (weight == 0.0 or currentKgRate == 0.0 or payment < 0.0) {
      Runtime.trap("Invalid transaction values");
    };

    // Reverse old transaction effect on balance, apply new
    let balanceWithoutOld = customer.balance - oldTransaction.balance;
    let newTotalPrice = weight * currentKgRate;
    let newBalance = balanceWithoutOld + newTotalPrice - payment;

    let updatedTransaction : Transaction = {
      id = transactionId;
      customerId = oldTransaction.customerId;
      weight;
      rate = currentKgRate;
      totalPrice = newTotalPrice;
      payment;
      paymentType;
      balance = if (newBalance < 0.0) { 0.0 } else { newBalance };
      timestamp = oldTransaction.timestamp;
      shopName;
      creator = oldTransaction.creator;
    };

    let updatedCustomer = {
      id = customer.id;
      name = customer.name;
      phone = customer.phone;
      address = customer.address;
      balance = updatedTransaction.balance;
      principal = customer.principal;
    };

    transactionsState.add(transactionId, updatedTransaction);
    customersState.add(oldTransaction.customerId, updatedCustomer);
  };
};
