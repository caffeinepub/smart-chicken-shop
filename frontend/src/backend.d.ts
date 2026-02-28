import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface CustomerPortalView {
    unreadNotifications: Array<Notification>;
    customer: Customer;
    allTransactions: Array<Transaction>;
    pendingBalance: number;
    oldestToNewest: Array<Transaction>;
}
export type Time = bigint;
export interface Notification {
    id: string;
    isRead: boolean;
    message: string;
    timestamp: Time;
    shopName: string;
    customerId: string;
}
export interface Customer {
    id: string;
    principal: Principal;
    balance: number;
    name: string;
    address: string;
    phone: string;
}
export interface UserProfile {
    name: string;
    role: string;
    customerId?: string;
}
export interface Transaction {
    id: string;
    weight: number;
    creator: Principal;
    balance: number;
    rate: number;
    timestamp: Time;
    shopName: string;
    paymentType: PaymentType;
    customerId: string;
    totalPrice: number;
    payment: number;
}
export enum PaymentType {
    cash = "cash",
    fullClear = "fullClear",
    partial = "partial",
    online = "online"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / *********
     * /    * Customer Management
     * /   ***********
     */
    createCustomer(name: string, phone: string, address: string): Promise<string>;
    createTransaction(customerId: string, weight: number, payment: number, paymentType: PaymentType, shopName: string): Promise<{
        remainingBalance: number;
        transactionId: string;
    }>;
    deleteCustomer(customerId: string): Promise<void>;
    deleteTransaction(transactionId: string): Promise<void>;
    editTransaction(transactionId: string, weight: number, payment: number, paymentType: PaymentType, shopName: string): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentKgRate(): Promise<number>;
    getCustomer(customerId: string): Promise<Customer>;
    /**
     * / *********
     * /    * Public Customer Portal (CustomerView)
     * /   ***********
     */
    getCustomerPortalView(customerId: string): Promise<CustomerPortalView | null>;
    getCustomerTransactions(_customerId: string): Promise<Array<Transaction>>;
    getDailyStats(shopName: string): Promise<{
        totalPayments: number;
        totalSales: number;
        totalBalance: number;
    }>;
    getMonthlyStats(shopName: string): Promise<{
        totalPayments: number;
        totalSales: number;
        totalBalance: number;
    }>;
    getUnreadNotifications(customerId: string): Promise<Array<Notification>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWeeklyStats(shopName: string): Promise<{
        totalPayments: number;
        totalSales: number;
        totalBalance: number;
    }>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationsRead(customerId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / *********
     * /    * Notification System
     * /   ***********
     */
    sendNotification(customerId: string, message: string, shopName: string): Promise<string>;
    /**
     * / *********
     * /    * Admin-Configurable kgRate
     * /   ***********
     */
    setKgRate(newRate: number): Promise<void>;
}
