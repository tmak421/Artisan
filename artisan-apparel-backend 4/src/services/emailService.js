/**
 * Email Service
 * =============
 * SendGrid integration for customer notifications.
 * Artisan Apparel Backend - Artisan Bitcoin Inc.
 */

const sgMail = require('@sendgrid/mail');
const config = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    sgMail.setApiKey(config.email.apiKey);
    this.from = {
      email: config.email.from,
      name: config.email.fromName,
    };
  }
  
  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(options) {
    try {
      const msg = {
        to: options.to,
        from: this.from,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        ...options.additionalOptions,
      };
      
      await sgMail.send(msg);
      
      logger.info('Email sent', {
        to: options.to,
        subject: options.subject,
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        to: options.to,
        subject: options.subject,
        error: error.message,
      });
      return false;
    }
  }
  
  /**
   * Strip HTML tags for plain text version
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  stripHtml(html) {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Send order confirmation email
   * @param {Object} order - Order data
   * @returns {Promise<boolean>}
   */
  async sendOrderConfirmation(order) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .btn { display: inline-block; background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed</h1>
          </div>
          <div class="content">
            <p>Hi ${order.customer_name || 'there'},</p>
            <p>Thank you for your order! Your payment has been confirmed and we've sent your order to production.</p>
            
            <div class="order-details">
              <div class="detail-row">
                <strong>Order ID</strong>
                <span>${order.order_id}</span>
              </div>
              <div class="detail-row">
                <strong>Total</strong>
                <span>$${parseFloat(order.total_usd).toFixed(2)} USD</span>
              </div>
              <div class="detail-row">
                <strong>Payment Method</strong>
                <span>${order.crypto_currency}</span>
              </div>
              <div class="detail-row">
                <strong>Status</strong>
                <span>In Production</span>
              </div>
            </div>
            
            <p>You'll receive another email with tracking information once your order ships (typically 2-5 business days).</p>
            
            <center>
              <a href="${config.urls.orderTrack}/${order.order_id}" class="btn">Track Your Order</a>
            </center>
          </div>
          <div class="footer">
            <p>Artisan Apparel - Ethically Crafted Clothing</p>
            <p>Questions? Reply to this email or visit our website.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: order.customer_email,
      subject: `Order Confirmed - ${order.order_id}`,
      html,
    });
  }
  
  /**
   * Send shipping notification email
   * @param {Object} order - Order data with tracking info
   * @returns {Promise<boolean>}
   */
  async sendShippingNotification(order) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px; background: #f9f9f9; }
          .tracking-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .tracking-number { font-size: 20px; font-weight: bold; color: #1a1a2e; margin: 10px 0; }
          .btn { display: inline-block; background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your Order Has Shipped! 📦</h1>
          </div>
          <div class="content">
            <p>Hi ${order.customer_name || 'there'},</p>
            <p>Great news! Your Artisan Apparel order is on its way.</p>
            
            <div class="tracking-box">
              <p>Carrier: <strong>${order.carrier || 'USPS'}</strong></p>
              <p class="tracking-number">${order.tracking_number}</p>
              <a href="${order.tracking_url}" class="btn">Track Your Package</a>
            </div>
            
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Estimated Delivery:</strong> 5-7 business days</p>
            
            <p>Thank you for supporting sustainable, ethically-crafted fashion. We hope you love your new pieces!</p>
          </div>
          <div class="footer">
            <p>Artisan Apparel - Ethically Crafted Clothing</p>
            <p>Questions about your order? Reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: order.customer_email,
      subject: `Your Order Has Shipped - ${order.order_id}`,
      html,
    });
  }
  
  /**
   * Send payment pending/reminder email
   * @param {Object} order - Order data
   * @param {Object} payment - Payment details
   * @returns {Promise<boolean>}
   */
  async sendPaymentPending(order, payment) {
    const expiryTime = new Date(payment.expires_at);
    const minutesRemaining = Math.max(0, Math.floor((expiryTime - new Date()) / 60000));
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .payment-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .amount { font-size: 24px; font-weight: bold; color: #1a1a2e; }
          .address { font-family: monospace; background: #f5f5f5; padding: 15px; border-radius: 4px; word-break: break-all; margin: 15px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Complete Your Payment</h1>
          </div>
          <div class="content">
            <p>Your order is awaiting payment. Please send the exact amount to complete your purchase.</p>
            
            <div class="payment-box">
              <p>Send exactly:</p>
              <p class="amount">${payment.expected_amount} ${order.crypto_currency}</p>
              <p>To this address:</p>
              <div class="address">${payment.payment_address}</div>
            </div>
            
            <div class="warning">
              <strong>⏰ Time Remaining:</strong> ${minutesRemaining} minutes<br>
              Payment expires: ${expiryTime.toLocaleString()}
            </div>
            
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Total:</strong> $${parseFloat(order.total_usd).toFixed(2)} USD</p>
            
            <p>Once your payment is confirmed on the blockchain, we'll start processing your order immediately.</p>
          </div>
          <div class="footer">
            <p>Artisan Apparel - Ethically Crafted Clothing</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: order.customer_email,
      subject: `Complete Your Payment - ${order.order_id}`,
      html,
    });
  }
  
  /**
   * Send delivery confirmation / review request email
   * @param {Object} order - Order data
   * @returns {Promise<boolean>}
   */
  async sendDeliveryConfirmation(order) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .btn { display: inline-block; background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 10px; }
          .stars { font-size: 30px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>How Did We Do?</h1>
          </div>
          <div class="content">
            <p>Hi ${order.customer_name || 'there'},</p>
            <p>We hope your Artisan Apparel order has arrived and you're loving your new pieces!</p>
            
            <div style="text-align: center;">
              <div class="stars">⭐⭐⭐⭐⭐</div>
              <p>Your feedback helps us improve and helps other customers make informed decisions.</p>
              <a href="${config.urls.frontend}/review/${order.order_id}" class="btn">Leave a Review</a>
            </div>
            
            <p style="margin-top: 30px;"><strong>Order ID:</strong> ${order.order_id}</p>
            
            <p>Thank you for choosing ethically-crafted, sustainable fashion. We appreciate your support!</p>
          </div>
          <div class="footer">
            <p>Artisan Apparel - Ethically Crafted Clothing</p>
            <p>Questions or issues? Reply to this email - we're here to help.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: order.customer_email,
      subject: `How was your order? - ${order.order_id}`,
      html,
    });
  }
  
  /**
   * Send order cancellation email
   * @param {Object} order - Order data
   * @param {string} reason - Cancellation reason
   * @returns {Promise<boolean>}
   */
  async sendOrderCancellation(order, reason = 'Payment not received') {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .btn { display: inline-block; background: #1a1a2e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${order.customer_name || 'there'},</p>
            <p>Your order <strong>${order.order_id}</strong> has been cancelled.</p>
            
            <p><strong>Reason:</strong> ${reason}</p>
            
            <p>If this was a mistake or you'd like to place a new order, we'd love to have you back!</p>
            
            <center>
              <a href="${config.urls.frontend}" class="btn">Shop Again</a>
            </center>
            
            <p style="margin-top: 30px;">If you have any questions, please don't hesitate to reach out.</p>
          </div>
          <div class="footer">
            <p>Artisan Apparel - Ethically Crafted Clothing</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return this.sendEmail({
      to: order.customer_email,
      subject: `Order Cancelled - ${order.order_id}`,
      html,
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
