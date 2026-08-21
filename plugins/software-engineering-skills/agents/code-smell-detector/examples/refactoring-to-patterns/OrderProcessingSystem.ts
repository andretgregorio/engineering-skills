/**
 * Order Processing System - Example for Refactoring to Patterns
 *
 * This code contains multiple opportunities for pattern-directed refactoring
 * according to Joshua Kerievsky's "Refactoring to Patterns" principles.
 */

// ============================================================================
// ORDER CLASS - Multiple pattern opportunities
// ============================================================================

export class Order {
  private orderId: string;
  private customerId: string;
  private customerType: string; // "regular", "premium", "vip"
  private status: string; // "pending", "confirmed", "shipped", "delivered", "cancelled"
  private items: OrderItem[];
  private totalAmount: number;
  private createdAt: Date;
  private updatedAt: Date;
  private shippingAddress: string;
  private billingAddress: string;
  private paymentMethod: string;
  private isGiftFlag: boolean;
  private giftMessage: string;
  private discountPercentage: number;
  private promoCode: string;

  // Hard-coded notification targets
  private emailService: EmailService;
  private smsService: SMSService;
  private inventoryService: InventoryService;
  private analyticsService: AnalyticsService;

  // SMELL: Multiple constructors with unclear purposes (Chain Constructors opportunity)
  // In TypeScript, we simulate multiple constructors with optional parameters
  constructor(
    orderId: string,
    customerId: string,
    customerType?: string,
    shippingAddress?: string,
    billingAddress?: string,
    isGift?: boolean,
    giftMessage?: string
  ) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.customerType = customerType ?? 'regular';
    this.shippingAddress = shippingAddress;
    this.billingAddress = billingAddress ?? shippingAddress;
    this.status = 'pending';
    this.items = [];
    this.totalAmount = 0.0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.isGiftFlag = isGift ?? false;
    this.giftMessage = giftMessage;
    this.discountPercentage = 0.0;
    this.emailService = new EmailService();
    this.smsService = new SMSService();
    this.inventoryService = new InventoryService();
    this.analyticsService = new AnalyticsService();
  }

  // SMELL: State-altering conditionals (Replace State-Altering Conditionals with State)
  public confirm(): void {
    if (this.status === 'pending') {
      if (this.items.length === 0) {
        throw new Error('Cannot confirm order with no items');
      }
      this.status = 'confirmed';
      this.updatedAt = new Date();

      // Hard-coded notifications
      this.emailService.sendOrderConfirmation(this);
      this.smsService.sendOrderConfirmation(this);
      this.inventoryService.reserveItems(this);
      this.analyticsService.trackOrderConfirmed(this);
    } else if (this.status === 'confirmed') {
      throw new Error('Order is already confirmed');
    } else if (this.status === 'shipped') {
      throw new Error('Cannot confirm shipped order');
    } else if (this.status === 'delivered') {
      throw new Error('Cannot confirm delivered order');
    } else if (this.status === 'cancelled') {
      throw new Error('Cannot confirm cancelled order');
    }
  }

  public ship(): void {
    if (this.status === 'pending') {
      throw new Error('Cannot ship pending order - must confirm first');
    } else if (this.status === 'confirmed') {
      this.status = 'shipped';
      this.updatedAt = new Date();

      // Hard-coded notifications
      this.emailService.sendShippingNotification(this);
      this.smsService.sendShippingNotification(this);
      this.inventoryService.updateShippedItems(this);
      this.analyticsService.trackOrderShipped(this);
    } else if (this.status === 'shipped') {
      throw new Error('Order is already shipped');
    } else if (this.status === 'delivered') {
      throw new Error('Cannot ship delivered order');
    } else if (this.status === 'cancelled') {
      throw new Error('Cannot ship cancelled order');
    }
  }

  public deliver(): void {
    if (this.status === 'pending') {
      throw new Error('Cannot deliver pending order');
    } else if (this.status === 'confirmed') {
      throw new Error('Cannot deliver unshipped order');
    } else if (this.status === 'shipped') {
      this.status = 'delivered';
      this.updatedAt = new Date();

      // Hard-coded notifications
      this.emailService.sendDeliveryConfirmation(this);
      this.smsService.sendDeliveryConfirmation(this);
      this.analyticsService.trackOrderDelivered(this);
    } else if (this.status === 'delivered') {
      throw new Error('Order is already delivered');
    } else if (this.status === 'cancelled') {
      throw new Error('Cannot deliver cancelled order');
    }
  }

  public cancel(): void {
    if (this.status === 'pending') {
      this.status = 'cancelled';
      this.updatedAt = new Date();

      this.emailService.sendCancellationNotification(this);
      this.analyticsService.trackOrderCancelled(this);
    } else if (this.status === 'confirmed') {
      this.status = 'cancelled';
      this.updatedAt = new Date();

      this.emailService.sendCancellationNotification(this);
      this.smsService.sendCancellationNotification(this);
      this.inventoryService.releaseReservedItems(this);
      this.analyticsService.trackOrderCancelled(this);
    } else if (this.status === 'shipped') {
      throw new Error('Cannot cancel shipped order - request return instead');
    } else if (this.status === 'delivered') {
      throw new Error('Cannot cancel delivered order - request return instead');
    } else if (this.status === 'cancelled') {
      throw new Error('Order is already cancelled');
    }
  }

  // SMELL: Algorithm-selecting conditional (Replace Conditional Logic with Strategy)
  public calculateTotal(): number {
    let subtotal = 0.0;

    for (const item of this.items) {
      subtotal += item.getPrice() * item.getQuantity();
    }

    // Complex pricing logic based on customer type
    let discount = 0.0;
    let shippingCost = 0.0;
    let taxRate = 0.0;

    if (this.customerType === 'regular') {
      // Regular customer pricing
      if (subtotal > 100) {
        discount = subtotal * 0.05; // 5% for orders over $100
      }
      if (subtotal < 50) {
        shippingCost = 9.99;
      } else if (subtotal < 100) {
        shippingCost = 4.99;
      } else {
        shippingCost = 0.0; // Free shipping over $100
      }
      taxRate = 0.08; // 8% tax
    } else if (this.customerType === 'premium') {
      // Premium customer pricing
      discount = subtotal * 0.1; // Always 10% discount
      if (subtotal < 25) {
        shippingCost = 4.99;
      } else {
        shippingCost = 0.0; // Free shipping over $25
      }
      taxRate = 0.08;
    } else if (this.customerType === 'vip') {
      // VIP customer pricing
      discount = subtotal * 0.15; // Always 15% discount
      shippingCost = 0.0; // Always free shipping
      taxRate = 0.05; // Reduced tax rate

      // VIP bonus: extra discount on large orders
      if (subtotal > 500) {
        discount += subtotal * 0.05; // Additional 5%
      }
      if (subtotal > 1000) {
        discount += subtotal * 0.05; // Additional 5% more
      }
    }

    // Apply promo code discount
    if (this.promoCode != null && this.promoCode.length > 0) {
      discount += this.calculatePromoDiscount(subtotal);
    }

    // Apply manual discount percentage
    if (this.discountPercentage > 0) {
      discount += subtotal * (this.discountPercentage / 100.0);
    }

    let total = subtotal - discount + shippingCost;
    total += total * taxRate;

    this.totalAmount = total;
    return total;
  }

  private calculatePromoDiscount(subtotal: number): number {
    // SMELL: Type-switching conditional
    if (this.promoCode.startsWith('PERCENT')) {
      const percent = parseInt(this.promoCode.substring(7));
      return subtotal * (percent / 100.0);
    } else if (this.promoCode.startsWith('FIXED')) {
      return parseFloat(this.promoCode.substring(5));
    } else if (this.promoCode.startsWith('BOGO')) {
      // Buy one get one - find cheapest item
      let cheapest = Number.MAX_VALUE;
      for (const item of this.items) {
        if (item.getPrice() < cheapest) {
          cheapest = item.getPrice();
        }
      }
      return cheapest;
    } else if (this.promoCode === 'FREESHIP') {
      return 0; // Handled elsewhere
    }
    return 0;
  }

  // SMELL: One/many distinctions (Replace One/Many Distinctions with Composite)
  public addItem(item: OrderItem): void {
    this.items.push(item);
    this.updatedAt = new Date();
  }

  public addItems(newItems: OrderItem[]): void {
    for (const item of newItems) {
      this.items.push(item);
    }
    this.updatedAt = new Date();
  }

  public getItemsTotal(): number {
    let total = 0;
    for (const item of this.items) {
      if (item.isBundle()) {
        // Bundle items have special pricing
        for (const bundledItem of item.getBundledItems()) {
          total += bundledItem.getPrice() * bundledItem.getQuantity() * 0.9; // 10% bundle discount
        }
      } else {
        total += item.getPrice() * item.getQuantity();
      }
    }
    return total;
  }

  public getTotalItemCount(): number {
    let count = 0;
    for (const item of this.items) {
      if (item.isBundle()) {
        for (const bundledItem of item.getBundledItems()) {
          count += bundledItem.getQuantity();
        }
      } else {
        count += item.getQuantity();
      }
    }
    return count;
  }

  // Getters
  public getOrderId(): string {
    return this.orderId;
  }
  public getCustomerId(): string {
    return this.customerId;
  }
  public getCustomerType(): string {
    return this.customerType;
  }
  public getStatus(): string {
    return this.status;
  }
  public getItems(): OrderItem[] {
    return this.items;
  }
  public getTotalAmount(): number {
    return this.totalAmount;
  }
  public getShippingAddress(): string {
    return this.shippingAddress;
  }
  public isGift(): boolean {
    return this.isGiftFlag;
  }
  public getGiftMessage(): string {
    return this.giftMessage;
  }

  public setPromoCode(promoCode: string): void {
    this.promoCode = promoCode;
  }
  public setDiscountPercentage(percentage: number): void {
    this.discountPercentage = percentage;
  }
}

// ============================================================================
// ORDER ITEM CLASS - Composite pattern opportunity
// ============================================================================

export class OrderItem {
  private productId: string;
  private productName: string;
  private price: number;
  private quantity: number;
  private isBundleFlag: boolean;
  private bundledItems: OrderItem[];

  constructor(
    productId: string,
    productName: string,
    priceOrBundledItems: number | OrderItem[],
    quantity?: number
  ) {
    this.productId = productId;
    this.productName = productName;

    if (typeof priceOrBundledItems === 'number') {
      this.price = priceOrBundledItems;
      this.quantity = quantity;
      this.isBundleFlag = false;
      this.bundledItems = [];
    } else {
      this.isBundleFlag = true;
      this.bundledItems = priceOrBundledItems;
      this.quantity = 1;
      // Calculate bundle price as sum of items
      this.price = 0;
      for (const item of this.bundledItems) {
        this.price += item.getPrice() * item.getQuantity();
      }
    }
  }

  public getProductId(): string {
    return this.productId;
  }
  public getProductName(): string {
    return this.productName;
  }
  public getPrice(): number {
    return this.price;
  }
  public getQuantity(): number {
    return this.quantity;
  }
  public isBundle(): boolean {
    return this.isBundleFlag;
  }
  public getBundledItems(): OrderItem[] {
    return this.bundledItems;
  }
}

// ============================================================================
// ORDER ACTION HANDLER - Command pattern opportunity
// ============================================================================

export class OrderActionHandler {
  private repository: OrderRepository;
  private auditLogger: AuditLogger;

  constructor(repository: OrderRepository, auditLogger: AuditLogger) {
    this.repository = repository;
    this.auditLogger = auditLogger;
  }

  // SMELL: Conditional dispatcher (Replace Conditional Dispatcher with Command)
  public handleAction(
    action: string,
    order: Order,
    params: Map<string, any>
  ): void {
    if (action === 'confirm') {
      order.confirm();
      this.repository.save(order);
      this.auditLogger.log('Order confirmed: ' + order.getOrderId());
    } else if (action === 'ship') {
      order.ship();
      this.repository.save(order);
      this.auditLogger.log('Order shipped: ' + order.getOrderId());
    } else if (action === 'deliver') {
      order.deliver();
      this.repository.save(order);
      this.auditLogger.log('Order delivered: ' + order.getOrderId());
    } else if (action === 'cancel') {
      const reason = params.get('reason') as string;
      order.cancel();
      this.repository.save(order);
      this.auditLogger.log(
        'Order cancelled: ' + order.getOrderId() + ', reason: ' + reason
      );
    } else if (action === 'update_shipping') {
      const newAddress = params.get('address') as string;
      // Would update shipping address
      this.repository.save(order);
      this.auditLogger.log('Shipping updated for: ' + order.getOrderId());
    } else if (action === 'apply_discount') {
      const discount = params.get('discount') as number;
      order.setDiscountPercentage(discount);
      order.calculateTotal();
      this.repository.save(order);
      this.auditLogger.log('Discount applied to: ' + order.getOrderId());
    } else if (action === 'apply_promo') {
      const promoCode = params.get('promoCode') as string;
      order.setPromoCode(promoCode);
      order.calculateTotal();
      this.repository.save(order);
      this.auditLogger.log('Promo applied to: ' + order.getOrderId());
    } else if (action === 'add_item') {
      const item = params.get('item') as OrderItem;
      order.addItem(item);
      order.calculateTotal();
      this.repository.save(order);
      this.auditLogger.log('Item added to: ' + order.getOrderId());
    } else if (action === 'print_invoice') {
      // Would generate and print invoice
      this.auditLogger.log('Invoice printed for: ' + order.getOrderId());
    } else if (action === 'send_reminder') {
      // Would send reminder email
      this.auditLogger.log('Reminder sent for: ' + order.getOrderId());
    } else {
      throw new Error('Unknown action: ' + action);
    }
  }
}

// ============================================================================
// PAYMENT PROCESSOR - Adapter pattern opportunity
// ============================================================================

export class PaymentProcessor {
  private apiVersion: number;

  constructor(apiVersion: number) {
    this.apiVersion = apiVersion;
  }

  // SMELL: Version-specific conditionals (Extract Adapter)
  public processPayment(
    order: Order,
    details: PaymentDetails
  ): PaymentResult {
    if (this.apiVersion === 1) {
      // Legacy API v1
      const gateway = new LegacyPaymentGateway();
      gateway.setMerchantId('MERCHANT_001');
      gateway.setApiKey('legacy_key_123');

      const legacyParams = new Map<string, string>();
      legacyParams.set(
        'amount',
        String(Math.floor(order.getTotalAmount() * 100))
      ); // cents
      legacyParams.set('currency', 'USD');
      legacyParams.set('card_number', details.getCardNumber());
      legacyParams.set(
        'card_exp',
        details.getExpiryMonth() + '/' + details.getExpiryYear()
      );
      legacyParams.set('card_cvv', details.getCvv());
      legacyParams.set('order_ref', order.getOrderId());

      const response = gateway.submitTransaction(legacyParams);

      if (response.startsWith('OK:')) {
        const transactionId = response.substring(3);
        return new PaymentResult(true, transactionId, null);
      } else {
        return new PaymentResult(false, null, response);
      }
    } else if (this.apiVersion === 2) {
      // Modern API v2
      const api = new ModernPaymentAPI();
      api.authenticate('modern_api_key', 'modern_secret');

      const request = new PaymentRequest();
      request.setAmount(order.getTotalAmount());
      request.setCurrency('USD');
      request.setCardNumber(details.getCardNumber());
      request.setExpiryMonth(details.getExpiryMonth());
      request.setExpiryYear(details.getExpiryYear());
      request.setCvv(details.getCvv());
      request.setOrderReference(order.getOrderId());
      request.setCustomerEmail(details.getEmail());

      const response = api.createCharge(request);

      if (response.isSuccessful()) {
        return new PaymentResult(true, response.getChargeId(), null);
      } else {
        return new PaymentResult(false, null, response.getErrorMessage());
      }
    } else if (this.apiVersion === 3) {
      // Latest API v3 with async support
      const service = new LatestPaymentService();
      service.initialize('v3_credentials');

      const charge = ChargeRequest.builder()
        .amount(order.getTotalAmount())
        .currency('USD')
        .paymentMethod(
          PaymentMethod.card(
            details.getCardNumber(),
            details.getExpiryMonth(),
            details.getExpiryYear(),
            details.getCvv()
          )
        )
        .metadata(
          new Map<string, string>([
            ['order_id', order.getOrderId()],
            ['customer_id', order.getCustomerId()],
          ])
        )
        .build();

      const result = service.charge(charge);

      return new PaymentResult(
        result.getStatus() === ChargeStatus.SUCCEEDED,
        result.getId(),
        result.getFailureReason()
      );
    } else {
      throw new Error('Unsupported API version: ' + this.apiVersion);
    }
  }

  // SMELL: More version-specific code
  public refundPayment(transactionId: string, amount: number): RefundResult {
    if (this.apiVersion === 1) {
      const gateway = new LegacyPaymentGateway();
      gateway.setMerchantId('MERCHANT_001');
      gateway.setApiKey('legacy_key_123');

      const response = gateway.refund(transactionId, Math.floor(amount * 100));
      return new RefundResult(response.startsWith('OK'), response);
    } else if (this.apiVersion === 2) {
      const api = new ModernPaymentAPI();
      api.authenticate('modern_api_key', 'modern_secret');

      const response = api.createRefund(transactionId, amount);
      return new RefundResult(response.isSuccessful(), response.getMessage());
    } else if (this.apiVersion === 3) {
      const service = new LatestPaymentService();
      service.initialize('v3_credentials');

      const result = service.refund(transactionId, amount);
      return result;
    } else {
      throw new Error('Unsupported API version: ' + this.apiVersion);
    }
  }
}

// ============================================================================
// REPORT GENERATOR - Collecting Parameter / Visitor opportunity
// ============================================================================

export class OrderReportGenerator {
  // SMELL: Bulky accumulation method (Move Accumulation to Collecting Parameter)
  public generateReport(orders: Order[]): string {
    let report = '';
    report += '=== ORDER REPORT ===\n';
    report += 'Generated: ' + new Date().toISOString() + '\n';
    report += 'Total Orders: ' + orders.length + '\n';
    report += '\n';

    let totalRevenue = 0;
    let totalItems = 0;
    let pendingCount = 0;
    let confirmedCount = 0;
    let shippedCount = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    for (const order of orders) {
      report += 'Order: ' + order.getOrderId() + '\n';
      report +=
        '  Customer: ' +
        order.getCustomerId() +
        ' (' +
        order.getCustomerType() +
        ')\n';
      report += '  Status: ' + order.getStatus() + '\n';
      report += '  Items:\n';

      for (const item of order.getItems()) {
        if (item.isBundle()) {
          report += '    [BUNDLE] ' + item.getProductName() + '\n';
          for (const bundled of item.getBundledItems()) {
            report +=
              '      - ' +
              bundled.getProductName() +
              ' x' +
              bundled.getQuantity() +
              ' @ $' +
              bundled.getPrice() +
              '\n';
            totalItems += bundled.getQuantity();
          }
        } else {
          report +=
            '    - ' +
            item.getProductName() +
            ' x' +
            item.getQuantity() +
            ' @ $' +
            item.getPrice() +
            '\n';
          totalItems += item.getQuantity();
        }
      }

      report += '  Total: $' + order.getTotalAmount().toFixed(2) + '\n';
      report += '\n';

      totalRevenue += order.getTotalAmount();

      if (order.getStatus() === 'pending') pendingCount++;
      else if (order.getStatus() === 'confirmed') confirmedCount++;
      else if (order.getStatus() === 'shipped') shippedCount++;
      else if (order.getStatus() === 'delivered') deliveredCount++;
      else if (order.getStatus() === 'cancelled') cancelledCount++;
    }

    report += '=== SUMMARY ===\n';
    report += 'Total Revenue: $' + totalRevenue.toFixed(2) + '\n';
    report += 'Total Items Sold: ' + totalItems + '\n';
    report += 'Status Breakdown:\n';
    report += '  Pending: ' + pendingCount + '\n';
    report += '  Confirmed: ' + confirmedCount + '\n';
    report += '  Shipped: ' + shippedCount + '\n';
    report += '  Delivered: ' + deliveredCount + '\n';
    report += '  Cancelled: ' + cancelledCount + '\n';

    return report;
  }

  // SMELL: Type-checking accumulation (Move Accumulation to Visitor)
  public calculateMetrics(entities: object[]): Map<string, number> {
    const metrics = new Map<string, number>();
    let totalOrderValue = 0;
    let totalProductValue = 0;
    let orderCount = 0;
    let productCount = 0;
    let customerCount = 0;
    let customerSpending = 0;

    for (const entity of entities) {
      if (entity instanceof Order) {
        const order = entity as Order;
        totalOrderValue += order.getTotalAmount();
        orderCount++;
      } else if (entity instanceof OrderItem) {
        const item = entity as OrderItem;
        totalProductValue += item.getPrice() * item.getQuantity();
        productCount += item.getQuantity();
      } else if (entity instanceof Customer) {
        const customer = entity as Customer;
        customerCount++;
        customerSpending += customer.getTotalSpent();
      }
    }

    metrics.set('totalOrderValue', totalOrderValue);
    metrics.set(
      'averageOrderValue',
      orderCount > 0 ? totalOrderValue / orderCount : 0
    );
    metrics.set('totalProductValue', totalProductValue);
    metrics.set('productCount', productCount);
    metrics.set('customerCount', customerCount);
    metrics.set(
      'averageCustomerSpending',
      customerCount > 0 ? customerSpending / customerCount : 0
    );

    return metrics;
  }
}

// ============================================================================
// NOTIFICATION SERVICE - Builder opportunity for complex notifications
// ============================================================================

export class NotificationBuilder {
  // SMELL: Complex object construction (Encapsulate Composite with Builder)
  public buildOrderNotification(order: Order, type: string): Notification {
    const notification = new Notification();
    notification.setType(type);
    notification.setRecipientId(order.getCustomerId());
    notification.setTimestamp(new Date());

    // Build content sections manually - tedious and error-prone
    const sections: NotificationSection[] = [];

    const header = new NotificationSection();
    header.setType('header');
    header.setContent('Order ' + order.getOrderId());
    sections.push(header);

    const status = new NotificationSection();
    status.setType('status');
    status.setContent('Status: ' + order.getStatus());
    sections.push(status);

    const itemsSection = new NotificationSection();
    itemsSection.setType('items');
    const itemSubsections: NotificationSection[] = [];
    for (const item of order.getItems()) {
      const itemSection = new NotificationSection();
      itemSection.setType('item');
      itemSection.setContent(
        item.getProductName() + ' x' + item.getQuantity()
      );

      if (item.isBundle()) {
        const bundledSections: NotificationSection[] = [];
        for (const bundled of item.getBundledItems()) {
          const bundledSection = new NotificationSection();
          bundledSection.setType('bundled-item');
          bundledSection.setContent(bundled.getProductName());
          bundledSections.push(bundledSection);
        }
        itemSection.setSubsections(bundledSections);
      }

      itemSubsections.push(itemSection);
    }
    itemsSection.setSubsections(itemSubsections);
    sections.push(itemsSection);

    const footer = new NotificationSection();
    footer.setType('footer');
    footer.setContent('Total: $' + order.getTotalAmount().toFixed(2));
    sections.push(footer);

    if (order.isGift()) {
      const giftSection = new NotificationSection();
      giftSection.setType('gift-message');
      giftSection.setContent(order.getGiftMessage());
      sections.push(giftSection);
    }

    notification.setSections(sections);
    return notification;
  }
}

// ============================================================================
// SUPPORTING CLASSES (Stubs for compilation)
// ============================================================================

export class EmailService {
  public sendOrderConfirmation(order: Order): void {}
  public sendShippingNotification(order: Order): void {}
  public sendDeliveryConfirmation(order: Order): void {}
  public sendCancellationNotification(order: Order): void {}
}

export class SMSService {
  public sendOrderConfirmation(order: Order): void {}
  public sendShippingNotification(order: Order): void {}
  public sendDeliveryConfirmation(order: Order): void {}
  public sendCancellationNotification(order: Order): void {}
}

export class InventoryService {
  public reserveItems(order: Order): void {}
  public updateShippedItems(order: Order): void {}
  public releaseReservedItems(order: Order): void {}
}

export class AnalyticsService {
  public trackOrderConfirmed(order: Order): void {}
  public trackOrderShipped(order: Order): void {}
  public trackOrderDelivered(order: Order): void {}
  public trackOrderCancelled(order: Order): void {}
}

export class OrderRepository {
  public save(order: Order): void {}
  public findById(id: string): Order {
    return null;
  }
}

export class AuditLogger {
  public log(message: string): void {}
}

export class PaymentDetails {
  private cardNumber: string;
  private expiryMonth: number;
  private expiryYear: number;
  private cvv: string;
  private email: string;

  public getCardNumber(): string {
    return this.cardNumber;
  }
  public getExpiryMonth(): number {
    return this.expiryMonth;
  }
  public getExpiryYear(): number {
    return this.expiryYear;
  }
  public getCvv(): string {
    return this.cvv;
  }
  public getEmail(): string {
    return this.email;
  }
}

export class PaymentResult {
  private success: boolean;
  private transactionId: string;
  private error: string;

  constructor(success: boolean, transactionId: string, error: string) {
    this.success = success;
    this.transactionId = transactionId;
    this.error = error;
  }
}

export class RefundResult {
  private success: boolean;
  private message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}

export class Customer {
  private id: string;
  private totalSpent: number;
  public getTotalSpent(): number {
    return this.totalSpent;
  }
}

export class Notification {
  private type: string;
  private recipientId: string;
  private timestamp: Date;
  private sections: NotificationSection[];

  public setType(type: string): void {
    this.type = type;
  }
  public setRecipientId(id: string): void {
    this.recipientId = id;
  }
  public setTimestamp(ts: Date): void {
    this.timestamp = ts;
  }
  public setSections(s: NotificationSection[]): void {
    this.sections = s;
  }
}

export class NotificationSection {
  private type: string;
  private content: string;
  private subsections: NotificationSection[];

  public setType(type: string): void {
    this.type = type;
  }
  public setContent(content: string): void {
    this.content = content;
  }
  public setSubsections(s: NotificationSection[]): void {
    this.subsections = s;
  }
}

// Payment API stubs
export class LegacyPaymentGateway {
  public setMerchantId(id: string): void {}
  public setApiKey(key: string): void {}
  public submitTransaction(params: Map<string, string>): string {
    return 'OK:txn123';
  }
  public refund(txnId: string, amount: number): string {
    return 'OK';
  }
}

export class ModernPaymentAPI {
  public authenticate(key: string, secret: string): void {}
  public createCharge(request: PaymentRequest): PaymentResponse {
    return new PaymentResponse();
  }
  public createRefund(txnId: string, amount: number): RefundResponse {
    return new RefundResponse();
  }
}

export class PaymentRequest {
  public setAmount(amount: number): void {}
  public setCurrency(currency: string): void {}
  public setCardNumber(num: string): void {}
  public setExpiryMonth(month: number): void {}
  public setExpiryYear(year: number): void {}
  public setCvv(cvv: string): void {}
  public setOrderReference(ref: string): void {}
  public setCustomerEmail(email: string): void {}
}

export class PaymentResponse {
  public isSuccessful(): boolean {
    return true;
  }
  public getChargeId(): string {
    return 'charge123';
  }
  public getErrorMessage(): string {
    return null;
  }
}

export class RefundResponse {
  public isSuccessful(): boolean {
    return true;
  }
  public getMessage(): string {
    return 'Refunded';
  }
}

export class LatestPaymentService {
  public initialize(credentials: string): void {}
  public charge(request: ChargeRequest): ChargeResult {
    return new ChargeResult();
  }
  public refund(txnId: string, amount: number): RefundResult {
    return new RefundResult(true, 'OK');
  }
}

export class ChargeRequest {
  public static builder(): ChargeRequestBuilder {
    return new ChargeRequestBuilder();
  }
}

export class ChargeRequestBuilder {
  public amount(a: number): ChargeRequestBuilder {
    return this;
  }
  public currency(c: string): ChargeRequestBuilder {
    return this;
  }
  public paymentMethod(m: PaymentMethod): ChargeRequestBuilder {
    return this;
  }
  public metadata(m: Map<string, string>): ChargeRequestBuilder {
    return this;
  }
  public build(): ChargeRequest {
    return new ChargeRequest();
  }
}

export class PaymentMethod {
  public static card(
    num: string,
    expMonth: number,
    expYear: number,
    cvv: string
  ): PaymentMethod {
    return new PaymentMethod();
  }
}

export class ChargeResult {
  public getStatus(): ChargeStatus {
    return ChargeStatus.SUCCEEDED;
  }
  public getId(): string {
    return 'ch_123';
  }
  public getFailureReason(): string {
    return null;
  }
}

export enum ChargeStatus {
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}
